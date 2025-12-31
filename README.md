# Mobile Backend API

Backend API untuk aplikasi mobile barbershop (React Native).

## Endpoints

### Authentication
- `POST /api/login` - Login user
- `POST /api/register` - Register user baru

### Services
- `GET /api/services` - Get semua layanan

### Capsters
- `GET /api/capsters` - Get semua capster

### Appointments
- `GET /api/appointments?user_id={userId}` - Get appointments by user
- `POST /api/appointments` - Create appointment baru

### Accounts
- `GET /api/accounts` - Get semua akun (admin only)

## Environment Variables

Buat file `.env` dengan isi:
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
DATABASE_URL=your_postgres_connection_string
PORT=5003
```

## Development

```bash
npm install
npm run dev
```

Server akan jalan di `http://localhost:5003`

## Deploy ke Vercel

### 1. Push ke GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/mobile-backend.git
git push -u origin main
```

### 2. Import di Vercel

1. Buka [vercel.com](https://vercel.com)
2. Login dengan GitHub
3. Klik **"Add New"** → **"Project"**
4. Import repository `mobile-backend`
5. Klik **"Deploy"**

### 3. Set Environment Variables

Di Vercel dashboard:
1. Buka project → **Settings** → **Environment Variables**
2. Tambahkan:
   - `SUPABASE_URL` = `your_supabase_url`
   - `SUPABASE_ANON_KEY` = `your_supabase_key`
   - `DATABASE_URL` = `your_postgres_connection_string`
3. Klik **Save**
4. Redeploy project

### 4. Update Mobile App

Ubah `mobile-app/src/config/api.js`:
```javascript
const API_BASE_URL = 'https://your-project.vercel.app';
```

## Testing

Setelah deploy, test endpoints:

```bash
# Test services
curl https://your-project.vercel.app/api/services

# Test capsters
curl https://your-project.vercel.app/api/capsters
```
