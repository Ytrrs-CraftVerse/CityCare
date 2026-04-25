import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";

import connectDB from "./config/db";
import { errorHandler } from "./middleware/errorMiddleware";
import { seedAdmin } from "./utils/seed";
import { startEscalationCron } from "./utils/escalation";

import authRoutes from "./routes/authRoutes";
import issueRoutes from "./routes/issueRoutes";
import projectRoutes from "./routes/projectRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import sensorRoutes from "./routes/sensorRoutes";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/sensors", sensorRoutes);

app.get("/", (_req, res) => {
  res.json({
    message: "CityCare API v2 (TypeScript)",
    endpoints: {
      auth: "/api/auth (register, login, me)",
      issues: "/api/issues (CRUD, upvote, comments, verify, stats, duplicates, audit)",
      projects: "/api/projects (participatory budgeting)",
      notifications: "/api/notifications",
      sensors: "/api/sensors (IoT simulation)",
    },
  });
});

app.use(errorHandler);

const PORT: number = parseInt(process.env.PORT || "5000", 10);

connectDB().then(async () => {
  await seedAdmin();
  startEscalationCron();

  app.listen(PORT, () => {
    console.log(`
🚀 CityCare API v2 (TypeScript) is LIVE on port ${PORT}

📦 Endpoints:
   POST   /api/auth/register
   POST   /api/auth/login
   GET    /api/auth/me

   GET    /api/issues
   POST   /api/issues
   GET    /api/issues/stats
   GET    /api/issues/nearby
   GET    /api/issues/duplicates
   GET    /api/issues/digital-twin
   POST   /api/issues/suggest-category
   GET    /api/issues/:id
   PUT    /api/issues/:id
   DELETE /api/issues/:id
   POST   /api/issues/:id/upvote
   POST   /api/issues/:id/comments
   POST   /api/issues/:id/verify
   GET    /api/issues/:id/audit
   GET    /api/issues/:id/audit/verify

   GET    /api/projects
   POST   /api/projects
   POST   /api/projects/:id/vote

   GET    /api/notifications
   GET    /api/notifications/unread-count

   GET    /api/sensors

🔐 Admin:       admin@citycare.com / admin123
🔐 Super-Admin: superadmin@citycare.com / super123
`);
  });
});
