require("dotenv").config();
const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const issueRoutes = require("./routes/issueRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Smart City Public Works Feedback API is running",
  });
});

app.use("/api/issues", issueRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
