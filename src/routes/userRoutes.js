const express = require("express");
const { getUserProfile, updateUserProfile, getUsers, getUserById, updateUser, deleteUser } = require("../controllers/userController");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

// Protected routes (User)
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);

// Protected routes (Admin only)
router.get("/", protect, admin, getUsers);
router.get("/:id", protect, admin, getUserById);
router.put("/:id", protect, admin, updateUser);
router.delete("/:id", protect, admin, deleteUser);

module.exports = router;
