import { Router } from "express";
import { z } from "zod";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { execute, rows, transaction } from "../database.js";
import { ApiError, asyncRoute, authenticate } from "../http.js";
import { recordActivity } from "../services/activity.service.js";
import { applyCredits } from "../services/credit.service.js";
import { completeLesson } from "../services/progress.service.js";

const router = Router();
router.use(authenticate);

router.get("/courses", asyncRoute(async (request, response) => {
  const courses = await rows<RowDataPacket[]>(
    `SELECT c.*, i.name category,
      EXISTS(SELECT 1 FROM course_enrollments e WHERE e.course_id=c.id AND e.user_id=?) enrolled,
      CASE WHEN c.credits_required <= (SELECT credits_balance FROM user_profiles WHERE user_id=?) THEN TRUE ELSE FALSE END can_unlock
     FROM courses c LEFT JOIN interests i ON i.id=c.category_interest_id
     WHERE c.is_published=TRUE ORDER BY enrolled DESC, can_unlock DESC, c.created_at DESC`,
    [request.user!.id, request.user!.id],
  );
  response.json(courses);
}));

router.patch("/profile", asyncRoute(async (request, response) => {
  const input = z.object({
    fullName:z.string().min(2).max(120).optional(),bio:z.string().max(500).nullable().optional(),
    phoneNumber:z.string().max(30).nullable().optional(),country:z.string().max(100).nullable().optional(),
    profilePictureUrl:z.url().nullable().optional(),
    experienceLevel:z.enum(["beginner","intermediate","advanced"]).optional(),
    interestIds:z.array(z.number().int().positive()).max(9).optional(),
  }).parse(request.body);
  await transaction(async (connection) => {
    const userFields: Array<[string, string | null]> = [];
    if (input.fullName !== undefined) userFields.push(["full_name", input.fullName]);
    if (input.bio !== undefined) userFields.push(["bio", input.bio]);
    if (input.phoneNumber !== undefined) userFields.push(["phone_number", input.phoneNumber]);
    if (input.country !== undefined) userFields.push(["country", input.country]);
    if (input.profilePictureUrl !== undefined) userFields.push(["profile_picture_url", input.profilePictureUrl]);
    if (userFields.length) await connection.execute(
      `UPDATE users SET ${userFields.map(([field])=>`${field}=?`).join(",")} WHERE id=?`,
      [...userFields.map(([,value])=>value),request.user!.id],
    );
    if (input.experienceLevel) await connection.execute(
      "UPDATE user_profiles SET experience_level=? WHERE user_id=?",
      [input.experienceLevel,request.user!.id],
    );
    if (input.interestIds) {
      await connection.execute("DELETE FROM user_interests WHERE user_id=?",[request.user!.id]);
      for (const [index, interestId] of input.interestIds.entries()) {
        await connection.execute("INSERT INTO user_interests (user_id,interest_id,priority) VALUES (?,?,?)",[request.user!.id,interestId,index+1]);
      }
    }
    await recordActivity(request.user!.id,"profile_updated","Updated profile",request.ip,undefined,connection);
  });
  response.json({ updated:true });
}));

router.post("/courses/:courseId/enroll", asyncRoute(async (request, response) => {
  const courseId = z.coerce.number().int().positive().parse(request.params.courseId);
  const result = await transaction(async (connection) => {
    const [courses] = await connection.execute<RowDataPacket[]>("SELECT * FROM courses WHERE id=? AND is_published=TRUE FOR UPDATE", [courseId]);
    const course = courses[0];
    if (!course) throw new ApiError(404, "Course not found");
    const [created] = await connection.execute<ResultSetHeader>(
      "INSERT IGNORE INTO course_enrollments (user_id,course_id) VALUES (?,?)",
      [request.user!.id, courseId],
    );
    if (!created.affectedRows) throw new ApiError(409, "Already enrolled");
    if (Number(course.credits_required) > 0) {
      await applyCredits(connection, request.user!.id, -Number(course.credits_required), "course_unlock", `unlock:${request.user!.id}:${courseId}`, "course", courseId);
    }
    const [firstLevel] = await connection.execute<RowDataPacket[]>(
      "SELECT id FROM course_levels WHERE course_id=? ORDER BY level_number LIMIT 1", [courseId],
    );
    if (firstLevel[0]) {
      await connection.execute(
        "INSERT IGNORE INTO user_level_progress (user_id,level_id,status) VALUES (?,?,'unlocked')",
        [request.user!.id, firstLevel[0].id],
      );
    }
    await connection.execute("UPDATE user_profiles SET current_learning_path_id=? WHERE user_id=?", [courseId, request.user!.id]);
    await recordActivity(request.user!.id, "course_enrolled", `Enrolled in ${course.name}`, request.ip, { courseId }, connection);
    return { enrolled: true, courseId };
  });
  response.status(201).json(result);
}));

router.get("/roadmap/:courseId", asyncRoute(async (request, response) => {
  const courseId = z.coerce.number().int().positive().parse(request.params.courseId);
  const levels = await rows<RowDataPacket[]>(
    `SELECT cl.id,cl.level_number,cl.title,cl.description,cl.xp_reward,cl.credits_reward,
      COALESCE(ulp.status, IF(cl.level_number=1,'unlocked','locked')) status,
      COALESCE(ulp.completion_percent,0) completion_percent,COALESCE(ulp.stars,0) stars,
      COUNT(l.id) lesson_count,COALESCE(SUM(l.estimated_minutes),0) estimated_minutes
     FROM course_levels cl
     LEFT JOIN lessons l ON l.level_id=cl.id
     LEFT JOIN user_level_progress ulp ON ulp.level_id=cl.id AND ulp.user_id=?
     WHERE cl.course_id=?
     GROUP BY cl.id,ulp.status,ulp.completion_percent,ulp.stars
     ORDER BY cl.level_number`,
    [request.user!.id, courseId],
  );
  response.json(levels);
}));

router.get("/lessons/:lessonId", asyncRoute(async (request, response) => {
  const lessonId = z.coerce.number().int().positive().parse(request.params.lessonId);
  const lessons = await rows<RowDataPacket[]>(
    `SELECT l.*,COALESCE(ulp.status,'not_started') progress_status,
      COALESCE(ulp.completion_percent,0) completion_percent
     FROM lessons l LEFT JOIN user_lesson_progress ulp
       ON ulp.lesson_id=l.id AND ulp.user_id=? WHERE l.id=?`,
    [request.user!.id, lessonId],
  );
  if (!lessons[0]) throw new ApiError(404, "Lesson not found");
  response.json(lessons[0]);
}));

router.post("/lessons/:lessonId/start", asyncRoute(async (request, response) => {
  const lessonId = z.coerce.number().int().positive().parse(request.params.lessonId);
  await execute(
    `INSERT INTO user_lesson_progress (user_id,lesson_id,status,started_at)
     VALUES (?,?,'in_progress',NOW())
     ON DUPLICATE KEY UPDATE status=IF(status='completed','completed','in_progress'),started_at=COALESCE(started_at,NOW())`,
    [request.user!.id, lessonId],
  );
  await recordActivity(request.user!.id, "lesson_started", `Started lesson ${lessonId}`, request.ip, { lessonId });
  response.json({ status: "in_progress" });
}));

router.post("/lessons/:lessonId/complete", asyncRoute(async (request, response) => {
  const lessonId = z.coerce.number().int().positive().parse(request.params.lessonId);
  const input = z.object({ timeSpentSeconds: z.number().int().nonnegative().default(0) }).parse(request.body);
  response.json(await completeLesson(request.user!.id, lessonId, input.timeSpentSeconds));
}));

router.post("/quizzes/:quizId/attempts", asyncRoute(async (request, response) => {
  const quizId=z.coerce.number().int().positive().parse(request.params.quizId);
  const input=z.object({score:z.number().int().min(0).max(100),answers:z.record(z.string(),z.number()).optional()}).parse(request.body);
  const result=await transaction(async(connection)=>{
    const [quizzes]=await connection.execute<RowDataPacket[]>("SELECT passing_score,perfect_score_bonus FROM quizzes WHERE id=?",[quizId]);
    const quiz=quizzes[0]; if(!quiz) throw new ApiError(404,"Quiz not found");
    const passed=input.score>=Number(quiz.passing_score);
    const [attempt]=await connection.execute<ResultSetHeader>(
      "INSERT INTO quiz_attempts (user_id,quiz_id,score,passed,answers_json) VALUES (?,?,?,?,?)",
      [request.user!.id,quizId,input.score,passed,input.answers?JSON.stringify(input.answers):null],
    );
    if(passed) await applyCredits(connection,request.user!.id,15,"quiz_complete",`quiz:${request.user!.id}:${quizId}:${attempt.insertId}`,"quiz",quizId);
    if(input.score===100) await applyCredits(connection,request.user!.id,Number(quiz.perfect_score_bonus),"perfect_quiz",`perfect:${request.user!.id}:${quizId}:${attempt.insertId}`,"quiz",quizId);
    await recordActivity(request.user!.id,"quiz_attempted",`Scored ${input.score}% on quiz`,request.ip,{quizId,score:input.score,passed},connection);
    return {attemptId:attempt.insertId,score:input.score,passed};
  });
  response.status(201).json(result);
}));

router.get("/credits", asyncRoute(async (request, response) => {
  const [profile, transactions] = await Promise.all([
    rows<RowDataPacket[]>("SELECT credits_balance FROM user_profiles WHERE user_id=?", [request.user!.id]),
    rows<RowDataPacket[]>("SELECT * FROM credit_transactions WHERE user_id=? ORDER BY created_at DESC LIMIT 100", [request.user!.id]),
  ]);
  response.json({ balance: profile[0]?.credits_balance ?? 0, transactions });
}));

router.get("/activities", asyncRoute(async (request, response) => {
  response.json(await rows<RowDataPacket[]>(
    "SELECT * FROM user_activities WHERE user_id=? ORDER BY created_at DESC LIMIT 50",
    [request.user!.id],
  ));
}));

router.get("/certificates", asyncRoute(async (request, response) => {
  response.json(await rows<RowDataPacket[]>(
    `SELECT cert.*,c.name course_name,c.completion_requirement,
      COALESCE(ROUND(100*SUM(CASE WHEN ulp.status='completed' THEN 1 ELSE 0 END)/NULLIF(COUNT(cl.id),0)),0) progress
     FROM courses c
     LEFT JOIN course_levels cl ON cl.course_id=c.id
     LEFT JOIN user_level_progress ulp ON ulp.level_id=cl.id AND ulp.user_id=?
     LEFT JOIN certificates cert ON cert.course_id=c.id AND cert.user_id=?
     WHERE EXISTS(SELECT 1 FROM course_enrollments e WHERE e.course_id=c.id AND e.user_id=?)
     GROUP BY c.id,cert.id`,
    [request.user!.id, request.user!.id, request.user!.id],
  ));
}));

router.post("/certificates/:courseId/generate", asyncRoute(async (request, response) => {
  const courseId = z.coerce.number().int().positive().parse(request.params.courseId);
  const certificate = await transaction(async (connection) => {
    const [courseRows] = await connection.execute<RowDataPacket[]>(
      `SELECT c.*,e.status enrollment_status FROM courses c
       JOIN course_enrollments e ON e.course_id=c.id AND e.user_id=?
       WHERE c.id=? FOR UPDATE`,
      [request.user!.id, courseId],
    );
    const course = courseRows[0];
    if (!course || course.enrollment_status !== "completed") throw new ApiError(409, "Complete the full roadmap before generating a certificate");
    const number = `LUM-${courseId}-${request.user!.id}-${Date.now().toString(36).toUpperCase()}`;
    await connection.execute(
      `INSERT INTO certificates
        (user_id,course_id,certificate_number,company_name,certificate_name,status,issued_at)
       VALUES (?,?,?,?,?,'issued',NOW())
       ON DUPLICATE KEY UPDATE status='issued',issued_at=COALESCE(issued_at,NOW())`,
      [request.user!.id, courseId, number, course.certificate_company ?? "Lumio", course.certificate_name ?? course.name],
    );
    await recordActivity(request.user!.id, "certificate_generated", `Generated certificate for ${course.name}`, request.ip, { courseId, number }, connection);
    return { certificateNumber: number, status: "issued" };
  });
  response.status(201).json(certificate);
}));

router.get("/recommendations", asyncRoute(async (request, response) => {
  response.json(await rows<RowDataPacket[]>(
    `SELECT DISTINCT c.* FROM courses c
     JOIN user_interests ui ON ui.interest_id=c.category_interest_id
     WHERE ui.user_id=? AND c.is_published=TRUE
       AND NOT EXISTS(SELECT 1 FROM course_enrollments e WHERE e.user_id=? AND e.course_id=c.id)
     ORDER BY ui.priority,c.difficulty LIMIT 8`,
    [request.user!.id, request.user!.id],
  ));
}));

export default router;
