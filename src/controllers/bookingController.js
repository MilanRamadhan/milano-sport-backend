const asyncHandler = require("express-async-handler");
const Booking = require("../models/Booking");
const Field = require("../models/Field");
const { sendResponse } = require("../utils/response");
const { upload } = require("../config/cloudinary");

/**
 * Check if booking time conflicts with existing bookings
 */
const checkBookingConflict = async (fieldId, date, startTime, endTime, excludeBookingId = null) => {
  const bookingDate = new Date(date);

  const query = {
    fieldId,
    date: {
      $gte: new Date(bookingDate.setHours(0, 0, 0, 0)),
      $lt: new Date(bookingDate.setHours(23, 59, 59, 999)),
    },
    status: "active",
    $or: [
      // New booking starts during existing booking
      {
        startTime: { $lte: startTime },
        endTime: { $gt: startTime },
      },
      // New booking ends during existing booking
      {
        startTime: { $lt: endTime },
        endTime: { $gte: endTime },
      },
      // New booking completely overlaps existing booking
      {
        startTime: { $gte: startTime },
        endTime: { $lte: endTime },
      },
    ],
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflictingBooking = await Booking.findOne(query);
  return conflictingBooking;
};

/**
 * @desc Create new booking
 * @route POST /api/bookings
 * @access Private
 */
const createBooking = asyncHandler(async (req, res) => {
  const { fieldId, date, startTime, endTime, paymentMethod, notes } = req.body;

  // Validasi input
  if (!fieldId || !date || !startTime || !endTime || !paymentMethod) {
    return sendResponse(res, 400, null, "", "Please provide all required fields");
  }

  // Validasi field exists
  const field = await Field.findById(fieldId).populate("sport", "sportName");
  if (!field || !field.isActive) {
    return sendResponse(res, 404, null, "", "Field not found");
  }

  // Validasi tanggal tidak di masa lalu
  const bookingDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (bookingDate < today) {
    return sendResponse(res, 400, null, "", "Cannot book for past dates");
  }

  // Validasi waktu
  const startMinutes = startTime.split(":").reduce((h, m) => h * 60 + +m);
  const endMinutes = endTime.split(":").reduce((h, m) => h * 60 + +m);

  if (endMinutes <= startMinutes) {
    return sendResponse(res, 400, null, "", "End time must be after start time");
  }

  // Cek apakah field buka pada hari tersebut
  const dayOfWeek = bookingDate.getDay();
  const dayAvailability = field.availability.find((av) => av.dayOfWeek === dayOfWeek);

  if (!dayAvailability) {
    return sendResponse(res, 400, null, "", "Field is closed on this day");
  }

  // Validasi waktu booking dalam jam operasional
  const openMinutes = dayAvailability.openTime.split(":").reduce((h, m) => h * 60 + +m);
  const closeMinutes = dayAvailability.closeTime.split(":").reduce((h, m) => h * 60 + +m);

  if (startMinutes < openMinutes || endMinutes > closeMinutes) {
    return sendResponse(res, 400, null, "", `Field is only open from ${dayAvailability.openTime} to ${dayAvailability.closeTime}`);
  }

  // Cek konflik dengan booking lain
  const conflict = await checkBookingConflict(fieldId, date, startTime, endTime);
  if (conflict) {
    return sendResponse(res, 400, null, "", "Time slot is already booked");
  }

  // Hitung total hours dan price
  const totalHours = (endMinutes - startMinutes) / 60;
  const totalPrice = totalHours * field.pricePerHour;

  // Buat booking
  const booking = await Booking.create({
    userId: req.user._id,
    fieldId,
    date: bookingDate,
    startTime,
    endTime,
    totalHours,
    totalPrice,
    paymentMethod,
    paymentStatus: paymentMethod === "cod" ? "pending" : "pending",
    notes,
  });

  // Populate data untuk response
  const populatedBooking = await Booking.findById(booking._id)
    .populate("userId", "name email")
    .populate("fieldId", "name pricePerHour")
    .populate({
      path: "fieldId",
      populate: {
        path: "sport",
        select: "sportName",
      },
    });

  sendResponse(res, 201, populatedBooking, "Booking created successfully");
});

/**
 * @desc Get user bookings
 * @route GET /api/bookings
 * @access Private
 */
const getUserBookings = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  const query = { userId: req.user._id };
  if (status) {
    query.status = status;
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: [
      {
        path: "fieldId",
        select: "name pricePerHour",
        populate: {
          path: "sport",
          select: "sportName",
        },
      },
    ],
  };

  const bookings = await Booking.paginate(query, options);
  sendResponse(res, 200, bookings, "User bookings retrieved successfully");
});

/**
 * @desc Get single booking
 * @route GET /api/bookings/:id
 * @access Private
 */
const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate("userId", "name email")
    .populate("fieldId", "name pricePerHour")
    .populate({
      path: "fieldId",
      populate: {
        path: "sport",
        select: "sportName",
      },
    });

  if (!booking) {
    return sendResponse(res, 404, null, "", "Booking not found");
  }

  // Check if user owns this booking or is admin
  if (booking.userId._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    return sendResponse(res, 403, null, "", "Not authorized to access this booking");
  }

  sendResponse(res, 200, booking, "Booking retrieved successfully");
});

/**
 * @desc Cancel booking
 * @route PUT /api/bookings/:id/cancel
 * @access Private
 */
const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return sendResponse(res, 404, null, "", "Booking not found");
  }

  // Check if user owns this booking
  if (booking.userId.toString() !== req.user._id.toString()) {
    return sendResponse(res, 403, null, "", "Not authorized to cancel this booking");
  }

  // Check if booking can be cancelled
  if (booking.status !== "active") {
    return sendResponse(res, 400, null, "", "Only active bookings can be cancelled");
  }

  // Check if booking is not too close to start time (e.g., 2 hours before)
  const bookingDateTime = new Date(booking.date);
  const [hours, minutes] = booking.startTime.split(":");
  bookingDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  const now = new Date();
  const timeDiff = bookingDateTime.getTime() - now.getTime();
  const hoursDiff = timeDiff / (1000 * 60 * 60);

  if (hoursDiff < 2) {
    return sendResponse(res, 400, null, "", "Cannot cancel booking less than 2 hours before start time");
  }

  booking.status = "cancelled";
  await booking.save();

  sendResponse(res, 200, booking, "Booking cancelled successfully");
});

/**
 * @desc Upload proof of payment
 * @route POST /api/bookings/:id/upload-proof
 * @access Private
 */
const uploadProofOfPayment = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return sendResponse(res, 404, null, "", "Booking not found");
  }

  // Check if user owns this booking
  if (booking.userId.toString() !== req.user._id.toString()) {
    return sendResponse(res, 403, null, "", "Not authorized to upload proof for this booking");
  }

  // Check if booking payment method is transfer
  if (booking.paymentMethod !== "transfer") {
    return sendResponse(res, 400, null, "", "Proof of payment only required for transfer payments");
  }

  // Use multer middleware to handle file upload
  upload.single("proofFile")(req, res, async (err) => {
    if (err) {
      return sendResponse(res, 400, null, "", err.message);
    }

    if (!req.file) {
      return sendResponse(res, 400, null, "", "Please upload a proof of payment file");
    }

    // Update booking with proof of payment URL
    booking.proofOfPayment = req.file.path; // Cloudinary URL
    booking.paymentStatus = "pending"; // Admin needs to verify
    await booking.save();

    sendResponse(
      res,
      200,
      {
        proofOfPayment: booking.proofOfPayment,
        paymentStatus: booking.paymentStatus,
      },
      "Proof of payment uploaded successfully"
    );
  });
});

/**
 * @desc Get all bookings (Admin only)
 * @route GET /api/bookings/admin/all
 * @access Private/Admin
 */
const getAllBookings = asyncHandler(async (req, res) => {
  const { status, paymentStatus, page = 1, limit = 10 } = req.query;

  const query = {};
  if (status) query.status = status;
  if (paymentStatus) query.paymentStatus = paymentStatus;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: [
      {
        path: "userId",
        select: "name email",
      },
      {
        path: "fieldId",
        select: "name pricePerHour",
        populate: {
          path: "sport",
          select: "sportName",
        },
      },
    ],
  };

  const bookings = await Booking.paginate(query, options);
  sendResponse(res, 200, bookings, "All bookings retrieved successfully");
});

/**
 * @desc Update payment status (Admin only)
 * @route PUT /api/bookings/:id/payment-status
 * @access Private/Admin
 */
const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { paymentStatus } = req.body;

  if (!["pending", "paid", "failed"].includes(paymentStatus)) {
    return sendResponse(res, 400, null, "", "Invalid payment status");
  }

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return sendResponse(res, 404, null, "", "Booking not found");
  }

  booking.paymentStatus = paymentStatus;
  await booking.save();

  sendResponse(res, 200, booking, "Payment status updated successfully");
});

module.exports = {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  uploadProofOfPayment,
  getAllBookings,
  updatePaymentStatus,
};
