import express from "express";
import { getFields, getFieldsBySport, getFieldById, getFieldAvailability } from "../controllers/fieldController.js";

const router = express.Router();

// Order matters! Specific routes first, then dynamic :id routes
router.get("/", getFields); // GET /api/fields
router.get("/sport/:sportName", getFieldsBySport); // GET /api/fields/sport/:sportName
router.get("/:id/availability/:date", getFieldAvailability); // GET /api/fields/:id/availability/:date
router.get("/:id", getFieldById); // GET /api/fields/:id - Must be last

export default router;
