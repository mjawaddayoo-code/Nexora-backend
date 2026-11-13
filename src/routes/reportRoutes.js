import { Router } from "express";
import Report from "../models/Report.js";
import Post from "../models/Post.js";
import { protect, userOnly } from "../middleware/auth.js";
const router = Router();
router.post("/", protect, userOnly, async (req, res, next) => {
  try {
    const { postId, reason } = req.body;
    if (!await Post.exists({ _id: postId })) return res.status(404).json({ message: "Post not found" });
    await Report.create({ post: postId, reporter: req.user._id, reason: reason || "Inappropriate content" });
    res.status(201).json({ message: "Report submitted for review" });
  } catch (e) { next(e); }
});
export default router;
