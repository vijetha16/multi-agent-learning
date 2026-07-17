import { execute, type PoolConnection } from "../database.js";

export type ActivityType =
  | "login" | "logout" | "lesson_started" | "lesson_completed" | "quiz_attempted"
  | "credits_earned" | "course_enrolled" | "roadmap_progress" | "badge_unlocked"
  | "certificate_generated" | "ai_chat_usage" | "search" | "profile_updated";

export async function recordActivity(
  userId: number,
  type: ActivityType,
  description: string,
  ipAddress?: string,
  metadata?: unknown,
  connection?: PoolConnection,
) {
  const sql = `INSERT INTO user_activities
    (user_id, activity_type, description, metadata_json, ip_address)
    VALUES (?, ?, ?, ?, ?)`;
  const values = [userId, type, description, metadata ? JSON.stringify(metadata) : null, ipAddress ?? null];
  if (connection) return connection.execute(sql, values);
  return execute(sql, values);
}
