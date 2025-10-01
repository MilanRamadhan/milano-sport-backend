const express = require("express");
const { createBooking, getUserBookings, getBookingById, cancelBooking, uploadProofOfPayment, getAllBookings, updatePaymentStatus } = require("../controllers/bookingController");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

// Protected routes (User)
router.post("/", protect, createBooking);
router.get("/", protect, getUserBookings);
router.get("/:id", protect, getBookingById);
router.put("/:id/cancel", protect, cancelBooking);
router.post("/:id/upload-proof", protect, uploadProofOfPayment);

// Protected routes (Admin only)
router.get("/admin/all", protect, admin, getAllBookings);
router.put("/:id/payment-status", protect, admin, updatePaymentStatus);

module.exports = router;
