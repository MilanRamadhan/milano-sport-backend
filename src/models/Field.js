const mongoose = require("mongoose");

const fieldSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Field name is required"],
      trim: true,
    },
    sport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sport",
      required: [true, "Sport is required"],
    },
    pricePerHour: {
      type: Number,
      required: [true, "Price per hour is required"],
      min: [0, "Price must be positive"],
    },
    availability: [
      {
        dayOfWeek: {
          type: Number,
          required: true,
          min: 0, // Sunday
          max: 6, // Saturday
        },
        openTime: {
          type: String, // Format: "HH:MM"
          required: true,
          match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"],
        },
        closeTime: {
          type: String, // Format: "HH:MM"
          required: true,
          match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"],
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index untuk performa query
fieldSchema.index({ sport: 1, isActive: 1 });

const Field = mongoose.model("Field", fieldSchema);

module.exports = Field;
