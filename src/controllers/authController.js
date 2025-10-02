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
          return res.status(400).json({ status: 400, message: "Email atau kata sandi salah." });
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

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Dari middleware auth

    const user = await Auth.findById(userId).select("-password -token");
    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "Pengguna tidak ditemukan.",
      });
    }

    return res.status(200).json({
      status: 200,
      data: user,
      message: "Profil berhasil diambil.",
    });
  } catch (error) {
    console.log("Error getting profile:", error);
    return res.status(500).json({
      status: 500,
      message: "Kesalahan server internal",
    });
  }
};

// Edit user profile
export const editProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Dari middleware auth
    const { name, email, password, phone, address, birthDate, profileImage } = req.body;

    // Validasi input
    if (!name && !email && !password && !phone && !address && !birthDate && !profileImage) {
      return res.status(400).json({
        status: 400,
        message: "Minimal satu kolom harus diisi untuk memperbarui profil.",
      });
    }

    // Cari user berdasarkan ID
    const user = await Auth.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "Pengguna tidak ditemukan.",
      });
    }

    // Cek apakah email sudah digunakan oleh user lain
    if (email && email !== user.email) {
      const emailExists = await Auth.findOne({ email, _id: { $ne: userId } });
      if (emailExists) {
        return res.status(400).json({
          status: 400,
          message: "Email sudah digunakan oleh pengguna lain.",
        });
      }
    }

    // Update data
    const updateData = {};

    if (name) {
      updateData.name = name;
    }

    if (email) {
      updateData.email = email;
    }

    if (phone !== undefined) {
      updateData.phone = phone;
    }

    if (address !== undefined) {
      updateData.address = address;
    }

    if (birthDate !== undefined) {
      updateData.birthDate = birthDate;
    }

    if (profileImage !== undefined) {
      updateData.profileImage = profileImage;
    }

    // Jika password diubah, hash password baru
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          status: 400,
          message: "Password minimal 6 karakter.",
        });
      }

      try {
        const hashedPassword = await bcryptjs.hash(password, 10);
        updateData.password = hashedPassword;
      } catch (hashError) {
        return res.status(500).json({
          status: 500,
          message: "Gagal mengenkripsi password.",
        });
      }
    }

    // Update user
    const updatedUser = await Auth.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true }).select("-password -token");

    return res.status(200).json({
      status: 200,
      data: updatedUser,
      message: "Profil berhasil diperbarui.",
    });
  } catch (error) {
    console.log("Error updating profile:", error);
    return res.status(500).json({
      status: 500,
      message: "Kesalahan server internal",
    });
  }
};

// Change password specifically
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validasi input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        status: 400,
        message: "Password lama, password baru, dan konfirmasi password harus diisi.",
      });
    }

    // Validasi password baru
    if (newPassword.length < 6) {
      return res.status(400).json({
        status: 400,
        message: "Password baru minimal 6 karakter.",
      });
    }

    // Validasi konfirmasi password
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        status: 400,
        message: "Password baru dan konfirmasi password tidak cocok.",
      });
    }

    // Cari user
    const user = await Auth.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "Pengguna tidak ditemukan.",
      });
    }

    // Verifikasi password lama
    const isCurrentPasswordValid = await bcryptjs.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        status: 400,
        message: "Password lama tidak benar.",
      });
    }

    // Hash password baru
    const hashedNewPassword = await bcryptjs.hash(newPassword, 10);

    // Update password
    await Auth.findByIdAndUpdate(userId, { password: hashedNewPassword });

    return res.status(200).json({
      status: 200,
      message: "Password berhasil diubah.",
    });
  } catch (error) {
    console.log("Error changing password:", error);
    return res.status(500).json({
      status: 500,
      message: "Kesalahan server internal",
    });
  }
};
