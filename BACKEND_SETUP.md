# Quick Start Guide - Backend Setup

## Prerequisites

- Node.js (v14+)
- MongoDB Atlas account atau MongoDB local

## Setup Steps

### 1. Install Dependencies

```bash
cd milanosport-backend
npm install
```

### 2. Create Environment File

Buat file `.env` di folder `milanosport-backend`:

```env
# MongoDB
MONGO_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/milanosport?retryWrites=true&w=majority

# JWT
JWT_SECRET=your_super_secret_key_change_this_in_production_12345

# Server
PORT=5000

# Cloudinary (Optional - untuk upload gambar)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**⚠️ PENTING:**

- Ganti `MONGO_URI` dengan connection string MongoDB Anda
- Ganti `JWT_SECRET` dengan string random yang aman
- Jika tidak menggunakan Cloudinary, kosongkan atau hapus

### 3. Seed Database (Optional)

Isi database dengan data lapangan awal:

```bash
node seed.js
```

Output yang diharapkan:

```
✅ Fields seeded successfully!
```

### 4. Run Backend Server

**Development mode (with auto-reload):**

```bash
npm run dev
```

**Production mode:**

```bash
npm start
```

### 5. Verify Server is Running

Anda harus melihat output seperti ini:

```
Server running on port 5000
Pinged your deployment. You successfully connected to MongoDB!
```

### 6. Test Endpoints

**Test root endpoint:**

```bash
curl http://localhost:5000
```

Expected response:

```json
{
  "status": 200,
  "message": "hello"
}
```

**Test API endpoint:**

```bash
curl http://localhost:5000/api/fields
```

## Troubleshooting

### Error: "Cannot connect to MongoDB"

**Penyebab:**

- Connection string salah
- IP tidak di-whitelist di MongoDB Atlas
- Internet bermasalah

**Solusi:**

1. Cek `MONGO_URI` di `.env` sudah benar
2. Di MongoDB Atlas:
   - Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0)
3. Test koneksi internet

### Error: "Port 5000 already in use"

**Solusi 1:** Ubah port di `.env`

```env
PORT=3001
```

**Solusi 2:** Hentikan aplikasi lain yang menggunakan port 5000

```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :5000
kill -9 <PID>
```

### Error: "JWT_SECRET is not defined"

Pastikan file `.env` ada dan berisi `JWT_SECRET`:

```env
JWT_SECRET=your_secret_key_here
```

### Error: Module not found

Install ulang dependencies:

```bash
rm -rf node_modules
npm install
```

## API Endpoints Overview

### Public Endpoints (No authentication required)

- `POST /api/auth/register` - Register user baru
- `POST /api/auth/login` - Login user
- `GET /api/fields` - Get semua lapangan
- `GET /api/fields/:id` - Get detail lapangan

### Protected Endpoints (Require JWT token)

- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/logout` - Logout user
- `POST /api/bookings` - Create booking
- `GET /api/bookings/me` - Get user bookings
- `PATCH /api/bookings/:id/cancel` - Cancel booking

## Testing Backend

Run the test script:

```bash
# Make sure backend is running first!
node test-backend-connection.js
```

## Project Structure

```
milanosport-backend/
├── src/
│   ├── config/
│   │   └── cloudinary.js        # Cloudinary config
│   ├── controllers/
│   │   ├── authController.js    # Auth logic
│   │   ├── bookingController.js # Booking logic
│   │   └── fieldController.js   # Field logic
│   ├── middleware/
│   │   └── auth.js              # JWT verification
│   ├── models/
│   │   ├── Auth.js              # User model
│   │   ├── Booking.js           # Booking model
│   │   └── Field.js             # Field model
│   ├── routes/
│   │   ├── authRouter.js        # Auth routes
│   │   ├── bookingRoutes.js     # Booking routes
│   │   └── fieldRoutes.js       # Field routes
│   └── server.js                # Main server file
├── .env                         # Environment variables
├── .env.example                 # Template for .env
├── package.json
└── seed.js                      # Database seeder
```

## Development Tips

1. **Use nodemon for auto-reload:**

   ```bash
   npm run dev
   ```

2. **Check logs in terminal** - Semua request akan ter-log di terminal

3. **Test dengan Postman/Insomnia** - Import API collection untuk testing

4. **MongoDB Compass** - Gunakan untuk view data di database

## Next Steps

1. ✅ Backend sudah running
2. ➡️ Setup Frontend (lihat frontend README)
3. ➡️ Test integrasi (lihat INTEGRATION_CHECKLIST.md)

## Need Help?

- Check [INTEGRATION_GUIDE.md](../INTEGRATION_GUIDE.md) untuk dokumentasi lengkap
- Check [INTEGRATION_CHECKLIST.md](../INTEGRATION_CHECKLIST.md) untuk testing

---

**Backend Ready! 🚀**
