import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ZodError } from "zod";
import { config } from "./config.js";

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

export type AuthenticatedRequest = Request & {
  user?: { id: number; role: "learner" | "admin"; email: string };
};

export function asyncRoute(
  handler: (request: AuthenticatedRequest, response: Response, next: NextFunction) => Promise<unknown>,
) {
  return (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

export function authenticate(request: AuthenticatedRequest, _response: Response, next: NextFunction) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return next(new ApiError(401, "Authentication required"));
  try {
    request.user = jwt.verify(token, config.JWT_SECRET) as AuthenticatedRequest["user"];
    next();
  } catch {
    next(new ApiError(401, "Invalid or expired token"));
  }
}

export function requireAdmin(request: AuthenticatedRequest, _response: Response, next: NextFunction) {
  if (request.user?.role !== "admin") return next(new ApiError(403, "Administrator access required"));
  next();
}

export function notFound(request: Request, _response: Response, next: NextFunction) {
  next(new ApiError(404, `Route ${request.method} ${request.path} was not found`));
}

export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    return response.status(422).json({ error: "Validation failed", details: error.flatten() });
  }
  const apiError = error instanceof ApiError ? error : new ApiError(500, "Internal server error");
  if (!(error instanceof ApiError) && config.NODE_ENV !== "production") console.error(error);
  return response.status(apiError.status).json({ error: apiError.message, details: apiError.details });
}
