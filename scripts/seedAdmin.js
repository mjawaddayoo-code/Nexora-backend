import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../src/models/User.js";
dotenv.config();
if (!process.env.MONGO_URI || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || !process.env.JWT_SECRET) {
  console.error("Set MONGO_URI, JWT_SECRET, ADMIN_EMAIL and ADMIN_PASSWORD in .env"); process.exit(1);
}
await mongoose.connect(process.env.MONGO_URI);
const email = process.env.ADMIN_EMAIL.toLowerCase();
const password = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
const admin = await User.findOneAndUpdate(
  { email },
  { name: process.env.ADMIN_NAME || "Platform Admin", email, password, role: "admin", status: "active" },
  { upsert: true, new: true, setDefaultsOnInsert: true }
);
console.log(`Admin ready: ${admin.email}`);
await mongoose.disconnect();
