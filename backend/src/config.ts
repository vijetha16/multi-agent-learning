import "dotenv/config";
import { z } from "zod";

const environment = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  FRONTEND_URL: z.string().default("http://localhost:3000"),
  POSTGRES_URL: z.string().optional(),
  MYSQL_HOST: z.string().default("127.0.0.1"),
  MYSQL_PORT: z.coerce.number().default(3306),
  MYSQL_DATABASE: z.string().default("lumio_learning"),
  MYSQL_USER: z.string().default("root"),
  MYSQL_PASSWORD: z.string().default(""),
  JWT_SECRET: z.string().min(24).default("development-only-secret-change-me"),
  JWT_EXPIRES_IN: z.string().default("7d"),
}).parse(process.env);

export const config = environment;
