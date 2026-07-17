import { Router } from "express";
import { z } from "zod";
import type { RowDataPacket } from "mysql2/promise";
import { execute, rows } from "../database.js";
import { asyncRoute, authenticate, requireAdmin } from "../http.js";

const router = Router();
router.use(authenticate, requireAdmin);

const courseInput = z.object({
  name: z.string().min(3).max(180), slug: z.string().min(3).max(190),
  description: z.string().min(10), difficulty: z.enum(["beginner","intermediate","advanced"]),
  durationMinutes: z.number().int().nonnegative(), creditsRequired: z.number().int().nonnegative().default(0),
  certificateCompany: z.string().max(180).optional(), certificateName: z.string().max(180).optional(),
  categoryInterestId: z.number().int().positive().optional(), isPublished: z.boolean().default(false),
});

router.get("/users", asyncRoute(async (_request, response) => {
  response.json(await rows<RowDataPacket[]>(
    `SELECT u.id,u.full_name,u.email,u.country,u.joined_at,u.last_login_at,u.account_status,u.role,
      p.credits_balance,p.daily_streak,(SELECT COUNT(*) FROM course_enrollments e WHERE e.user_id=u.id) enrollments
     FROM users u JOIN user_profiles p ON p.user_id=u.id ORDER BY u.joined_at DESC LIMIT 500`,
  ));
}));

router.get("/analytics", asyncRoute(async (_request, response) => {
  const metrics = await rows<RowDataPacket[]>(
    `SELECT (SELECT COUNT(*) FROM users WHERE role='learner') users,
      (SELECT COUNT(*) FROM courses WHERE is_published=TRUE) published_courses,
      (SELECT COUNT(*) FROM course_enrollments) enrollments,
      (SELECT COUNT(*) FROM user_lesson_progress WHERE status='completed') lessons_completed,
      (SELECT COUNT(*) FROM certificates WHERE status='issued') certificates_issued,
      (SELECT COALESCE(SUM(time_spent_seconds),0) FROM user_lesson_progress) learning_seconds`,
  );
  response.json(metrics[0]);
}));

router.post("/courses", asyncRoute(async (request, response) => {
  const input = courseInput.parse(request.body);
  const result = await execute(
    `INSERT INTO courses
      (name,slug,description,difficulty,duration_minutes,credits_required,certificate_company,certificate_name,category_interest_id,is_published)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [input.name,input.slug,input.description,input.difficulty,input.durationMinutes,input.creditsRequired,input.certificateCompany??null,input.certificateName??null,input.categoryInterestId??null,input.isPublished],
  );
  response.status(201).json({ id: result.insertId, ...input });
}));

router.put("/courses/:id", asyncRoute(async (request, response) => {
  const id = z.coerce.number().int().positive().parse(request.params.id);
  const input = courseInput.partial().parse(request.body);
  const allowed: Record<string,string> = {
    name:"name",slug:"slug",description:"description",difficulty:"difficulty",durationMinutes:"duration_minutes",
    creditsRequired:"credits_required",certificateCompany:"certificate_company",certificateName:"certificate_name",
    categoryInterestId:"category_interest_id",isPublished:"is_published",
  };
  const entries = Object.entries(input);
  if (!entries.length) return response.json({ id, updated: false });
  await execute(`UPDATE courses SET ${entries.map(([key])=>`${allowed[key]}=?`).join(",")} WHERE id=?`, [...entries.map(([,value])=>value), id]);
  response.json({ id, updated: true });
}));

router.delete("/courses/:id", asyncRoute(async (request, response) => {
  const id = z.coerce.number().int().positive().parse(request.params.id);
  await execute("DELETE FROM courses WHERE id=?", [id]);
  response.status(204).send();
}));

router.post("/courses/:courseId/levels", asyncRoute(async (request, response) => {
  const courseId = z.coerce.number().int().positive().parse(request.params.courseId);
  const input = z.object({
    levelNumber:z.number().int().positive(),title:z.string().min(2),description:z.string().optional(),
    xpReward:z.number().int().nonnegative().default(0),creditsReward:z.number().int().nonnegative().default(0),
  }).parse(request.body);
  const result = await execute(
    "INSERT INTO course_levels (course_id,level_number,title,description,xp_reward,credits_reward) VALUES (?,?,?,?,?,?)",
    [courseId,input.levelNumber,input.title,input.description??null,input.xpReward,input.creditsReward],
  );
  await execute("UPDATE courses SET total_levels=(SELECT COUNT(*) FROM course_levels WHERE course_id=?) WHERE id=?", [courseId,courseId]);
  response.status(201).json({ id: result.insertId, ...input });
}));

router.post("/credits/adjust", asyncRoute(async (request, response) => {
  const input = z.object({ userId:z.number().int().positive(), amount:z.number().int(), note:z.string().min(3) }).parse(request.body);
  const key = `admin:${request.user!.id}:${input.userId}:${Date.now()}`;
  await execute(
    "INSERT INTO credit_transactions (user_id,credits_delta,reason,reference_type,idempotency_key) VALUES (?,?,'admin_adjustment',?,?)",
    [input.userId,input.amount,input.note,key],
  );
  await execute("UPDATE user_profiles SET credits_balance=GREATEST(0,credits_balance+?) WHERE user_id=?", [input.amount,input.userId]);
  response.json({ adjusted: true });
}));

export default router;
