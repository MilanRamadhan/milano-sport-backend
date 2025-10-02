import Field from "../models/Field.js";
import Booking from "../models/Booking.js";

// Ambil semua lapangan aktif
export const getFields = async (req, res) => {
  try {
    const fields = await Field.find({ isActive: true });

    return res.status(200).json({
      status: 200,
      data: fields,
      message: "Daftar lapangan berhasil diambil",
    });
  } catch (error) {
    console.log("Error getting fields:", error);
    return res.status(500).json({
      status: 500,
      message: "Kesalahan server internal",
    });
  }
};

// Ambil lapangan berdasarkan sport (Futsal, MiniSoccer, Badminton, Padel)
export const getFieldsBySport = async (req, res) => {
  try {
    const { sportName } = req.params;

    // Cari fields berdasarkan sport enum
    const fields = await Field.find({
      sport: sportName,
      isActive: true,
    });

    if (!fields || fields.length === 0) {
      return res.status(404).json({
        status: 404,
        message: `Lapangan untuk ${sportName} tidak ditemukan`,
      });
    }

    return res.status(200).json({
      status: 200,
      data: fields,
      message: `Lapangan untuk ${sportName} berhasil diambil`,
    });
  } catch (error) {
    console.log("Error getting fields by sport:", error);
    return res.status(500).json({
      status: 500,
      message: "Kesalahan server internal",
    });
  }
};

// Ambil detail lapangan berdasarkan ID
export const getFieldById = async (req, res) => {
  try {
    const field = await Field.findById(req.params.id);

    if (!field || !field.isActive) {
      return res.status(404).json({
        status: 404,
        message: "Lapangan tidak ditemukan",
      });
    }

    return res.status(200).json({
      status: 200,
      data: field,
      message: "Detail lapangan berhasil diambil",
    });
  } catch (error) {
    console.log("Error getting field by ID:", error);
    return res.status(500).json({
      status: 500,
      message: "Kesalahan server internal",
    });
  }
};

// Ambil ketersediaan lapangan untuk tanggal tertentu
export const getFieldAvailability = async (req, res) => {
  try {
    const { id, date } = req.params;

    // Validasi field exists
    const field = await Field.findById(id);
    if (!field || !field.isActive) {
      return res.status(404).json({
        status: 404,
        message: "Lapangan tidak ditemukan",
      });
    }

    // Parse date
    const bookingDate = new Date(date);
    const dayOfWeek = bookingDate.getDay();

    // Cek availability untuk hari tersebut
    const dayAvailability = field.availability.find((av) => av.dayOfWeek === dayOfWeek);
    if (!dayAvailability) {
      return res.status(200).json({
        status: 200,
        data: {
          available: false,
          message: "Lapangan tutup pada hari ini",
        },
        message: "Ketersediaan lapangan diperiksa",
      });
    }

    // Cari booking yang sudah ada untuk tanggal tersebut
    const existingBookings = await Booking.find({
      fieldId: id,
      date: {
        $gte: new Date(bookingDate.setHours(0, 0, 0, 0)),
        $lt: new Date(bookingDate.setHours(23, 59, 59, 999)),
      },
      status: "active",
    }).select("startTime endTime");

    // Generate available time slots
    const openTime = dayAvailability.openTime;
    const closeTime = dayAvailability.closeTime;
    const bookedSlots = existingBookings.map((booking) => ({
      start: booking.startTime,
      end: booking.endTime,
    }));

    return res.status(200).json({
      status: 200,
      data: {
        available: true,
        openTime,
        closeTime,
        bookedSlots,
        date: date,
      },
      message: "Ketersediaan lapangan berhasil diambil",
    });
  } catch (error) {
    console.log("Error getting field availability:", error);
    return res.status(500).json({
      status: 500,
      message: "Kesalahan server internal",
    });
  }
};
