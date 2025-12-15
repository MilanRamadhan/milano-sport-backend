import express from "express";
import { getAnalytics } from "../controllers/analyticsController.js";
import { verifyToken, isAdmin } from "../middleware/auth.js";

const router = express.Router();

// Get analytics data (admin only)
router.get("/", verifyToken, isAdmin, getAnalytics);

export default router;
