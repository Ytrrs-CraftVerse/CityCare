import mongoose from "mongoose";
import connectDB from "./src/config/db";
import Issue from "./src/models/Issue";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env") });

async function run() {
  await connectDB();
  const issue = await Issue.findOne();
  if (!issue) {
    console.log("No issues found");
    process.exit(0);
  }

  console.log("Found issue:", issue._id);
  console.log("Before:", issue.estimatedCost, issue.actualCost);

  const updated = await Issue.findByIdAndUpdate(
    issue._id,
    { estimatedCost: 500, actualCost: 100 },
    { new: true }
  );

  console.log("After:", updated?.estimatedCost, updated?.actualCost);
  process.exit(0);
}

run();
