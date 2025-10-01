const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const { sendResponse } = require("../utils/response");

/**
 * @desc Get user profile
 * @route GET /api/users/profile
 * @access Private
 */
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    sendResponse(
      res,
      200,
      {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      "User profile retrieved successfully"
    );
  } else {
    sendResponse(res, 404, null, "", "User not found");
  }
});

/**
 * @desc Update user profile
 * @route PUT /api/users/profile
 * @access Private
 */
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return sendResponse(res, 404, null, "", "User not found");
  }

  const { name, email, password } = req.body;

  // Check if email is being changed and if it's already taken
  if (email && email !== user.email) {
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return sendResponse(res, 400, null, "", "Email is already taken");
    }
  }

  // Update user fields
  user.name = name || user.name;
  user.email = email || user.email;

  // Update password if provided
  if (password) {
    if (password.length < 6) {
      return sendResponse(res, 400, null, "", "Password must be at least 6 characters");
    }
    user.password = password; // Will be hashed by the pre-save middleware
  }

  const updatedUser = await user.save();

  sendResponse(
    res,
    200,
    {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      updatedAt: updatedUser.updatedAt,
    },
    "Profile updated successfully"
  );
});

/**
 * @desc Get all users (Admin only)
 * @route GET /api/users
 * @access Private/Admin
 */
const getUsers = asyncHandler(async (req, res) => {
  const { role, page = 1, limit = 10 } = req.query;

  const query = {};
  if (role) {
    query.role = role;
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    select: "-password", // Exclude password field
  };

  const users = await User.paginate(query, options);
  sendResponse(res, 200, users, "Users retrieved successfully");
});

/**
 * @desc Get user by ID (Admin only)
 * @route GET /api/users/:id
 * @access Private/Admin
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");

  if (user) {
    sendResponse(res, 200, user, "User retrieved successfully");
  } else {
    sendResponse(res, 404, null, "", "User not found");
  }
});

/**
 * @desc Update user (Admin only)
 * @route PUT /api/users/:id
 * @access Private/Admin
 */
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return sendResponse(res, 404, null, "", "User not found");
  }

  const { name, email, role } = req.body;

  // Check if email is being changed and if it's already taken
  if (email && email !== user.email) {
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return sendResponse(res, 400, null, "", "Email is already taken");
    }
  }

  // Update user fields
  user.name = name || user.name;
  user.email = email || user.email;
  user.role = role || user.role;

  const updatedUser = await user.save();

  sendResponse(
    res,
    200,
    {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      updatedAt: updatedUser.updatedAt,
    },
    "User updated successfully"
  );
});

/**
 * @desc Delete user (Admin only)
 * @route DELETE /api/users/:id
 * @access Private/Admin
 */
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return sendResponse(res, 404, null, "", "User not found");
  }

  // Prevent admin from deleting themselves
  if (user._id.toString() === req.user._id.toString()) {
    return sendResponse(res, 400, null, "", "Cannot delete your own account");
  }

  await User.findByIdAndDelete(req.params.id);
  sendResponse(res, 200, null, "User deleted successfully");
});

module.exports = {
  getUserProfile,
  updateUserProfile,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};
