import express from "express";
import { createBooking, getUserBookings, getBookingById, cancelBooking, getAllBookings, updatePaymentStatus } from "../controllers/bookingController.js";
import { verifyToken } from "../middleware/auth.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

// User
router.post("/", verifyToken, upload.single("proofOfPayment"), createBooking);
router.get("/me", verifyToken, getUserBookings);
router.get("/:id", verifyToken, getBookingById);
router.patch("/:id/cancel", verifyToken, cancelBooking);

// Admin
router.get("/", verifyToken, getAllBookings);
router.patch("/:id/payment", verifyToken, updatePaymentStatus);

export default router;
