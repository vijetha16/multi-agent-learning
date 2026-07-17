import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { z } from "zod";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { config } from "../config.js";
import { rows, transaction } from "../database.js";
import { ApiError, asyncRoute, authenticate } from "../http.js";
import { recordActivity } from "../services/activity.service.js";
import { applyCredits } from "../services/credit.service.js";

const router = Router();
const credentials = z.object({ email: z.email(), password: z.string().min(8) });

function tokenFor(user: RowDataPacket) {
  return jwt.sign(
    { id: Number(user.id), email: user.email, role: user.role },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN } as SignOptions,
  );
}

router.post("/register", asyncRoute(async (request, response) => {
  const input = credentials.extend({
    fullName: z.string().min(2).max(120),
    country: z.string().max(100).optional(),
    interests: z.array(z.number().int().positive()).max(9).default([]),
    experienceLevel: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
  }).parse(request.body);

  const result = await transaction(async (connection) => {
    const [existing] = await connection.execute<RowDataPacket[]>("SELECT id FROM users WHERE email=?", [input.email.toLowerCase()]);
    if (existing.length) throw new ApiError(409, "An account with this email already exists");
    const hash = await bcrypt.hash(input.password, 12);
    const [created] = await connection.execute<ResultSetHeader>(
      "INSERT INTO users (full_name,email,password_hash,country) VALUES (?,?,?,?)",
      [input.fullName, input.email.toLowerCase(), hash, input.country ?? null],
    );
    const userId = created.insertId;
    await connection.execute(
      "INSERT INTO user_profiles (user_id,experience_level) VALUES (?,?)",
      [userId, input.experienceLevel],
    );
    for (const [index, interestId] of input.interests.entries()) {
      await connection.execute(
        "INSERT IGNORE INTO user_interests (user_id,interest_id,priority) VALUES (?,?,?)",
        [userId, interestId, index + 1],
      );
    }
    return { id: userId, email: input.email.toLowerCase(), full_name: input.fullName, role: "learner" };
  });
  response.status(201).json({ user: result, token: tokenFor(result as unknown as RowDataPacket) });
}));

router.post("/login", asyncRoute(async (request, response) => {
  const input = credentials.parse(request.body);
  const users = await rows<RowDataPacket[]>("SELECT * FROM users WHERE email=? AND account_status='active' LIMIT 1", [input.email.toLowerCase()]);
  const user = users[0];
  if (!user || !(await bcrypt.compare(input.password, String(user.password_hash)))) throw new ApiError(401, "Invalid email or password");
  await transaction(async (connection) => {
    await connection.execute("UPDATE users SET last_login_at=NOW() WHERE id=?", [user.id]);
    await recordActivity(Number(user.id), "login", "Signed in", request.ip, undefined, connection);
    const dayKey = new Date().toISOString().slice(0, 10);
    await applyCredits(connection, Number(user.id), 5, "daily_login", `daily:${user.id}:${dayKey}`);
  });
  response.json({ user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role }, token: tokenFor(user) });
}));

router.post("/logout", authenticate, asyncRoute(async (request, response) => {
  await recordActivity(request.user!.id, "logout", "Signed out", request.ip);
  response.status(204).send();
}));

router.get("/me", authenticate, asyncRoute(async (request, response) => {
  const users = await rows<RowDataPacket[]>(
    `SELECT u.id,u.full_name,u.email,u.profile_picture_url,u.bio,u.phone_number,u.country,
      u.joined_at,u.last_login_at,u.account_status,u.role,p.experience_level,p.credits_balance,
      p.daily_streak,p.longest_streak
     FROM users u JOIN user_profiles p ON p.user_id=u.id WHERE u.id=?`,
    [request.user!.id],
  );
  response.json(users[0]);
}));

export default router;
