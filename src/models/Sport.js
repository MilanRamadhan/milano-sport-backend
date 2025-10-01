const mongoose = require("mongoose");

const sportSchema = new mongoose.Schema(
  {
    sportName: {
      type: String,
      required: [true, "Sport name is required"],
      unique: true,
      enum: ["Futsal", "MiniSoccer", "Badminton", "Padel"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Sport = mongoose.model("Sport", sportSchema);

module.exports = Sport;
