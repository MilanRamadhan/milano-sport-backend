import Booking from "../models/Booking.js";
import Field from "../models/Field.js";
import { logger } from "../utils/logger.js";

// ✅ Cek konflik booking
const checkBookingConflict = async (fieldId, date, startTime, endTime, excludeBookingId = null) => {
  const bookingDate = new Date(date);

  const query = {
    fieldId,
    date: {
      $gte: new Date(bookingDate.setHours(0, 0, 0, 0)),
      $lt: new Date(bookingDate.setHours(23, 59, 59, 999)),
    },
    status: { $in: ["active", "pending"] },
    $or: [
      { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
      { startTime: { $lt: endTime }, endTime: { $gte: endTime } },
      { startTime: { $gte: startTime }, endTime: { $lte: endTime } },
    ],
  };

  if (excludeBookingId) query._id = { $ne: excludeBookingId };

  logger.debug(`Check conflict | field=${fieldId} date=${date} time=${startTime}-${endTime}`);

  return await Booking.findOne(query);
};

// ✅ Buat booking
export const createBooking = async (req, res) => {
  try {
    const { fieldId, date, startTime, endTime, customerName, customerPhone, notes } = req.body;

    // ✅ Cek bukti transfer
    if (!req.file) {
      logger.warn(`Create booking rejected | reason=no_proof user=${req.user?.id} field=${fieldId} date=${date}`);
      return res.status(400).json({
        status: 400,
        message: "Bukti transfer wajib diupload",
      });
    }
    const proofOfPaymentUrl = req.file.path;

    // ✅ Validasi tanggal (maks. 7 hari ke depan)
    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      logger.warn(`Create booking rejected | reason=past_date user=${req.user?.id} date=${date}`);
      return res.status(400).json({ status: 400, message: "Tanggal booking sudah lewat" });
    }

    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 7);
    if (bookingDate > maxDate) {
      logger.warn(`Create booking rejected | reason=over_7_days user=${req.user?.id} date=${date}`);
      return res.status(400).json({ status: 400, message: "Booking hanya bisa untuk 7 hari ke depan" });
    }

    // ✅ Validasi field
    const field = await Field.findById(fieldId);
    if (!field || !field.isActive) {
      logger.warn(`Create booking rejected | reason=field_not_found user=${req.user?.id} field=${fieldId}`);
      return res.status(404).json({ status: 404, message: "Lapangan tidak ditemukan" });
    }

    // ✅ Validasi waktu booking
    const startMinutes = startTime.split(":").reduce((h, m) => h * 60 + +m);
    const endMinutes = endTime.split(":").reduce((h, m) => h * 60 + +m);
    if (endMinutes <= startMinutes) {
      return res.status(400).json({ status: 400, message: "Waktu selesai harus lebih besar dari waktu mulai" });
    }

    // ✅ Validasi jam buka
    const dayOfWeek = bookingDate.getDay();
    const dayAvailability = field.availability.find((av) => av.dayOfWeek === dayOfWeek);
    if (!dayAvailability) {
      logger.warn(`Create booking rejected | reason=field_closed user=${req.user?.id} field=${fieldId} dayOfWeek=${dayOfWeek}`);
      return res.status(400).json({ status: 400, message: "Lapangan tutup pada hari ini" });
    }

    const openMinutes = dayAvailability.openTime.split(":").reduce((h, m) => h * 60 + +m);
    const closeMinutes = dayAvailability.closeTime.split(":").reduce((h, m) => h * 60 + +m);
    if (startMinutes < openMinutes || endMinutes > closeMinutes) {
      logger.warn(`Create booking rejected | reason=outside_open_hours user=${req.user?.id} field=${fieldId} open=${dayAvailability.openTime} close=${dayAvailability.closeTime} requested=${startTime}-${endTime}`);
      return res.status(400).json({
        status: 400,
        message: `Lapangan hanya buka dari ${dayAvailability.openTime} sampai ${dayAvailability.closeTime}`,
      });
    }

    // ✅ Cek konflik booking
    const conflict = await checkBookingConflict(fieldId, date, startTime, endTime);
    if (conflict) {
      logger.warn(`Create booking rejected | reason=conflict user=${req.user?.id} field=${fieldId} date=${date} time=${startTime}-${endTime}`);
      return res.status(400).json({ status: 400, message: "Waktu tersebut sudah dibooking" });
    }

    // ✅ Hitung total biaya
    const totalHours = (endMinutes - startMinutes) / 60;
    const totalPrice = totalHours * field.pricePerHour;

    if (!customerName || !customerPhone) {
      return res.status(400).json({ status: 400, message: "Nama dan nomor telepon wajib diisi" });
    }

    if (!fieldId || !date || !startTime || !endTime) {
      return res.status(400).json({ status: 400, message: "Semua kolom wajib diisi" });
    }

    // ✅ Buat booking
    const booking = await Booking.create({
      userId: req.user.id,
      fieldId,
      date: bookingDate,
      startTime,
      endTime,
      totalHours,
      totalPrice,
      customerName,
      customerPhone,
      notes,
      proofOfPayment: proofOfPaymentUrl,
      paymentMethod: "transfer",
      paymentStatus: "pending",
      status: "pending", // tunggu verifikasi admin
    });

    // Populate booking data untuk response yang lengkap
    const populatedBooking = await Booking.findById(booking._id).populate("userId", "name email").populate("fieldId", "name sport pricePerHour");
    logger.info(`Booking created | bookingId=${booking._id} user=${req.user?.id} field=${fieldId} date=${date} time=${startTime}-${endTime} total=${totalPrice}`);

    return res.status(201).json({
      status: 201,
      data: {
        bookingId: booking._id,
        booking: populatedBooking,
        paymentInfo: {
          totalPrice: booking.totalPrice,
          paymentMethod: booking.paymentMethod,
          paymentStatus: booking.paymentStatus,
        },
      },
      message: "Booking berhasil dibuat dengan ID: " + booking._id + " (menunggu verifikasi admin)",
    });
  } catch (error) {
    logger.error(`Error creating booking: ${error.message}`);
    return res.status(500).json({ status: 500, message: "Kesalahan server internal" });
  }
};

// ✅ Get semua booking user
export const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id }).populate("fieldId", "name sport pricePerHour");
    logger.info(`Get user bookings | user=${req.user?.id} count=${bookings.length}`);
    return res.status(200).json({
      status: 200,
      data: bookings,
      message: "Daftar booking berhasil diambil",
    });
  } catch (error) {
    logger.error(`Error getting user bookings: ${error.message}`);
    return res.status(500).json({ status: 500, message: "Kesalahan server internal" });
  }
};

// ✅ Get booking by ID
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("fieldId", "name pricePerHour sport");

    if (!booking) {
      logger.warn(`Get booking by id not found | id=${req.params.id} user=${req.user?.id}`);
      return res.status(404).json({
        status: 404,
        message: "Booking tidak ditemukan",
      });
    }

    // cek kepemilikan booking
    if (booking.userId && booking.userId.toString() !== req.user.id && !req.user.role) {
      logger.warn(`Get booking forbidden | bookingId=${req.params.id} user=${req.user?.id}`);
      return res.status(403).json({
        status: 403,
        message: "Tidak diizinkan",
      });
    }

    return res.status(200).json({
      status: 200,
      data: booking,
      message: "Detail booking berhasil diambil",
    });
  } catch (error) {
    logger.error(`Error getBookingById: ${error.message}`);
    return res.status(500).json({
      status: 500,
      message: "Kesalahan server internal",
      error: error.message,
    });
  }
};

// ✅ Cancel booking (user)
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ status: 404, message: "Booking tidak ditemukan" });

    logger.debug(`Cancel booking attempt | bookingId=${req.params.id} user=${req.user?.id} owner=${booking.userId}`);

    if (!booking.userId) {
      return res.status(400).json({ status: 400, message: "Booking ini tidak punya userId" });
    }

    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({ status: 403, message: "Tidak diizinkan" });
    }

    booking.status = "cancelled";
    await booking.save();

    // Populate untuk response yang lengkap
    const cancelledBooking = await Booking.findById(booking._id).populate("userId", "name email").populate("fieldId", "name sport pricePerHour");
    logger.info(`Booking cancelled | bookingId=${booking._id} user=${req.user?.id}`);

    return res.status(200).json({
      status: 200,
      data: {
        bookingId: booking._id,
        booking: cancelledBooking,
        statusUpdate: {
          status: booking.status,
          cancelledAt: new Date(),
        },
      },
      message: `Booking ${booking._id} berhasil dibatalkan`,
    });
  } catch (error) {
    logger.error(`Error cancelling booking: ${error.message}`);
    return res.status(500).json({ status: 500, message: "Kesalahan server internal" });
  }
};

// ✅ Admin - get semua booking
export const getAllBookings = async (req, res) => {
  try {
    if (!req.user.role) {
      logger.warn(`Admin getAllBookings forbidden | user=${req.user?.id}`);
      return res.status(403).json({ status: 403, message: "Hanya admin" });
    }

    const bookings = await Booking.find().populate("userId", "name email").populate("fieldId", "name pricePerHour sport").sort({ createdAt: -1 });
    logger.info(`Admin getAllBookings | admin=${req.user?.id} count=${bookings.length}`);
    return res.status(200).json({
      status: 200,
      data: bookings,
      message: "Semua booking berhasil diambil",
    });
  } catch (error) {
    logger.error(`Error getting all bookings: ${error.message}`);
    return res.status(500).json({ status: 500, message: "Kesalahan server internal" });
  }
};

// ✅ Admin - update payment status
export const updatePaymentStatus = async (req, res) => {
  try {
    if (!req.user.role) {
      logger.warn(`Admin updatePaymentStatus forbidden | user=${req.user?.id}`);
      return res.status(403).json({ status: 403, message: "Hanya admin" });
    }

    const { paymentStatus } = req.body;
    if (!["pending", "paid", "failed"].includes(paymentStatus)) {
      logger.warn(`Update payment invalid status | admin=${req.user?.id} bookingId=${req.params.id} paymentStatus=${paymentStatus}`);
      return res.status(400).json({ status: 400, message: "Status tidak valid" });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ status: 404, message: "Booking tidak ditemukan" });

    booking.paymentStatus = paymentStatus;
    booking.status = paymentStatus === "paid" ? "active" : "cancelled";
    await booking.save();

    // Populate untuk response yang lengkap
    const updatedBooking = await Booking.findById(booking._id).populate("userId", "name email").populate("fieldId", "name sport pricePerHour");
    logger.info(`Payment status updated | admin=${req.user?.id} bookingId=${booking._id} paymentStatus=${paymentStatus} bookingStatus=${booking.status}`);
    return res.status(200).json({
      status: 200,
      data: {
        bookingId: booking._id,
        booking: updatedBooking,
        statusUpdate: {
          paymentStatus: booking.paymentStatus,
          bookingStatus: booking.status,
        },
      },
      message: `Status pembayaran booking ${booking._id} berhasil diubah menjadi ${paymentStatus}`,
    });
  } catch (error) {
    logger.error(`Error updating payment status: ${error.message}`);
    return res.status(500).json({ status: 500, message: "Kesalahan server internal" });
  }
};
