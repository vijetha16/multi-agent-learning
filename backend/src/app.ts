import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config.js";
import authRoutes from "./routes/auth.routes.js";
import learningRoutes from "./routes/learning.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { errorHandler, notFound } from "./http.js";

export const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: config.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/v1/health", (_request, response) => response.json({ status: "ok", service: "lumio-api" }));
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1", learningRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use(notFound);
app.use(errorHandler);
