import express from "express";
import { createBooking, getUserBookings, getBookingById, cancelBooking, getAllBookings, updatePaymentStatus, syncBookingsToFinance, getBookedSlots } from "../controllers/bookingController.js";
import { verifyToken } from "../middleware/auth.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

// Public (no auth needed for checking availability)
router.get("/booked-slots", getBookedSlots);

// User
router.post("/", verifyToken, upload.single("proofOfPayment"), createBooking);
router.get("/me", verifyToken, getUserBookings);
router.get("/:id", verifyToken, getBookingById);
router.patch("/:id/cancel", verifyToken, cancelBooking);

// Admin
router.get("/", verifyToken, getAllBookings);
router.patch("/:id/payment", verifyToken, updatePaymentStatus);
router.post("/sync-to-finance", verifyToken, syncBookingsToFinance);

export default router;
