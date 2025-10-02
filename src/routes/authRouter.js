import express from "express";
import { register, login, logout, getProfile, editProfile, changePassword } from "../controllers/authController.js";
import { verifyToken } from "../middleware/auth.js";

const authRouter = express.Router();

// Public routes
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", logout);

// Protected routes (require authentication)
authRouter.get("/profile", verifyToken, getProfile);
authRouter.put("/profile", verifyToken, editProfile);
authRouter.put("/change-password", verifyToken, changePassword);

export default authRouter;
