import Field from "../models/Field.js";
import Booking from "../models/Booking.js";
import { logger } from "../utils/logger.js";

// Ambil semua lapangan aktif
export const getFields = async (req, res) => {
  try {
    const fields = await Field.find({ isActive: true });

    logger.info(`Get fields | count=${fields.length}`);

    return res.status(200).json({
      status: 200,
      data: fields,
      message: "Daftar lapangan berhasil diambil",
    });
  } catch (error) {
    logger.error(`Error getFields: ${error.message}`);
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

    const fields = await Field.find({
      sport: sportName,
      isActive: true,
    });

    if (!fields || fields.length === 0) {
      logger.warn(`Get fields by sport not found | sport=${sportName}`);
      return res.status(404).json({
        status: 404,
        message: `Lapangan untuk ${sportName} tidak ditemukan`,
      });
    }

    logger.info(`Get fields by sport | sport=${sportName} count=${fields.length}`);

    return res.status(200).json({
      status: 200,
      data: fields,
      message: `Lapangan untuk ${sportName} berhasil diambil`,
    });
  } catch (error) {
    logger.error(`Error getFieldsBySport (${req.params.sportName}): ${error.message}`);
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
      logger.warn(`Get field by id not found | fieldId=${req.params.id}`);
      return res.status(404).json({
        status: 404,
        message: "Lapangan tidak ditemukan",
      });
    }

    logger.info(`Get field by id | fieldId=${field._id} name=${field.name}`);

    return res.status(200).json({
      status: 200,
      data: field,
      message: "Detail lapangan berhasil diambil",
    });
  } catch (error) {
    logger.error(`Error getFieldById (${req.params.id}): ${error.message}`);
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

    const field = await Field.findById(id);
    if (!field || !field.isActive) {
      logger.warn(`Get availability field not found | fieldId=${id}`);
      return res.status(404).json({
        status: 404,
        message: "Lapangan tidak ditemukan",
      });
    }

    const bookingDate = new Date(date);
    const dayOfWeek = bookingDate.getDay();

    const dayAvailability = field.availability.find((av) => av.dayOfWeek === dayOfWeek);
    if (!dayAvailability) {
      logger.info(`Field closed | fieldId=${id} date=${date} day=${dayOfWeek}`);
      return res.status(200).json({
        status: 200,
        data: {
          available: false,
          message: "Lapangan tutup pada hari ini",
        },
        message: "Ketersediaan lapangan diperiksa",
      });
    }

    const existingBookings = await Booking.find({
      fieldId: id,
      date: {
        $gte: new Date(bookingDate.setHours(0, 0, 0, 0)),
        $lt: new Date(bookingDate.setHours(23, 59, 59, 999)),
      },
      status: "active",
    }).select("startTime endTime");

    logger.info(`Get availability | field=${id} date=${date} open=${dayAvailability.openTime} close=${dayAvailability.closeTime} booked=${existingBookings.length}`);

    return res.status(200).json({
      status: 200,
      data: {
        available: true,
        openTime: dayAvailability.openTime,
        closeTime: dayAvailability.closeTime,
        bookedSlots: existingBookings.map((b) => ({
          start: b.startTime,
          end: b.endTime,
        })),
        date,
      },
      message: "Ketersediaan lapangan berhasil diambil",
    });
  } catch (error) {
    logger.error(`Error getFieldAvailability: ${error.message}`);
    return res.status(500).json({
      status: 500,
      message: "Kesalahan server internal",
    });
  }
};
