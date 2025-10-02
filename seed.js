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
          { dayOfWeek: 1, openTime: "07:00", closeTime: "23:59" }, // Senin
          { dayOfWeek: 2, openTime: "07:00", closeTime: "23:59" }, // Selasa
          { dayOfWeek: 3, openTime: "07:00", closeTime: "23:59" },
          { dayOfWeek: 4, openTime: "07:00", closeTime: "23:59" },
          { dayOfWeek: 5, openTime: "07:00", closeTime: "23:59" },
          { dayOfWeek: 6, openTime: "07:00", closeTime: "23:59" },
          { dayOfWeek: 0, openTime: "07:00", closeTime: "23:59" }, // Minggu
        ],
      },
      {
        name: "Lapangan Mini Soccer",
        sport: "MiniSoccer",
        availability: [
          { dayOfWeek: 1, openTime: "07:00", closeTime: "23:59" },
          { dayOfWeek: 2, openTime: "07:00", closeTime: "23:59" },
          { dayOfWeek: 3, openTime: "07:00", closeTime: "23:59" },
          { dayOfWeek: 4, openTime: "07:00", closeTime: "23:59" },
          { dayOfWeek: 5, openTime: "07:00", closeTime: "23:59" },
          { dayOfWeek: 6, openTime: "07:00", closeTime: "23:59" },
          { dayOfWeek: 0, openTime: "07:00", closeTime: "23:59" },
        ],
      },
      {
        name: "Lapangan Badminton",
        sport: "Badminton",
        availability: [
          { dayOfWeek: 1, openTime: "07:00", closeTime: "23:59" },
          { dayOfWeek: 2, openTime: "07:00", closeTime: "23:59" },
          { dayOfWeek: 3, openTime: "07:00", closeTime: "23:59" },
          { dayOfWeek: 4, openTime: "07:00", closeTime: "23:59" },
          { dayOfWeek: 5, openTime: "07:00", closeTime: "23:59" },
          { dayOfWeek: 6, openTime: "07:00", closeTime: "23:59" },
          { dayOfWeek: 0, openTime: "07:00", closeTime: "23:59" },
        ],
      },
      {
        name: "Lapangan Padel",
        sport: "Padel",
        availability: [
          { dayOfWeek: 1, openTime: "07:00", closeTime: "23:59" },
          { dayOfWeek: 2, openTime: "07:00", closeTime: "23:59" },
          { dayOfWeek: 3, openTime: "07:00", closeTime: "23:59" },
          { dayOfWeek: 4, openTime: "07:00", closeTime: "23:59" },
          { dayOfWeek: 5, openTime: "07:00", closeTime: "23:59" },
          { dayOfWeek: 6, openTime: "07:00", closeTime: "23:59" },
          { dayOfWeek: 0, openTime: "07:00", closeTime: "23:59" },
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
