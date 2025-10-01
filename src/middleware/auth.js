import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      status: 401,
      message: "Access denied. No token provided.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Simpan payload ke dalam `req.user` untuk digunakan di fungsi lain
    console.log("✅ Token verified, user:", decoded);
    next();
  } catch (error) {
    console.error("❌ JWT error:", error.message);
    res.status(403).json({
      status: 403,
      message: "Invalid or expired token.",
    });
  }
};
