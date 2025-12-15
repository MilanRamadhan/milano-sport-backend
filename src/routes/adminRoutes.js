import express from "express";
import { getAllUsers, getUserById, updateUserRole, deleteUser, getAllBookings, updateBookingStatus, deleteBooking, getDashboardStats } from "../controllers/adminController.js";
import { verifyToken, isAdmin } from "../middleware/auth.js";

const adminRouter = express.Router();

// Apply authentication and admin check to all routes
adminRouter.use(verifyToken);
adminRouter.use(isAdmin);

// Dashboard
adminRouter.get("/dashboard", getDashboardStats);

// User Management
adminRouter.get("/users", getAllUsers);
adminRouter.get("/users/:userId", getUserById);
adminRouter.put("/users/:userId/role", updateUserRole);
adminRouter.delete("/users/:userId", deleteUser);

// Booking Management
adminRouter.get("/bookings", getAllBookings);
adminRouter.put("/bookings/:bookingId/status", updateBookingStatus);
adminRouter.delete("/bookings/:bookingId", deleteBooking);

export default adminRouter;
