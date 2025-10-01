// config/db.js
import mongoose from "mongoose";

// Global cache untuk koneksi database (penting untuk serverless)
let cached = global._mongoose || { conn: null, promise: null };

export const connectDB = async () => {
  // Jika sudah ada koneksi yang aktif, gunakan yang sudah ada
  if (cached.conn && mongoose.connection.readyState === 1) {
    console.log("=> using cached database instance");
    return cached.conn;
  }

  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.error("❌ MONGODB_URI environment variable is not set");
    throw new Error("MONGODB_URI is required");
  }

  try {
    // Jika belum ada promise koneksi, buat baru
    if (!cached.promise) {
      console.log("=> creating new MongoDB connection...");
      console.log("=> Database:", mongoURI.includes("localhost") ? "Local MongoDB" : "MongoDB Atlas");

      // Konfigurasi mongoose untuk optimasi
      mongoose.set("strictQuery", true);
      mongoose.set("bufferCommands", false); // Disable mongoose buffering

      const opts = {
        // Connection Pool Settings
        maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE || 10),
        minPoolSize: Number(process.env.MONGODB_MIN_POOL_SIZE || 1),

        // Timeout Settings
        serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 30000),
        socketTimeoutMS: Number(process.env.MONGODB_SOCKET_TIMEOUT_MS || 60000),
        // connectTimeoutMS: Number(process.env.MONGODB_CONNECT_TIMEOUT_MS || 15000),

        // Database Name
        dbName: process.env.MONGODB_DB || undefined,

        // Heartbeat Settings
        heartbeatFrequencyMS: Number(process.env.MONGODB_HEARTBEAT_FREQUENCY_MS || 10000),

        // Retry Settings
        maxIdleTimeMS: Number(process.env.MONGODB_MAX_IDLE_TIME_MS || 30000),
        retryWrites: true,
        retryReads: true,

        // Network Settings
        family: Number(process.env.MONGODB_IP_FAMILY || 4),
        appName: process.env.MONGODB_APP_NAME || "elaeis-berkelana-backend",
      };

      cached.promise = mongoose
        .connect(mongoURI, opts)
        .then((mongoose) => {
          console.log("✅ MongoDB Connected successfully!");
          console.log("📍 Database name:", mongoose.connection.name);

          // Event listeners untuk monitoring koneksi
          mongoose.connection.on("connected", () => {
            console.log("📡 Mongoose connected to MongoDB");
          });

          mongoose.connection.on("error", (err) => {
            console.error("❌ Mongoose connection error:", err);
          });

          mongoose.connection.on("disconnected", () => {
            console.log("📴 Mongoose disconnected from MongoDB");
          });

          // Cache koneksi di global object
          global._mongoose = { conn: mongoose, promise: null };
          return mongoose;
        })
        .catch((error) => {
          console.error("❌ MongoDB connection error:", error.message);

          // Reset cache supaya percobaan berikutnya membuat koneksi baru
          cached.promise = null;
          cached.conn = null;
          global._mongoose = { conn: null, promise: null };

          if (error.name === "MongoServerSelectionError") {
            console.error("Check that the MongoDB cluster is reachable: IP whitelist, network connectivity, and cluster status.");
            if (!mongoURI.includes("localhost")) {
              console.error("Atlas hint: add your current IP address to the Network Access list or enable 0.0.0.0/0 for testing.");
            }
          } else if (error.code === "ENOTFOUND") {
            console.error("DNS lookup failed. Verify the host name in MONGODB_URI.");
          }

          // Jika menggunakan local MongoDB, berikan pesan bantuan
          if (mongoURI.includes("localhost")) {
            console.warn("💡 Tip: Make sure MongoDB is running locally");
            console.warn("   - Install MongoDB: https://www.mongodb.com/docs/manual/installation/");
            console.warn("   - Start MongoDB service: mongod");
          }

          throw error;
        });
    }

    // Tunggu koneksi selesai
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error.message);
    cached.promise = null; // Reset promise untuk retry berikutnya
    cached.conn = null;
    global._mongoose = { conn: null, promise: null };
    throw error;
  }
};

// Helper function untuk memastikan koneksi database
export const ensureConnection = async () => {
  try {
    await connectDB();
    return true;
  } catch (error) {
    console.error("Failed to ensure database connection:", error.message);
    return false;
  }
};
