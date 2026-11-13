
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";

import authRoutes from "./src/routes/authRoutes.js";
import postRoutes from "./src/routes/postRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import reportRoutes from "./src/routes/reportRoutes.js";

dotenv.config();

const app = express();

// Allowed frontend origins
const allowedOrigins = [
  "https://nexora-beryl-delta.vercel.app",
  "http://localhost:5173",
  ...(process.env.CLIENT_ORIGIN
    ? process.env.CLIENT_ORIGIN.split(",").map(origin => origin.trim())
    : [])
];

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without origin (Postman/server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS: " + origin));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);

app.use(express.json({ limit: "6mb" }));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    name: "NEXORA API"
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reports", reportRoutes);

// Root route
app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "NEXORA Backend Running" });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Server error"
  });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`NEXORA API running on ${PORT}`);
  });
}).catch(err => {
  console.error("Database connection failed:", err);
  process.exit(1);
});
