import Auth from "../models/Auth.js";
import Booking from "../models/Booking.js";
import Field from "../models/Field.js";

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await Auth.find().select("-password").sort({ createdAt: -1 });

    return res.status(200).json({
      status: 200,
      data: users,
      message: "Data users berhasil diambil",
    });
  } catch (error) {
    console.error("Error getting users:", error);
    return res.status(500).json({
      status: 500,
      message: "Gagal mengambil data users",
    });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await Auth.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User tidak ditemukan",
      });
    }

    return res.status(200).json({
      status: 200,
      data: user,
      message: "Detail user berhasil diambil",
    });
  } catch (error) {
    console.error("Error getting user:", error);
    return res.status(500).json({
      status: 500,
      message: "Gagal mengambil detail user",
    });
  }
};

// Update user role
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (role === undefined) {
      return res.status(400).json({
        status: 400,
        message: "Role harus diisi",
      });
    }

    const user = await Auth.findByIdAndUpdate(userId, { role }, { new: true }).select("-password");

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User tidak ditemukan",
      });
    }

    return res.status(200).json({
      status: 200,
      data: user,
      message: "Role user berhasil diupdate",
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    return res.status(500).json({
      status: 500,
      message: "Gagal mengupdate role user",
    });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Don't allow deleting own account
    if (userId === req.user.id) {
      return res.status(400).json({
        status: 400,
        message: "Tidak dapat menghapus akun sendiri",
      });
    }

    const user = await Auth.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User tidak ditemukan",
      });
    }

    // Also delete user's bookings
    await Booking.deleteMany({ userId });

    return res.status(200).json({
      status: 200,
      message: "User berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({
      status: 500,
      message: "Gagal menghapus user",
    });
  }
};

// Get all bookings
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate("userId", "name email").populate("fieldId", "name category").sort({ bookingDate: -1 });

    return res.status(200).json({
      status: 200,
      data: bookings,
      message: "Data bookings berhasil diambil",
    });
  } catch (error) {
    console.error("Error getting bookings:", error);
    return res.status(500).json({
      status: 500,
      message: "Gagal mengambil data bookings",
    });
  }
};

// Update booking status
export const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        status: 400,
        message: "Status harus diisi",
      });
    }

    const validStatuses = ["pending", "confirmed", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 400,
        message: "Status tidak valid",
      });
    }

    const booking = await Booking.findByIdAndUpdate(bookingId, { status }, { new: true }).populate("userId", "name email").populate("fieldId", "name category");

    if (!booking) {
      return res.status(404).json({
        status: 404,
        message: "Booking tidak ditemukan",
      });
    }

    return res.status(200).json({
      status: 200,
      data: booking,
      message: "Status booking berhasil diupdate",
    });
  } catch (error) {
    console.error("Error updating booking status:", error);
    return res.status(500).json({
      status: 500,
      message: "Gagal mengupdate status booking",
    });
  }
};

// Delete booking
export const deleteBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findByIdAndDelete(bookingId);

    if (!booking) {
      return res.status(404).json({
        status: 404,
        message: "Booking tidak ditemukan",
      });
    }

    return res.status(200).json({
      status: 200,
      message: "Booking berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting booking:", error);
    return res.status(500).json({
      status: 500,
      message: "Gagal menghapus booking",
    });
  }
};

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    // Get counts
    const totalUsers = await Auth.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const totalFields = await Field.countDocuments();

    // Get bookings by status
    const pendingBookings = await Booking.countDocuments({ status: "pending" });
    const confirmedBookings = await Booking.countDocuments({ status: "confirmed" });
    const completedBookings = await Booking.countDocuments({ status: "completed" });
    const cancelledBookings = await Booking.countDocuments({ status: "cancelled" });

    // Calculate total revenue (only confirmed and completed bookings)
    const revenueBookings = await Booking.find({
      status: { $in: ["confirmed", "completed"] },
    });

    const totalRevenue = revenueBookings.reduce((sum, booking) => {
      return sum + (booking.totalPrice || 0);
    }, 0);

    // Get recent bookings
    const recentBookings = await Booking.find().populate("userId", "name email").populate("fieldId", "name category").sort({ createdAt: -1 }).limit(5);

    return res.status(200).json({
      status: 200,
      data: {
        totalUsers,
        totalBookings,
        totalFields,
        bookingsByStatus: {
          pending: pendingBookings,
          confirmed: confirmedBookings,
          completed: completedBookings,
          cancelled: cancelledBookings,
        },
        totalRevenue,
        recentBookings,
      },
      message: "Dashboard stats berhasil diambil",
    });
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    return res.status(500).json({
      status: 500,
      message: "Gagal mengambil dashboard stats",
    });
  }
};
