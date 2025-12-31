# 🚀 Quick Deploy Cheat Sheet

## 1️⃣ Test Lokal
```bash
cd mobile-backend
npm install
npm run dev
```
Buka: http://localhost:5003/api/services

---

## 2️⃣ Push ke GitHub
```bash
cd mobile-backend
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USERNAME/barbershop-mobile-backend.git
git push -u origin main
```

---

## 3️⃣ Deploy Vercel
1. [vercel.com](https://vercel.com) → Login with GitHub
2. **Add New** → **Project**
3. Import `barbershop-mobile-backend`
4. Klik **Deploy**

---

## 4️⃣ Set Env Variables (di Vercel)
**Settings** → **Environment Variables** → Add:

- `SUPABASE_URL` = `https://xxx.supabase.co`
- `SUPABASE_ANON_KEY` = `eyJxxx...`  
- `DATABASE_URL` = `postgresql://xxx`

Centang: Production, Preview, Development

Lalu **Redeploy**!

---

## 5️⃣ Update Mobile App
Edit `mobile-app/src/config/api.js`:
```javascript
const API_BASE_URL = 'https://your-project.vercel.app';
```

---

## 🔄 Update Nanti
```bash
cd mobile-backend
git add .
git commit -m "Fix booking"
git push
```
Vercel auto-deploy! ✅
