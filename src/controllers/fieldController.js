const asyncHandler = require("express-async-handler");
const Field = require("../models/Field");
const Sport = require("../models/Sport");
const Booking = require("../models/Booking");
const { sendResponse } = require("../utils/response");

/**
 * @desc Get all fields
 * @route GET /api/fields
 * @access Public
 */
const getFields = asyncHandler(async (req, res) => {
  const fields = await Field.find({ isActive: true }).populate("sport", "sportName");
  sendResponse(res, 200, fields, "Fields retrieved successfully");
});

/**
 * @desc Get fields by sport
 * @route GET /api/fields/sport/:sportName
 * @access Public
 */
const getFieldsBySport = asyncHandler(async (req, res) => {
  const { sportName } = req.params;

  // Cari sport berdasarkan nama
  const sport = await Sport.findOne({ sportName });
  if (!sport) {
    return sendResponse(res, 404, null, "", "Sport not found");
  }

  // Cari fields berdasarkan sport
  const fields = await Field.find({
    sport: sport._id,
    isActive: true,
  }).populate("sport", "sportName");

  sendResponse(res, 200, fields, `Fields for ${sportName} retrieved successfully`);
});

/**
 * @desc Get single field by ID
 * @route GET /api/fields/:id
 * @access Public
 */
const getFieldById = asyncHandler(async (req, res) => {
  const field = await Field.findById(req.params.id).populate("sport", "sportName");

  if (!field || !field.isActive) {
    return sendResponse(res, 404, null, "", "Field not found");
  }

  sendResponse(res, 200, field, "Field retrieved successfully");
});

/**
 * @desc Check field availability for a specific date
 * @route GET /api/fields/:id/availability/:date
 * @access Public
 */
const getFieldAvailability = asyncHandler(async (req, res) => {
  const { id, date } = req.params;

  // Validasi field exists
  const field = await Field.findById(id);
  if (!field || !field.isActive) {
    return sendResponse(res, 404, null, "", "Field not found");
  }

  // Parse date
  const bookingDate = new Date(date);
  const dayOfWeek = bookingDate.getDay();

  // Cek availability untuk hari tersebut
  const dayAvailability = field.availability.find((av) => av.dayOfWeek === dayOfWeek);
  if (!dayAvailability) {
    return sendResponse(
      res,
      200,
      {
        available: false,
        message: "Field is closed on this day",
      },
      "Field availability checked"
    );
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

  sendResponse(
    res,
    200,
    {
      available: true,
      openTime,
      closeTime,
      bookedSlots,
      date: date,
    },
    "Field availability retrieved successfully"
  );
});

/**
 * @desc Create new field (Admin only)
 * @route POST /api/fields
 * @access Private/Admin
 */
const createField = asyncHandler(async (req, res) => {
  const { name, sportName, pricePerHour, availability } = req.body;

  // Validasi input
  if (!name || !sportName || !pricePerHour || !availability) {
    return sendResponse(res, 400, null, "", "Please provide all required fields");
  }

  // Cari atau buat sport
  let sport = await Sport.findOne({ sportName });
  if (!sport) {
    sport = await Sport.create({ sportName });
  }

  // Buat field baru
  const field = await Field.create({
    name,
    sport: sport._id,
    pricePerHour,
    availability,
  });

  const populatedField = await Field.findById(field._id).populate("sport", "sportName");
  sendResponse(res, 201, populatedField, "Field created successfully");
});

/**
 * @desc Update field (Admin only)
 * @route PUT /api/fields/:id
 * @access Private/Admin
 */
const updateField = asyncHandler(async (req, res) => {
  const { name, sportName, pricePerHour, availability, isActive } = req.body;

  let field = await Field.findById(req.params.id);
  if (!field) {
    return sendResponse(res, 404, null, "", "Field not found");
  }

  // Update sport jika diperlukan
  if (sportName) {
    let sport = await Sport.findOne({ sportName });
    if (!sport) {
      sport = await Sport.create({ sportName });
    }
    field.sport = sport._id;
  }

  // Update field properties
  field.name = name || field.name;
  field.pricePerHour = pricePerHour || field.pricePerHour;
  field.availability = availability || field.availability;
  field.isActive = isActive !== undefined ? isActive : field.isActive;

  const updatedField = await field.save();
  const populatedField = await Field.findById(updatedField._id).populate("sport", "sportName");

  sendResponse(res, 200, populatedField, "Field updated successfully");
});

/**
 * @desc Delete field (Admin only)
 * @route DELETE /api/fields/:id
 * @access Private/Admin
 */
const deleteField = asyncHandler(async (req, res) => {
  const field = await Field.findById(req.params.id);

  if (!field) {
    return sendResponse(res, 404, null, "", "Field not found");
  }

  // Soft delete - set isActive to false
  field.isActive = false;
  await field.save();

  sendResponse(res, 200, null, "Field deleted successfully");
});

/**
 * @desc Get all sports
 * @route GET /api/fields/sports
 * @access Public
 */
const getSports = asyncHandler(async (req, res) => {
  const sports = await Sport.find({});
  sendResponse(res, 200, sports, "Sports retrieved successfully");
});

module.exports = {
  getFields,
  getFieldsBySport,
  getFieldById,
  getFieldAvailability,
  createField,
  updateField,
  deleteField,
  getSports,
};
