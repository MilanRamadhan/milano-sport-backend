const express = require("express");
const { getFields, getFieldsBySport, getFieldById, getFieldAvailability, createField, updateField, deleteField, getSports } = require("../controllers/fieldController");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes
router.get("/", getFields);
router.get("/sports", getSports);
router.get("/sport/:sportName", getFieldsBySport);
router.get("/:id", getFieldById);
router.get("/:id/availability/:date", getFieldAvailability);

// Protected routes (Admin only)
router.post("/", protect, admin, createField);
router.put("/:id", protect, admin, updateField);
router.delete("/:id", protect, admin, deleteField);

module.exports = router;
