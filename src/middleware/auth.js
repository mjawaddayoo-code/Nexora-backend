import jwt from "jsonwebtoken";
import User from "../models/User.js";
export async function protect(req, res, next) {
  try {
    const token = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1] : null;
    if (!token) return res.status(401).json({ message: "Please log in" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "Account not found" });
    if (user.status === "suspended") return res.status(403).json({ message: "Your account is suspended" });
    req.user = user;
    next();
  } catch { res.status(401).json({ message: "Invalid or expired session" }); }
}
export function adminOnly(req, res, next) {
  if (req.user?.role !== "admin") return res.status(403).json({ message: "Admin access required" });
  next();
}
export function userOnly(req, res, next) {
  if (req.user?.role !== "user") return res.status(403).json({ message: "User account required" });
  next();
}
