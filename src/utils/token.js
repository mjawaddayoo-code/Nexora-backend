import jwt from "jsonwebtoken";
export const makeToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
export const publicUser = (u) => ({
  _id: u._id, name: u.name, username: u.username || "", email: u.email,
  headline: u.headline, bio: u.bio, avatar: u.avatar, role: u.role,
  status: u.status, createdAt: u.createdAt
});
