import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./routes/authRouter.js"; // pastikan nama file benar
import bookingRouter from "./routes/bookingRoutes.js";
import fieldRouter from "./routes/fieldRoutes.js";

dotenv.config(); // Load environment variables from .env file

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
// Increase payload limit to 50MB for image uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const clientOptions = {
  serverApi: { version: "1", strict: true, deprecationErrors: true },
};

// Koneksi MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, clientOptions);
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    console.error("Koneksi ke MongoDB gagal:", error);
    process.exit(1); // Keluar dari proses jika koneksi gagal
  }
}

// Route test
app.get("/", (req, res) => {
  return res.status(200).json({
    status: 200,
    message: "hello",
  });
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/fields", fieldRouter); // Changed from "/api/" to "/api/fields"

// Start server setelah DB connect
connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch(console.dir);
