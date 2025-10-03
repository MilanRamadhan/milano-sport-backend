// api/index.js
import app, { connectDB } from "../src/server.js";

// Pastikan DB connect saat cold start
await connectDB();

// Ekspor Express app sebagai handler Serverless
export default app;
