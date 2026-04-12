const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const connectDB = require("./config/db");
const issueRoutes = require("./routes/issueRoutes");
const { errorHandler } = require("./middleware/errorMiddleware");

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/issues", issueRoutes);

// Root route (demo page)
app.get("/", (req, res) => {
  res.send(`
    <h2>Smart City API</h2>
    <p><b>Nearby Issues:</b></p>
    <code>/api/issues/nearby?lat=&lt;LAT&gt;&lng=&lt;LNG&gt;&radius=2000</code>
    <p><b>All Issues:</b></p>
    <a href="/api/issues">/api/issues</a>
    <p><b>Tip:</b> Replace LAT & LNG with your location</p>
  `);
});

// Error middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
🚀 Smart City Backend is LIVE!

🌐 Base URL:
   http://localhost:${PORT}

📍 Nearby Issues API:
   /api/issues/nearby?lat=<LAT>&lng=<LNG>

⚙️ Optional Query Params:
   ➤ radius=<meters> (default: 2000)
   ➤ category=<type>

📦 Available Endpoints:
   GET    /api/issues
   POST   /api/issues
   GET    /api/issues/nearby
   PUT    /api/issues/:id
   DELETE /api/issues/:id

🧪 Example Usage:
   /api/issues/nearby?lat=<your_lat>&lng=<your_lng>&radius=3000

----------------------------------------
MongoDB Connected | Server Ready
----------------------------------------
`);
});