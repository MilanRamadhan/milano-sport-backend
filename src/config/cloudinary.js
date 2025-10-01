const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "milanosport/payment-proofs", // Folder di Cloudinary
    allowed_formats: ["jpg", "jpeg", "png", "pdf"], // Format file yang diizinkan
    public_id: (req, file) => {
      // Generate unique filename
      const timestamp = Date.now();
      const userId = req.user ? req.user._id : "anonymous";
      return `payment_proof_${userId}_${timestamp}`;
    },
  },
});

// Configure multer with Cloudinary storage
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only image files (JPG, JPEG, PNG) and PDF are allowed!"), false);
    }
  },
});

module.exports = {
  cloudinary,
  upload,
};
