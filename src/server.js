import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./routes/authRouter.js";
import bookingRouter from "./routes/bookingRoutes.js";
import fieldRouter from "./routes/fieldRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import financeRouter from "./routes/financeRoutes.js";
import analyticsRouter from "./routes/analyticsRoutes.js";

dotenv.config();

export const app = express(); // <-- diekspor
const port = process.env.PORT || 5000;
const host = "0.0.0.0";

// CORS Configuration - Allow specific origins
const allowedOrigins = ["http://localhost:5173", "http://localhost:8080", "http://192.168.1.60:5173", "https://milano-sport.vercel.app", "https://milanosport.vercel.app"];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin is in whitelist
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow all localhost origins for development
      if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
        return callback(null, true);
      }

      return callback(null, true); // Temporarily allow all for debugging
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

// cache untuk serverless (Vercel)
let cached = globalThis.__mongoose;
if (!cached) {
  cached = globalThis.__mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!MONGO_URI) {
    throw new Error("Missing env MONGO_URI (or MONGODB_URI). Set it in Vercel Environment Variables.");
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI, {
      serverApi: { version: "1", strict: true, deprecationErrors: true },
    });
  }

  cached.conn = await cached.promise;
  console.log("MongoDB connected (cached)");
  return cached.conn;
}

// Route test (tanpa DB)
app.get("/", (req, res) => {
  return res.status(200).json({
    status: 200,
    message: "MilanoSport API is running",
    version: "1.0.0",
    documentation: "https://github.com/muhammadsyukri19/milanosport-backend",
  });
});

// DB connect khusus semua route /api/*
app.use("/api", async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("DB connect error:", err);
    res.status(500).json({ status: 500, message: "DB connection failed" });
  }
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/fields", fieldRouter);
app.use("/api/admin", adminRouter);
app.use("/api/admin/finance", financeRouter);
app.use("/api/admin/analytics", analyticsRouter);

// HANYA LISTEN saat TIDAK di Vercel (untuk lokal dev)
if (!process.env.VERCEL) {
  connectDB()
    .then(() => {
      app.listen(port, host, () => {
        console.log(`Server running on http://${host}:${port}`);
        console.log(`Access from other devices: http://192.168.1.60:${port}`);
      });
    })
    .catch(console.dir);
}

// Default export untuk di-import oleh handler Vercel
export default app;
