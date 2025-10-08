import mongoose from "mongoose";
import dotenv from "dotenv";
import Field from "./src/models/Field.js";

dotenv.config();

const seedFields = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Hapus data lama biar bersih
    await Field.deleteMany({});

    const fields = [
      {
        name: "Lapangan Futsal",
        sport: "Futsal",
        availability: [
          { dayOfWeek: 1, openTime: "08:00", closeTime: "24:00" }, // Senin
          { dayOfWeek: 2, openTime: "08:00", closeTime: "24:00" }, // Selasa
          { dayOfWeek: 3, openTime: "08:00", closeTime: "24:00" },
          { dayOfWeek: 4, openTime: "08:00", closeTime: "24:00" },
          { dayOfWeek: 5, openTime: "08:00", closeTime: "24:00" },
          { dayOfWeek: 6, openTime: "08:00", closeTime: "24:00" },
          { dayOfWeek: 0, openTime: "08:00", closeTime: "24:00" }, // Minggu
        ],
      },
      {
        name: "Lapangan Mini Soccer",
        sport: "MiniSoccer",
        availability: [
          { dayOfWeek: 1, openTime: "08:00", closeTime: "24:00" },
          { dayOfWeek: 2, openTime: "08:00", closeTime: "24:00" },
          { dayOfWeek: 3, openTime: "08:00", closeTime: "24:00" },
          { dayOfWeek: 4, openTime: "08:00", closeTime: "24:00" },
          { dayOfWeek: 5, openTime: "08:00", closeTime: "24:00" },
          { dayOfWeek: 6, openTime: "08:00", closeTime: "24:00" },
          { dayOfWeek: 0, openTime: "08:00", closeTime: "24:00" },
        ],
      },
      {
        name: "Lapangan Badminton",
        sport: "Badminton",
        availability: [
          { dayOfWeek: 1, openTime: "08:00", closeTime: "24:00" },
          { dayOfWeek: 2, openTime: "08:00", closeTime: "24:00" },
          { dayOfWeek: 3, openTime: "08:00", closeTime: "24:00" },
          { dayOfWeek: 4, openTime: "08:00", closeTime: "24:00" },
          { dayOfWeek: 5, openTime: "08:00", closeTime: "24:00" },
          { dayOfWeek: 6, openTime: "08:00", closeTime: "24:00" },
          { dayOfWeek: 0, openTime: "08:00", closeTime: "24:00" },
        ],
      },
      {
        name: "Lapangan Padel",
        sport: "Padel",
        availability: [
          { dayOfWeek: 1, openTime: "08:00", closeTime: "24:00" },
          { dayOfWeek: 2, openTime: "08:00", closeTime: "24:00" },
          { dayOfWeek: 3, openTime: "08:00", closeTime: "24:00" },
          { dayOfWeek: 4, openTime: "08:00", closeTime: "24:00" },
          { dayOfWeek: 5, openTime: "08:00", closeTime: "24:00" },
          { dayOfWeek: 6, openTime: "08:00", closeTime: "24:00" },
          { dayOfWeek: 0, openTime: "08:00", closeTime: "24:00" },
        ],
      },
    ];

    await Field.insertMany(fields);
    console.log("✅ Fields seeded successfully!");
    process.exit();
  } catch (error) {
    console.error("❌ Error seeding fields:", error);
    process.exit(1);
  }
};

seedFields();
