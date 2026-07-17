import { Router } from "express";
import type { RowDataPacket } from "../database.js";
import { rows } from "../database.js";
import { asyncRoute, authenticate } from "../http.js";

const router = Router();
router.get("/", authenticate, asyncRoute(async (request, response) => {
  const userId = request.user!.id;
  const [summary, currentCourse, recentActivity, recommendations] = await Promise.all([
    rows<RowDataPacket[]>(
      `SELECT p.credits_balance credits,p.daily_streak streak,
       (SELECT COUNT(*) FROM user_lesson_progress WHERE user_id=? AND status='completed') completed_lessons,
       (SELECT COUNT(*) FROM course_enrollments WHERE user_id=? AND status='completed') completed_courses,
       (SELECT COUNT(*) FROM certificates WHERE user_id=? AND status='issued') certificates,
       (SELECT COUNT(*)+1 FROM user_profiles p2 WHERE p2.credits_balance>p.credits_balance) leaderboard_rank
       FROM user_profiles p WHERE p.user_id=?`, [userId, userId, userId, userId],
    ),
    rows<RowDataPacket[]>(
      `SELECT c.id,c.name,c.thumbnail_url,e.status,
       COALESCE(ROUND(100*SUM(CASE WHEN ulp.status='completed' THEN 1 ELSE 0 END)/NULLIF(COUNT(cl.id),0)),0) progress,
       COALESCE(MAX(CASE WHEN ulp.status IN ('unlocked','in_progress') THEN cl.level_number END),1) current_level,
       c.total_levels
       FROM user_profiles p JOIN courses c ON c.id=p.current_learning_path_id
       JOIN course_enrollments e ON e.course_id=c.id AND e.user_id=p.user_id
       LEFT JOIN course_levels cl ON cl.course_id=c.id
       LEFT JOIN user_level_progress ulp ON ulp.level_id=cl.id AND ulp.user_id=p.user_id
       WHERE p.user_id=? GROUP BY c.id,e.status`, [userId],
    ),
    rows<RowDataPacket[]>("SELECT * FROM user_activities WHERE user_id=? ORDER BY created_at DESC LIMIT 6", [userId]),
    rows<RowDataPacket[]>(
      `SELECT DISTINCT c.id,c.name,c.description,c.thumbnail_url,c.difficulty,c.duration_minutes
       FROM courses c JOIN user_interests ui ON ui.interest_id=c.category_interest_id
       WHERE ui.user_id=? AND c.is_published=TRUE
       AND NOT EXISTS(SELECT 1 FROM course_enrollments e WHERE e.user_id=? AND e.course_id=c.id)
       LIMIT 4`, [userId, userId],
    ),
  ]);
  response.json({ summary: summary[0], currentCourse: currentCourse[0] ?? null, recentActivity, recommendations });
}));
export default router;
