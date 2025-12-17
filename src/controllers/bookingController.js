import Booking from "../models/Booking.js";
import Field from "../models/Field.js";
import Finance from "../models/Finance.js";
import { logger } from "../utils/logger.js";

// Helper: Auto-create finance record dari booking
const createFinanceFromBooking = async (booking, adminId) => {
  try {
    const populatedBooking = await Booking.findById(booking._id).populate("userId", "name").populate("fieldId", "name sport");

    const financeRecord = await Finance.create({
      type: "income",
      category: `Booking ${populatedBooking.fieldId.sport}`,
      amount: booking.totalPrice,
      description: `Booking ${populatedBooking.fieldId.name} oleh ${populatedBooking.userId.name} - ${booking.date.toLocaleDateString("id-ID")} (${booking.startTime}-${booking.endTime})`,
      date: booking.date,
      createdBy: adminId,
    });

    logger.info(`Finance auto-created from booking | financeId=${financeRecord._id} bookingId=${booking._id} amount=${booking.totalPrice}`);
    return financeRecord;
  } catch (error) {
    logger.error(`Error creating finance from booking: ${error.message}`);
    // Don't throw error, just log it so booking process continues
  }
};

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

// ✅ Get semua booking user - OPTIMIZED
export const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .populate("fieldId", "name sport pricePerHour")
      .sort({ createdAt: -1 })
      .limit(50) // Limit untuk prevent timeout
      .lean(); // Faster query

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

    // EXTREME OPTIMIZATION: Reduce limit to 20 untuk prevent timeout
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20; // Reduced to 20!
    const skip = (page - 1) * limit;

    // Remove populate untuk speed - frontend akan handle dengan data yang ada
    const [bookings, total] = await Promise.all([
      Booking.find().sort({ createdAt: -1 }).limit(limit).skip(skip).lean().select("date startTime endTime totalPrice paymentStatus status customerName customerPhone fieldId userId createdAt proofOfPayment notes"),
      Booking.countDocuments(),
    ]);

    logger.info(`Admin getAllBookings | admin=${req.user?.id} count=${bookings.length} page=${page}`);
    return res.status(200).json({
      status: 200,
      data: bookings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      message: "Semua booking berhasil diambil",
    });
  } catch (error) {
    logger.error(`Error getting all bookings: ${error.message}`);
    return res.status(500).json({ status: 500, message: "Kesalahan server internal" });
  }
};

// ✅ Admin - sync existing paid bookings to finance
export const syncBookingsToFinance = async (req, res) => {
  try {
    if (!req.user.role) {
      logger.warn(`Admin syncBookingsToFinance forbidden | user=${req.user?.id}`);
      return res.status(403).json({ status: 403, message: "Hanya admin" });
    }

    // Get all paid bookings
    const paidBookings = await Booking.find({
      paymentStatus: "paid",
      status: { $in: ["active", "completed"] },
    })
      .populate("userId", "name")
      .populate("fieldId", "name sport");

    let syncedCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (const booking of paidBookings) {
      try {
        // Check if finance record already exists for this booking
        const existingFinance = await Finance.findOne({
          description: { $regex: booking._id.toString() },
        });

        if (existingFinance) {
          skippedCount++;
          continue;
        }

        // Create finance record
        await Finance.create({
          type: "income",
          category: `Booking ${booking.fieldId.sport}`,
          amount: booking.totalPrice,
          description: `Booking ${booking.fieldId.name} oleh ${booking.userId.name} - ${booking.date.toLocaleDateString("id-ID")} (${booking.startTime}-${booking.endTime}) [ID: ${booking._id}]`,
          date: booking.date,
          createdBy: req.user.id,
        });

        syncedCount++;
        logger.info(`Booking synced to finance | bookingId=${booking._id} amount=${booking.totalPrice}`);
      } catch (error) {
        errors.push({ bookingId: booking._id, error: error.message });
        logger.error(`Error syncing booking ${booking._id}: ${error.message}`);
      }
    }

    logger.info(`Booking sync completed | admin=${req.user?.id} synced=${syncedCount} skipped=${skippedCount} errors=${errors.length}`);

    return res.status(200).json({
      status: 200,
      data: {
        totalPaidBookings: paidBookings.length,
        syncedCount,
        skippedCount,
        errorCount: errors.length,
        errors: errors.length > 0 ? errors : undefined,
      },
      message: `Berhasil sync ${syncedCount} booking ke finance records. ${skippedCount} sudah ada sebelumnya.`,
    });
  } catch (error) {
    logger.error(`Error syncing bookings to finance: ${error.message}`);
    return res.status(500).json({
      status: 500,
      message: "Kesalahan server saat sync bookings",
      error: error.message,
    });
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

    const oldPaymentStatus = booking.paymentStatus;
    booking.paymentStatus = paymentStatus;
    booking.status = paymentStatus === "paid" ? "active" : "cancelled";
    await booking.save();

    // Auto-create finance record when payment is confirmed (paid)
    if (paymentStatus === "paid" && oldPaymentStatus !== "paid") {
      await createFinanceFromBooking(booking, req.user.id);
    }

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

// ✅ Get booked slots for a field on a specific date (for availability check)
export const getBookedSlots = async (req, res) => {
  try {
    const { fieldId, date } = req.query;

    if (!fieldId || !date) {
      return res.status(400).json({
        status: 400,
        message: "fieldId dan date wajib diisi",
      });
    }

    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);

    const endDate = new Date(bookingDate);
    endDate.setHours(23, 59, 59, 999);

    // Get all active and pending bookings for the field on the date
    const bookings = await Booking.find({
      fieldId,
      date: {
        $gte: bookingDate,
        $lt: endDate,
      },
      status: { $in: ["active", "pending"] },
    })
      .select("startTime endTime")
      .lean();

    logger.info(`Booked slots fetched | field=${fieldId} date=${date} count=${bookings.length}`);

    return res.status(200).json({
      status: 200,
      data: bookings.map((b) => ({
        startTime: b.startTime,
        endTime: b.endTime,
      })),
      message: "Booked slots berhasil diambil",
    });
  } catch (error) {
    logger.error(`Error getting booked slots: ${error.message}`);
    return res.status(500).json({ status: 500, message: "Kesalahan server internal" });
  }
};
