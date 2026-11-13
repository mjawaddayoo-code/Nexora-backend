import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  username: { type: String, trim: true, lowercase: true, unique: true, sparse: true, maxlength: 30 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  headline: { type: String, default: "Member of NEXORA", maxlength: 140 },
  bio: { type: String, default: "", maxlength: 1000 },
  avatar: { type: String, default: "" },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  status: { type: String, enum: ["active", "suspended"], default: "active" }
}, { timestamps: true });
export default mongoose.model("User", userSchema);
