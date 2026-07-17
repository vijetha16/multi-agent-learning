import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { transaction } from "../database.js";
import { ApiError } from "../http.js";
import { recordActivity } from "./activity.service.js";
import { applyCredits } from "./credit.service.js";

export async function completeLesson(userId: number, lessonId: number, timeSpentSeconds: number) {
  return transaction(async (connection) => {
    const [lessons] = await connection.execute<RowDataPacket[]>(
      `SELECT l.id, l.title, l.level_id, l.credits_reward, cl.course_id, cl.level_number,
              cl.credits_reward AS level_credits
       FROM lessons l JOIN course_levels cl ON cl.id = l.level_id
       WHERE l.id = ? FOR UPDATE`,
      [lessonId],
    );
    const lesson = lessons[0];
    if (!lesson) throw new ApiError(404, "Lesson not found");

    const [progress] = await connection.execute<RowDataPacket[]>(
      "SELECT status FROM user_lesson_progress WHERE user_id = ? AND lesson_id = ? FOR UPDATE",
      [userId, lessonId],
    );
    const firstCompletion = progress[0]?.status !== "completed";

    await connection.execute(
      `INSERT INTO user_lesson_progress
        (user_id, lesson_id, status, completion_percent, time_spent_seconds, started_at, completed_at)
       VALUES (?, ?, 'completed', 100, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE status='completed', completion_percent=100,
         time_spent_seconds=time_spent_seconds+VALUES(time_spent_seconds),
         completed_at=COALESCE(completed_at, NOW())`,
      [userId, lessonId, Math.max(0, timeSpentSeconds)],
    );

    if (firstCompletion) {
      await applyCredits(connection, userId, Number(lesson.credits_reward), "lesson_complete", `lesson:${userId}:${lessonId}`, "lesson", lessonId);
      await recordActivity(userId, "lesson_completed", `Completed ${lesson.title}`, undefined, { lessonId }, connection);
    }

    const [levelStats] = await connection.execute<RowDataPacket[]>(
      `SELECT COUNT(*) total,
        SUM(CASE WHEN ulp.status='completed' THEN 1 ELSE 0 END) completed
       FROM lessons l LEFT JOIN user_lesson_progress ulp
         ON ulp.lesson_id=l.id AND ulp.user_id=?
       WHERE l.level_id=?`,
      [userId, lesson.level_id],
    );
    const total = Number(levelStats[0]?.total ?? 0);
    const completed = Number(levelStats[0]?.completed ?? 0);
    const percent = total ? Math.round((completed / total) * 100) : 0;
    const levelCompleted = percent === 100;

    await connection.execute(
      `INSERT INTO user_level_progress
        (user_id, level_id, status, completion_percent, stars, started_at, completed_at)
       VALUES (?, ?, ?, ?, ?, NOW(), ?)
       ON DUPLICATE KEY UPDATE status=VALUES(status), completion_percent=VALUES(completion_percent),
         stars=GREATEST(stars, VALUES(stars)), started_at=COALESCE(started_at, NOW()),
         completed_at=COALESCE(completed_at, VALUES(completed_at))`,
      [userId, lesson.level_id, levelCompleted ? "completed" : "in_progress", percent, levelCompleted ? 3 : 0, levelCompleted ? new Date() : null],
    );

    if (levelCompleted) {
      await applyCredits(connection, userId, Number(lesson.level_credits), "level_complete", `level:${userId}:${lesson.level_id}`, "level", Number(lesson.level_id));
      const [next] = await connection.execute<RowDataPacket[]>(
        "SELECT id FROM course_levels WHERE course_id=? AND level_number=? LIMIT 1",
        [lesson.course_id, Number(lesson.level_number) + 1],
      );
      if (next[0]) {
        await connection.execute(
          `INSERT INTO user_level_progress (user_id, level_id, status, completion_percent)
           VALUES (?, ?, 'unlocked', 0)
           ON DUPLICATE KEY UPDATE status=IF(status='locked','unlocked',status)`,
          [userId, next[0].id],
        );
      } else {
        await connection.execute(
          "UPDATE course_enrollments SET status='completed', completed_at=COALESCE(completed_at,NOW()) WHERE user_id=? AND course_id=?",
          [userId, lesson.course_id],
        );
        await applyCredits(connection, userId, 100, "course_complete", `course:${userId}:${lesson.course_id}`, "course", Number(lesson.course_id));
      }
      await recordActivity(userId, "roadmap_progress", `Completed level ${lesson.level_number}`, undefined, { levelId: lesson.level_id }, connection);
    }

    return { lessonId, completionPercent: percent, levelCompleted, creditsAwarded: firstCompletion };
  });
}
