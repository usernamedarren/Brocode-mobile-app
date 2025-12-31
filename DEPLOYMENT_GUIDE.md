# 📱 PANDUAN LENGKAP: Setup Backend Terpisah untuk Mobile App

## 🎯 Yang Sudah Dibuat

Folder `mobile-backend` berisi:
- ✅ `src/` - Semua source code backend (routes, db, server)
- ✅ `package.json` - Dependencies
- ✅ `vercel.json` - Config deployment Vercel
- ✅ `.env` - Environment variables (jangan dicommit!)
- ✅ `.gitignore` - Ignore files
- ✅ `README.md` - Dokumentasi

---

## 📋 LANGKAH 1: Test Backend Lokal

```bash
cd mobile-backend
npm install
npm run dev
```

Buka browser: `http://localhost:5003/api/services`

Jika berhasil, kamu akan lihat data services dalam JSON.

---

## 🌐 LANGKAH 2: Push ke GitHub (Repo Baru)

### A. Buat Repository Baru di GitHub

1. Buka [github.com/new](https://github.com/new)
2. Nama repository: `barbershop-mobile-backend` (atau nama lain)
3. **Pilih Private** (karena ada credentials)
4. **JANGAN** centang "Add README"
5. Klik **Create repository**

### B. Push Code

Buka terminal di folder `mobile-backend`:

```bash
# Masuk ke folder mobile-backend
cd "c:\Users\asus\OneDrive - Institut Teknologi Bandung\AKADEMIK\DEVELOPMENT\HTML\UTS-PAWM\mobile-backend"

# Initialize git
git init

# Add all files (kecuali yang ada di .gitignore)
git add .

# First commit
git commit -m "Initial commit: Mobile backend API"

# Connect to your new GitHub repo
git remote add origin https://github.com/USERNAME/barbershop-mobile-backend.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Ganti `USERNAME` dengan username GitHub kamu!**

---

## 🚀 LANGKAH 3: Deploy ke Vercel

### A. Login ke Vercel

1. Buka [vercel.com](https://vercel.com)
2. Klik **Login** → Pilih **Continue with GitHub**
3. Authorize Vercel

### B. Import Project

1. Di Vercel Dashboard, klik **Add New...** → **Project**
2. Cari repo `barbershop-mobile-backend`
3. Klik **Import**

### C. Configure Project

**Framework Preset:** Other (biarkan default)

**Root Directory:** `.` (biarkan kosong atau titik)

**Build Command:** (kosongkan)

**Output Directory:** (kosongkan)

Klik **Deploy** (akan gagal karena belum ada env variables)

### D. Set Environment Variables

1. Deployment pertama akan gagal - **ini normal!**
2. Di Vercel dashboard, buka **Settings** → **Environment Variables**
3. Tambahkan 3 variables ini:

**Variable 1:**
- **Name:** `SUPABASE_URL`
- **Value:** (copy dari file `.env` lokal kamu)
- **Environment:** Production, Preview, Development (centang semua)

**Variable 2:**
- **Name:** `SUPABASE_ANON_KEY`  
- **Value:** (copy dari file `.env` lokal kamu)
- **Environment:** Production, Preview, Development (centang semua)

**Variable 3:**
- **Name:** `DATABASE_URL`
- **Value:** (copy dari file `.env` lokal kamu)
- **Environment:** Production, Preview, Development (centang semua)

4. Klik **Save** untuk setiap variable

### E. Redeploy

1. Klik **Deployments** di menu atas
2. Klik titik 3 di deployment terakhir → **Redeploy**
3. Tunggu beberapa detik
4. Status berubah jadi **Ready** ✅

### F. Get Production URL

Setelah deploy sukses, kamu akan dapat URL seperti:
```
https://barbershop-mobile-backend-xxx.vercel.app
```

Copy URL ini!

---

## 📱 LANGKAH 4: Update Mobile App

Buka file `mobile-app/src/config/api.js`:

```javascript
// Ganti URL ini dengan URL Vercel kamu
const API_BASE_URL = 'https://barbershop-mobile-backend-xxx.vercel.app';
```

Save file, lalu reload app di HP.

---

## ✅ LANGKAH 5: Test Endpoints

### Test di Browser

Buka browser, coba URL ini (ganti dengan URL Vercel kamu):

```
https://barbershop-mobile-backend-xxx.vercel.app/api/services
https://barbershop-mobile-backend-xxx.vercel.app/api/capsters
```

Jika berhasil, kamu akan lihat data JSON!

### Test dari Mobile App

1. Login ke app
2. Buka tab Booking
3. Pilih service & capster
4. Submit booking
5. Cek console log - harusnya berhasil!

---

## 🔧 Troubleshooting

### Error: "Cannot GET /api/appointments"

**Solusi:** Pastikan file `src/routes/appointmentsRoutes.js` ada dan terupload ke GitHub.

```bash
# Cek apakah file ada
ls src/routes/

# Jika tidak ada, copy lagi
cd ..
Copy-Item -Path "src/routes/appointmentsRoutes.js" -Destination "mobile-backend/src/routes/"

# Push ulang
cd mobile-backend
git add .
git commit -m "Add appointments route"
git push
```

Vercel akan auto-redeploy.

### Error: "Network request failed"

**Solusi 1:** Cek URL di `api.js` sudah benar

**Solusi 2:** Cek environment variables di Vercel sudah diset

**Solusi 3:** Buka URL di browser, pastikan API accessible

### Error: "500 Internal Server Error"

**Solusi:** Cek Vercel logs:
1. Buka Vercel dashboard
2. Klik project → **Deployments**
3. Klik deployment terakhir
4. Scroll ke bawah, lihat **Runtime Logs**
5. Cari error message

---

## 📝 Update Code Nanti

Jika kamu update backend:

```bash
cd mobile-backend
git add .
git commit -m "Update: description of changes"
git push
```

Vercel akan **auto-deploy** setiap kali push!

---

## 🎉 Summary

✅ Backend terpisah dari web project
✅ Deploy sendiri di Vercel  
✅ Mobile app connect ke backend sendiri
✅ Web project tidak tersentuh

**Next Steps:**
- Test semua fitur di mobile app
- Jika ada bug, fix di `mobile-backend`, commit, push
- Vercel auto-redeploy setiap push

Good luck! 🚀
