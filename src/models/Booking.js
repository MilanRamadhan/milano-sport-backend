import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    fieldId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Field",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"],
    },
    endTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"],
    },

    // 🆕 tambahan user input
    customerName: {
      type: String,
      required: [true, "Nama wajib diisi"],
    },
    customerPhone: {
      type: String,
      required: [true, "Nomor telepon wajib diisi"],
    },

    notes: {
      type: String,
      default: "",
    },
    paymentMethod: {
      type: String,
      enum: ["transfer"],
      default: "transfer",
      required: true,
    },
    proofOfPayment: {
      type: String, // URL Cloudinary
      required: [true, "Bukti transfer wajib diupload"],
    },
    status: {
      type: String,
      enum: ["pending", "active", "cancelled"],
      default: "pending",
    },
    // Status pembayaran
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    totalHours: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);
