import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { ApiError } from "../http.js";
import { recordActivity } from "./activity.service.js";

export type CreditReason =
  | "lesson_complete" | "quiz_complete" | "daily_login" | "weekly_streak"
  | "level_complete" | "perfect_quiz" | "course_complete"
  | "admin_adjustment" | "course_unlock";

export async function applyCredits(
  connection: PoolConnection,
  userId: number,
  amount: number,
  reason: CreditReason,
  idempotencyKey: string,
  referenceType?: string,
  referenceId?: number,
) {
  const [existing] = await connection.execute<RowDataPacket[]>(
    "SELECT id FROM credit_transactions WHERE idempotency_key = ? LIMIT 1",
    [idempotencyKey],
  );
  if (existing.length) return false;

  const [profiles] = await connection.execute<RowDataPacket[]>(
    "SELECT credits_balance FROM user_profiles WHERE user_id = ? FOR UPDATE",
    [userId],
  );
  const balance = Number(profiles[0]?.credits_balance ?? 0);
  if (balance + amount < 0) throw new ApiError(409, "Insufficient credits");

  await connection.execute(
    `INSERT INTO credit_transactions
      (user_id, credits_delta, reason, reference_type, reference_id, idempotency_key)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, amount, reason, referenceType ?? null, referenceId ?? null, idempotencyKey],
  );
  await connection.execute(
    "UPDATE user_profiles SET credits_balance = credits_balance + ? WHERE user_id = ?",
    [amount, userId],
  );
  await recordActivity(
    userId, "credits_earned", `${amount >= 0 ? "Earned" : "Spent"} ${Math.abs(amount)} credits`,
    undefined, { amount, reason, referenceType, referenceId }, connection,
  );
  return true;
}
