import { Router } from "express";
import Post from "../models/Post.js";
import { protect, userOnly } from "../middleware/auth.js";
const router = Router();
const populate = (q) => q.populate("author", "name username headline bio avatar").populate("comments.author", "name username avatar");

router.get("/", protect, userOnly, async (req, res, next) => {
  try { const filter = req.query.author ? { author: req.query.author } : {};
    res.json(await populate(Post.find(filter).sort({ createdAt: -1 }).limit(100))); }
  catch (e) { next(e); }
});
router.post("/", protect, userOnly, async (req, res, next) => {
  try {
    const { text = "", imageUrl = "" } = req.body;
    if (!text.trim() && !imageUrl.trim()) return res.status(400).json({ message: "Write something or add an image URL" });
    const post = await Post.create({ author: req.user._id, text, imageUrl });
    res.status(201).json(await populate(Post.findById(post._id)));
  } catch (e) { next(e); }
});
router.patch("/:id", protect, userOnly, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (!post.author.equals(req.user._id)) return res.status(403).json({ message: "You can only edit your own posts" });
    post.text = req.body.text ?? post.text;
    post.imageUrl = req.body.imageUrl ?? post.imageUrl;
    await post.save();
    res.json(await populate(Post.findById(post._id)));
  } catch (e) { next(e); }
});
router.delete("/:id", protect, userOnly, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (!post.author.equals(req.user._id)) return res.status(403).json({ message: "You can only delete your own posts" });
    await post.deleteOne(); res.json({ message: "Post deleted" });
  } catch (e) { next(e); }
});
router.post("/:id/like", protect, userOnly, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    const i = post.likes.findIndex(id => id.equals(req.user._id));
    if (i >= 0) post.likes.splice(i, 1); else post.likes.push(req.user._id);
    await post.save(); res.json({ likes: post.likes, liked: i < 0 });
  } catch (e) { next(e); }
});
router.post("/:id/comments", protect, userOnly, async (req, res, next) => {
  try {
    const text = req.body.text?.trim();
    if (!text) return res.status(400).json({ message: "Comment cannot be empty" });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    post.comments.push({ author: req.user._id, text });
    await post.save(); res.json(await populate(Post.findById(post._id)));
  } catch (e) { next(e); }
});
export default router;
