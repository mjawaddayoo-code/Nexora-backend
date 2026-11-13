import mongoose from "mongoose";
const reportSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  reason: { type: String, required: true, maxlength: 500 },
  status: { type: String, enum: ["open", "reviewed", "dismissed"], default: "open" }
}, { timestamps: true });
export default mongoose.model("Report", reportSchema);
