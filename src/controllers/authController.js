import Auth from "../models/Auth.js";
import { verifyToken } from "../middleware/auth.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role === undefined) {
      return res.status(400).json({
        status: 400,
        message: "semua kolom harus di isi",
      });
    }

    const alreadyRegister = await Auth.findOne({ email });
    if (alreadyRegister) {
      return res.status(400).json({
        status: 400,
        message: "akun dengan email ini sudah terdaftar, silahkan gunakan email lain",
      });
    } else {
      const newUser = new Auth({
        name,
        email,
        password,
        role,
      });

      bcryptjs.hash(password, 10, async (err, hash) => {
        if (err) {
          return res.status(500).json(err);
        }

        newUser.set("password", hash);
        await newUser.save(); // Tunggu sampai user disimpan ke DB

        return res.status(200).json({ data: newUser, message: "Pengguna berhasil terdaftar." });
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "internal server error",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        status: 400,
        message: "Silakan isi semua kolom yang diperlukan.",
      });
    } else {
      const user = await Auth.findOne({ email });
      if (!user) {
        return res.status(400).json({ status: 400, message: "Email atau kata sandi salah." });
      } else {
        const validateUser = await bcryptjs.compare(password, user.password);
        if (!validateUser) {
          res.status(400).json({ status: 400, message: "Email atau kata sandi salah." });
        } else {
          const payload = {
            id: user._id,
            email: user.email,
          };
          const JWT_SECRET = process.env.JWT_SECRET;

          jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" }, async (err, token) => {
            if (err) {
              return res.status(500).json(err);
            }
            user.set("token", token);
            await user.save();

            return res.status(200).json({
              status: 200,
              data: user,
              token: user.token,
            });
          });
        }
      }
    }
  } catch (error) {
    console.log("Error during login:", error);
    res.status(500).json({
      status: 500,
      message: "Kesalahan server internal",
    });
  }
};

export const logout = async (req, res) => {
  try {
    const { userId } = req.body; // Assuming userId is sent from the client during logout

    if (!userId) {
      return res.status(400).json({
        status: 400,
        message: "ID Pengguna diperlukan untuk keluar.",
      });
    }

    const user = await Auth.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 404, message: "Pengguna tidak ditemukan." });
    }

    // Remove or set token to null
    user.set("token", null);
    await user.save();

    return res.status(200).json({ status: 200, message: "Pengguna berhasil keluar." });
  } catch (error) {
    return res.status(500).json({ status: 500, message: "Terjadi kesalahan saat keluar." });
  }
};
