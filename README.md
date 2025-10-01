# MilanoSport Backend API

Backend aplikasi booking lapangan olahraga MilanoSport yang dibangun dengan Express.js, MongoDB, dan Cloudinary untuk upload file.

## 🏗️ Teknologi yang Digunakan

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database dengan Mongoose ODM
- **JWT** - Authentication
- **Cloudinary** - File upload dan storage
- **Multer** - Middleware untuk handling file upload
- **bcryptjs** - Password hashing

## 📁 Struktur Folder

```
src/
├── config/
│   ├── db.js              # Konfigurasi database MongoDB
│   └── cloudinary.js      # Konfigurasi Cloudinary untuk upload file
├── models/
│   ├── User.js            # Model user (name, email, password, role)
│   ├── Sport.js           # Model olahraga (Futsal, MiniSoccer, Badminton, Padel)
│   ├── Field.js           # Model lapangan (name, sport, price, availability)
│   └── Booking.js         # Model booking dengan proof of payment
├── controllers/
│   ├── authController.js  # Register, login, dan authentication
│   ├── fieldController.js # CRUD field dan availability check
│   ├── bookingController.js # Booking management & upload proof
│   └── userController.js  # User profile management
├── routes/
│   ├── authRoutes.js      # /api/auth routes
│   ├── fieldRoutes.js     # /api/fields routes
│   ├── bookingRoutes.js   # /api/bookings routes
│   └── userRoutes.js      # /api/users routes
├── middleware/
│   ├── authMiddleware.js  # JWT verification & role checking
│   └── errorHandler.js    # Global error handling
├── utils/
│   ├── logger.js          # Logging utility
│   └── response.js        # Standardized API responses
├── app.js                 # Express app configuration
└── server.js              # Server entry point
```

## 🚀 Cara Setup dan Menjalankan

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

Buat file `.env` dengan konfigurasi berikut:

```env
PORT=3000
MONGO_URI=mongodb+srv://milanmulizar29:G91KKsCsqoPuW3zg@milan.eas2sqd.mongodb.net/milanosport?retryWrites=true&w=majority&appName=milan
JWT_SECRET=milanosportaceh2024supersecret
JWT_EXPIRE=30d
NODE_ENV=development

# Cloudinary Configuration (Ganti dengan akun Cloudinary Anda)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Setup Cloudinary

1. Daftar akun di [Cloudinary](https://cloudinary.com/)
2. Ambil Cloud Name, API Key, dan API Secret dari dashboard
3. Masukkan ke file `.env`

### 4. Jalankan Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server akan berjalan di `http://localhost:3000`

## 📚 API Endpoints

### 🔐 Authentication (`/api/auth`)

```bash
POST /api/auth/register    # Register user baru
POST /api/auth/login       # Login user
GET  /api/auth/me          # Get current user profile
```

### 🏟️ Fields (`/api/fields`)

```bash
# Public endpoints
GET  /api/fields                    # Get semua lapangan
GET  /api/fields/sports             # Get semua jenis olahraga
GET  /api/fields/sport/:sportName   # Get lapangan berdasarkan olahraga
GET  /api/fields/:id                # Get detail lapangan
GET  /api/fields/:id/availability/:date # Check ketersediaan lapangan

# Admin only endpoints
POST   /api/fields         # Buat lapangan baru
PUT    /api/fields/:id     # Update lapangan
DELETE /api/fields/:id     # Delete lapangan
```

### 📅 Bookings (`/api/bookings`)

```bash
# User endpoints
POST /api/bookings                    # Buat booking baru
GET  /api/bookings                    # Get booking user
GET  /api/bookings/:id                # Get detail booking
PUT  /api/bookings/:id/cancel         # Cancel booking
POST /api/bookings/:id/upload-proof   # Upload bukti transfer

# Admin endpoints
GET /api/bookings/admin/all           # Get semua booking
PUT /api/bookings/:id/payment-status  # Update status pembayaran
```

### 👤 Users (`/api/users`)

```bash
# User endpoints
GET /api/users/profile       # Get profile
PUT /api/users/profile       # Update profile

# Admin endpoints
GET    /api/users            # Get semua user
GET    /api/users/:id        # Get user by ID
PUT    /api/users/:id        # Update user
DELETE /api/users/:id        # Delete user
```

## 📝 Contoh Penggunaan API

### 1. Register User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "user"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 3. Create Booking

```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "fieldId": "FIELD_ID",
    "date": "2024-10-15",
    "startTime": "10:00",
    "endTime": "12:00",
    "paymentMethod": "transfer",
    "notes": "Booking untuk latihan"
  }'
```

### 4. Upload Bukti Transfer

```bash
curl -X POST http://localhost:3000/api/bookings/BOOKING_ID/upload-proof \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "proofFile=@/path/to/proof-image.jpg"
```

## 🔒 Authentication & Authorization

### JWT Token

Setelah login berhasil, sertakan JWT token di header untuk akses protected routes:

```
Authorization: Bearer <your-jwt-token>
```

### User Roles

- **user**: User biasa yang bisa booking lapangan
- **admin**: Admin yang bisa mengelola lapangan dan melihat semua booking

## 📊 Database Models

### User Model

```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: "user" | "admin",
  timestamps: true
}
```

### Sport Model

```javascript
{
  sportName: "Futsal" | "MiniSoccer" | "Badminton" | "Padel",
  description: String,
  timestamps: true
}
```

### Field Model

```javascript
{
  name: String,
  sport: ObjectId (ref: Sport),
  pricePerHour: Number,
  availability: [{
    dayOfWeek: Number (0-6),
    openTime: String ("HH:MM"),
    closeTime: String ("HH:MM")
  }],
  isActive: Boolean,
  timestamps: true
}
```

### Booking Model

```javascript
{
  userId: ObjectId (ref: User),
  fieldId: ObjectId (ref: Field),
  date: Date,
  startTime: String ("HH:MM"),
  endTime: String ("HH:MM"),
  totalHours: Number,
  totalPrice: Number,
  paymentMethod: "transfer" | "cod",
  paymentStatus: "pending" | "paid" | "failed",
  status: "active" | "cancelled" | "completed",
  proofOfPayment: String (Cloudinary URL),
  notes: String,
  timestamps: true
}
```

## 📤 Upload File

### Cloudinary Integration

- Bukti transfer disimpan di Cloudinary
- Folder: `milanosport/payment-proofs`
- Format support: JPG, JPEG, PNG, PDF
- Max size: 5MB
- Auto-generate unique filename

### Upload Flow

1. User upload bukti transfer via `POST /api/bookings/:id/upload-proof`
2. File diupload ke Cloudinary
3. URL disimpan ke field `proofOfPayment` di database
4. Payment status diubah ke `pending` untuk review admin

## 🔧 Validasi dan Error Handling

### Booking Validations

- Tidak boleh booking di masa lalu
- Tidak boleh overlap dengan booking lain
- Harus dalam jam operasional lapangan
- End time harus lebih besar dari start time
- Minimum 1 jam, maksimum 8 jam

### Error Responses

```javascript
{
  "success": false,
  "statusCode": 400,
  "timestamp": "2024-10-01T10:00:00.000Z",
  "error": "Error message here"
}
```

### Success Responses

```javascript
{
  "success": true,
  "statusCode": 200,
  "timestamp": "2024-10-01T10:00:00.000Z",
  "message": "Success message",
  "data": { ... }
}
```

## 🛠️ Development

### Available Scripts

```bash
npm run dev    # Jalankan dengan nodemon (auto-restart)
npm start      # Jalankan production mode
npm test       # Run tests (belum diimplementasi)
```

### Logs

Server menggunakan custom logger yang menampilkan:

- Timestamp
- Log level (INFO, WARN, ERROR, DEBUG)
- Pesan log

## 🐛 Troubleshooting

### MongoDB Connection Issues

1. Pastikan koneksi internet stabil
2. Check MongoDB Atlas network access settings
3. Whitelist IP address di MongoDB Atlas

### Cloudinary Upload Issues

1. Pastikan API credentials benar
2. Check file format dan size
3. Pastikan Cloudinary quota tidak habis

### JWT Token Issues

1. Pastikan JWT_SECRET di .env
2. Check token expiration
3. Pastikan format header: `Bearer <token>`

## 📞 Support

Jika ada masalah atau error:

1. Check server logs di terminal
2. Pastikan semua environment variables sudah benar
3. Verifikasi koneksi ke MongoDB dan Cloudinary
4. Check API endpoint dan HTTP methods
