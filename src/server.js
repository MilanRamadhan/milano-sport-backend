import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./routes/authRouter.js";
import bookingRouter from "./routes/bookingRoutes.js";
import fieldRouter from "./routes/fieldRoutes.js";
import adminRouter from "./routes/adminRoutes.js";

dotenv.config();

export const app = express(); // <-- diekspor
const port = process.env.PORT || 5000;
const host = "0.0.0.0";

app.use(
  cors({
    origin: ["http://localhost:8080", process.env.FRONTEND_URL],
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const clientOptions = {
  serverApi: { version: "1", strict: true, deprecationErrors: true },
};

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

export async function connectDB() {
  try {
    if (!MONGO_URI) {
      throw new Error("Missing env MONGO_URI (or MONGODB_URI). Set it in Vercel → Project Settings → Environment Variables.");
    }
    await mongoose.connect(MONGO_URI, {
      serverApi: { version: "1", strict: true, deprecationErrors: true },
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.error("Koneksi ke MongoDB gagal:", error);
    // Di Vercel jangan exit, cukup lempar error
    if (!process.env.VERCEL) process.exit(1);
    throw error;
  }
}

// Route test
app.get("/", (req, res) => {
  return res.status(200).json({
    status: 200,
    message: "MilanoSport API is running",
    version: "1.0.0",
    documentation: "https://github.com/muhammadsyukri19/milanosport-backend",
  });
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/fields", fieldRouter);
app.use("/api/admin", adminRouter);

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
