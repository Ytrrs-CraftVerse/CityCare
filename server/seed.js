const mongoose = require("mongoose");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const User = require("./models/User");

dotenv.config();
connectDB();

const seedAdmin = async () => {
  try {
    await User.deleteMany();

    await User.create({
      name: "Admin",
      email: "admin@citycare.com",
      password: "admin123",
      role: "admin",
    });

    console.log("Admin created");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedAdmin();