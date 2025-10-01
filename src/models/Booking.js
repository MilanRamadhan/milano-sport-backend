const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    fieldId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Field",
      required: [true, "Field ID is required"],
    },
    date: {
      type: Date,
      required: [true, "Booking date is required"],
      validate: {
        validator: function (date) {
          // Tidak boleh booking di masa lalu
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return date >= today;
        },
        message: "Booking date cannot be in the past",
      },
    },
    startTime: {
      type: String, // Format: "HH:MM"
      required: [true, "Start time is required"],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid start time format (HH:MM)"],
    },
    endTime: {
      type: String, // Format: "HH:MM"
      required: [true, "End time is required"],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid end time format (HH:MM)"],
    },
    totalHours: {
      type: Number,
      required: true,
      min: [1, "Minimum booking is 1 hour"],
      max: [8, "Maximum booking is 8 hours"],
    },
    totalPrice: {
      type: Number,
      required: true,
      min: [0, "Total price must be positive"],
    },
    paymentMethod: {
      type: String,
      enum: ["transfer", "cod"],
      required: [true, "Payment method is required"],
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    status: {
      type: String,
      enum: ["active", "cancelled", "completed"],
      default: "active",
    },
    proofOfPayment: {
      type: String, // URL from Cloudinary
      required: function () {
        return this.paymentMethod === "transfer";
      },
    },
    notes: {
      type: String,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
  }
);

// Index untuk mencegah double booking
bookingSchema.index({
  fieldId: 1,
  date: 1,
  startTime: 1,
  endTime: 1,
  status: 1,
});

// Index untuk query user bookings
bookingSchema.index({ userId: 1, status: 1 });

// Validation untuk memastikan endTime lebih besar dari startTime
bookingSchema.pre("save", function (next) {
  const startMinutes = this.startTime.split(":").reduce((h, m) => h * 60 + +m);
  const endMinutes = this.endTime.split(":").reduce((h, m) => h * 60 + +m);

  if (endMinutes <= startMinutes) {
    next(new Error("End time must be after start time"));
  } else {
    // Calculate total hours
    this.totalHours = (endMinutes - startMinutes) / 60;
    next();
  }
});

// Add pagination plugin
bookingSchema.plugin(mongoosePaginate);

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
