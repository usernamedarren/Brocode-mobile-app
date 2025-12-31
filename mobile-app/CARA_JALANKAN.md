# Cara Menjalankan Mobile App

## Masalah yang Terjadi
- Tunnel mode Expo tidak stabil (ngrok intermittent)
- LAN mode tidak bisa karena network/firewall
- Physical device sulit connect

## Solusi Terbaik

### Opsi 1: Gunakan Android Studio Emulator (RECOMMENDED)
1. Install Android Studio
2. Buka Android Studio > Tools > Device Manager
3. Create Virtual Device (Pixel 5 atau sejenisnya)
4. Start emulator
5. Di terminal VS Code:
   ```
   cd mobile-app
   npx expo start
   tekan 'a' untuk Android
   ```

### Opsi 2: Gunakan Web Browser (Testing Cepat)
1. Di terminal VS Code:
   ```
   cd mobile-app
   npx expo start
   tekan 'w' untuk Web
   ```
2. Browser akan terbuka otomatis
3. Bisa test login/register di browser

### Opsi 3: Manual Input URL di Expo Go
1. Buka Expo Go di HP
2. Pilih "Enter URL manually"
3. Masukkan: `exp://xbleyc4-amudixp-8081.exp.direct`
4. Jika timeout, restart Expo dengan: `npx expo start --tunnel`

### Opsi 4: Deploy Mobile App (Production)
Build APK untuk distribusi:
```
npx eas build --platform android --profile preview
```

## Catatan Penting
✅ Backend sudah di-deploy ke: https://ii3140-uts-pawm-yyvw.vercel.app
✅ Mobile app sudah dikonfigurasi untuk menggunakan Vercel backend
✅ Supabase database sudah terhubung dan sama dengan web

## Akun Testing
- Email: `amudi@gmail.com`
- Password: `iyekan`

atau buat akun baru dengan Sign Up
