# Mobile Barbershop App (Full Stack)

Aplikasi mobile booking barbershop dengan React Native frontend dan Node.js/Express backend.

## 📁 Project Structure
- `/backend` - Express.js REST API
- `/frontend` - React Native + Expo

## 📚 Backend API Documentation

API documentation tersedia di **Swagger UI** setelah backend berjalan:

- **Development**: http://localhost:5003/api-docs
- **Production**: https://brocode-mobile-app.vercel.app/api-docs

## ⚙️ Backend Setup

### Prerequisites
- Node.js >= 18
- PostgreSQL (atau database service lainnya)

### Environment Variables
Buat file `backend/.env`:
```env
DATABASE_URL=postgresql://user:password@host:port/dbname
PORT=5003
```

### Installation & Development
```bash
cd backend
npm install
npm run dev
```

Server akan berjalan di `http://localhost:5003`

## 📱 Frontend Setup

### Prerequisites
- Node.js >= 18
- Expo CLI

### Installation & Development
```bash
cd frontend
npm install
npm start
```

Scan QR code dengan **Expo Go** app di smartphone Anda.

### Environment Variables
Buat file `frontend/.env.local`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXP✨ Fitur Aplikasi

- 🔐 **Authentication** - Login & Register user
- 🏠 **Home** - Informasi barbershop & tim
- 💇 **Services** - Daftar layanan barbershop
- 📅 **Booking** - Membuat & manage appointment
- 👤 **Profile** - Profil pengguna dan history
- 👨‍💼 **Admin** - Dashboard dengan statistik & data management
- 💇 **Services** - Daftar layanan
- 🚀 Deployment

### Backend ke Vercel

1. Push repository ke GitHub
2. Di [vercel.com](https://vercel.com), import repository
3. Set environment variables di Vercel dashboard:
   - `DATABASE_URL` = your_postgres_connection_string
4. Deploy

### Frontend ke Expo/EAS (Recommended)

Untuk build aplikasi mobile production:

```bash
cd frontend
eas build
```

Ikuti dokumentasi [Expo EAS Build](https://docs.expo.dev/build/setup/) untuk detail lengkap.

## 🧪 Testing API

Setelah backend berjalan, test endpoints:

```bash
# Test services
curl http://localhost:5003/api/services

# Test capsters
curl http://localhost:5003/api/capsters

# Test appointments
curl http://localhost:5003/api/appointments
```

Atau akses Swagger UI documentation untuk testing interaktif di `/api-docsrl https://your-project.vercel.app/api/services

# Test capsters
curl https://your-project.vercel.app/api/capsters
```