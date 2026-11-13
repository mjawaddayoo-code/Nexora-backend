import { Router } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Post from "../models/Post.js";
import { protect, userOnly } from "../middleware/auth.js";
import { makeToken, publicUser } from "../utils/token.js";
const router = Router();
const cleanUsername = value => String(value || "").trim().toLowerCase().replace(/^@/, "").replace(/[^a-z0-9._]/g, "");
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "Name, email and password are required" });
    if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: "Email is already registered" });
    const base = cleanUsername(name).slice(0, 22) || "member";
    let username = base, suffix = 1;
    while (await User.exists({ username })) username = `${base}${suffix++}`;
    const user = await User.create({ name, username, email, password: await bcrypt.hash(password, 12), role: "user" });
    res.status(201).json({ token: makeToken(user._id), user: publicUser(user) });
  } catch (e) { next(e); }
});
router.post("/login", async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email?.toLowerCase() }).select("+password");
    if (!user || !(await bcrypt.compare(req.body.password || "", user.password))) return res.status(401).json({ message: "Invalid email or password" });
    if (user.status === "suspended") return res.status(403).json({ message: "Account suspended. Contact support." });
    res.json({ token: makeToken(user._id), user: publicUser(user) });
  } catch (e) { next(e); }
});
router.get("/me", protect, (req, res) => res.json({ user: publicUser(req.user) }));
router.patch("/profile", protect, userOnly, async (req, res, next) => {
  try {
    const allowed = ["name", "username", "headline", "bio", "avatar"];
    for (const key of allowed) if (req.body[key] !== undefined) req.user[key] = key === "username" ? cleanUsername(req.body[key]) : req.body[key];
    if (!req.user.name?.trim()) return res.status(400).json({ message: "Name is required" });
    if (req.user.username && !/^[a-z0-9._]{3,30}$/.test(req.user.username)) return res.status(400).json({ message: "Username must be 3–30 characters (letters, numbers, dot or underscore)" });
    await req.user.save();
    res.json({ user: publicUser(req.user) });
  } catch (e) { if (e.code === 11000) return res.status(409).json({ message: "This username is already taken" }); next(e); }
});
router.get("/members/:id", protect, userOnly, async (req, res, next) => {
  try {
    const member = await User.findOne({ _id: req.params.id, role: "user", status: "active" });
    if (!member) return res.status(404).json({ message: "Member profile not found" });
    const posts = await Post.find({ author: member._id }).populate("author", "name username headline avatar").populate("comments.author", "name username avatar").sort({ createdAt: -1 }).limit(100);
    res.json({ user: publicUser(member), posts });
  } catch (e) { next(e); }
});
export default router;
