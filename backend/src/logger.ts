import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";

export function requestLogger(request: Request, response: Response, next: NextFunction) {
  const requestId = request.header("x-request-id") ?? randomUUID();
  response.setHeader("x-request-id", requestId);
  const startedAt = Date.now();
  response.on("finish", () => {
    console.log(JSON.stringify({
      level: response.statusCode >= 500 ? "error" : response.statusCode >= 400 ? "warn" : "info",
      event: "http_request",
      requestId,
      method: request.method,
      path: request.path,
      status: response.statusCode,
      durationMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    }));
  });
  next();
}
