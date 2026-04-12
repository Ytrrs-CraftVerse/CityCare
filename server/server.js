const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const connectDB = require("./config/db");
const issueRoutes = require("./routes/issueRoutes");
const authRoutes = require("./routes/authRoutes");
const { errorHandler } = require("./middleware/errorMiddleware");

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/issues", issueRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
🚀 CityCare Backend is LIVE!

🌐 Base URL:
   http://localhost:${PORT}

🔐 Auth APIs:
   POST   /api/auth/register
   POST   /api/auth/login
   GET    /api/auth/me

📍 Issue APIs:
   GET    /api/issues
   POST   /api/issues
   GET    /api/issues/:id
   PUT    /api/issues/:id
   DELETE /api/issues/:id

📡 Smart Queries:
   GET /api/issues/nearby?lat=<LAT>&lng=<LNG>

🔥 Advanced Features:
   GET    /api/issues/trending
   GET    /api/issues/stats
   PATCH  /api/issues/:id/status

🧪 Example Usage:
   /api/issues/nearby?lat=<your_lat>&lng=<your_lng>&radius=3000

----------------------------------------
✅ MongoDB Connected | Server Ready
----------------------------------------
`);
});