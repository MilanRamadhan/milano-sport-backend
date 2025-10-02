import jwt from "jsonwebtoken";
import Auth from "../models/Auth.js";

export const verifyToken = async (req, res, next) => {
  // 1. Ambil Token dari Header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ status: 401, message: "Akses ditolak. Token tidak disediakan atau format salah." });
  }

  const token = authHeader.split(" ")[1];

  try {
    // 2. Verifikasi Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Cari User di Database untuk mendapatkan ROLE yang akurat
    // Kita hanya mengambil ID dari Token, lalu mencari ID, Role, dan Email di DB
    const user = await Auth.findById(decoded.id).select("_id name email role");

    if (!user) {
      return res.status(401).json({ status: 401, message: "Token tidak valid: Pengguna tidak ditemukan." });
    }

    // 4. Injeksi data User ke req.user
    // PASTIKAN role diinjeksi sebagai tipe yang sama (Boolean)
    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role, // Ini harus berupa nilai BOOLEAN: true atau false
    };

    // Console log untuk debugging (akan muncul di terminal)
    console.log("✅ Token verified, user:", req.user);

    next();
  } catch (error) {
    console.error("JWT Verification Error:", error);
    return res.status(401).json({ status: 401, message: "Token tidak valid atau kedaluwarsa." });
  }
};
