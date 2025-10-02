import mongoose from "mongoose";

// Mapping harga fix per olahraga
const sportPrices = {
  Futsal: 150000, // contoh harga per jam
  MiniSoccer: 200000,
  Badminton: 75000,
  Padel: 100000,
};

const fieldSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Field name is required"],
      trim: true,
    },
    sport: {
      type: String,
      enum: Object.keys(sportPrices), // otomatis ambil dari mapping
      required: [true, "Sport is required"],
    },
    pricePerHour: {
      type: Number,
      required: true,
      min: [0, "Price must be positive"],
      immutable: true, // harga fix, tidak bisa diubah setelah create
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

// Middleware: set otomatis harga berdasarkan sport sebelum validasi
fieldSchema.pre("validate", function (next) {
  if (this.sport && sportPrices[this.sport]) {
    this.pricePerHour = sportPrices[this.sport];
  }
  next();
});

// Index untuk performa query
fieldSchema.index({ sport: 1, isActive: 1 });

export default mongoose.model("Field", fieldSchema);
