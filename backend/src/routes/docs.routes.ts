import { Router } from "express";

const router = Router();
const spec = {
  openapi: "3.1.0",
  info: { title: "Lumio Learning API", version: "1.0.0", description: "API for personalized courses, roadmaps, quizzes, progress, tutoring, certificates, and administration." },
  servers: [{ url: "/api/v1" }],
  components: { securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } } },
  paths: {
    "/health": { get: { summary: "Service health", responses: { "200": { description: "Healthy" } } } },
    "/auth/register": { post: { summary: "Create learner account", responses: { "201": { description: "Created" }, "422": { description: "Invalid input" } } } },
    "/auth/login": { post: { summary: "Sign in", responses: { "200": { description: "Authenticated" }, "401": { description: "Invalid credentials" } } } },
    "/courses": { get: { summary: "List published courses", security: [{ bearerAuth: [] }], responses: { "200": { description: "Course catalog" } } } },
    "/dashboard": { get: { summary: "Learner dashboard", security: [{ bearerAuth: [] }], responses: { "200": { description: "Dashboard summary" } } } },
    "/tutor/ask": { post: { summary: "Ask Lumi", security: [{ bearerAuth: [] }], responses: { "200": { description: "Structured explanation" } } } },
    "/admin/analytics": { get: { summary: "Platform analytics", security: [{ bearerAuth: [] }], responses: { "200": { description: "Analytics" }, "403": { description: "Admin only" } } } },
  },
};

router.get("/", (_request, response) => response.json(spec));
export default router;
