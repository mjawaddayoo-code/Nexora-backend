import { Router } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Post from "../models/Post.js";
import Report from "../models/Report.js";
import { protect, adminOnly } from "../middleware/auth.js";
import { makeToken, publicUser } from "../utils/token.js";
const router = Router();
router.post("/login", async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email?.toLowerCase(), role: "admin" }).select("+password");
    if (!user || !(await bcrypt.compare(req.body.password || "", user.password))) return res.status(401).json({ message: "Invalid admin credentials" });
    res.json({ token: makeToken(user._id), user: publicUser(user) });
  } catch (e) { next(e); }
});
router.use(protect, adminOnly);
router.get("/stats", async (_req, res, next) => {
  try {
    const [users, posts, suspended, reports] = await Promise.all([
      User.countDocuments({ role: "user" }), Post.countDocuments(),
      User.countDocuments({ role: "user", status: "suspended" }), Report.countDocuments({ status: "open" })
    ]);
    res.json({ users, posts, suspended, reports });
  } catch (e) { next(e); }
});
router.get("/users", async (req, res, next) => {
  try {
    const q = req.query.q ? { role: "user", $or: [{ name: new RegExp(req.query.q, "i") }, { username: new RegExp(req.query.q, "i") }, { email: new RegExp(req.query.q, "i") }] } : { role: "user" };
    res.json(await User.find(q).sort({ createdAt: -1 }).limit(250));
  } catch (e) { next(e); }
});
router.patch("/users/:id/status", async (req, res, next) => {
  try {
    const status = req.body.status;
    if (!["active", "suspended"].includes(status)) return res.status(400).json({ message: "Invalid status" });
    const user = await User.findOneAndUpdate({ _id: req.params.id, role: "user" }, { status }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user: publicUser(user) });
  } catch (e) { next(e); }
});
router.delete("/users/:id", async (req, res, next) => {
  try {
    const user = await User.findOneAndDelete({ _id: req.params.id, role: "user" });
    if (!user) return res.status(404).json({ message: "User not found" });
    await Post.deleteMany({ author: user._id });
    res.json({ message: "User and their posts deleted" });
  } catch (e) { next(e); }
});
router.get("/posts", async (_req, res, next) => {
  try { res.json(await Post.find().populate("author", "name username email headline bio avatar").sort({ createdAt: -1 }).limit(300)); }
  catch (e) { next(e); }
});
router.delete("/posts/:id", async (req, res, next) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    await Report.deleteMany({ post: post._id });
    res.json({ message: "Post removed by admin" });
  } catch (e) { next(e); }
});
router.get("/reports", async (_req, res, next) => {
  try { res.json(await Report.find().populate("reporter", "name email").populate({ path: "post", populate: { path: "author", select: "name email" } }).sort({ createdAt: -1 }).limit(300)); }
  catch (e) { next(e); }
});
router.patch("/reports/:id", async (req, res, next) => {
  try {
    const status = req.body.status;
    if (!["reviewed", "dismissed"].includes(status)) return res.status(400).json({ message: "Invalid report status" });
    const report = await Report.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!report) return res.status(404).json({ message: "Report not found" });
    res.json(report);
  } catch (e) { next(e); }
});
export default router;
