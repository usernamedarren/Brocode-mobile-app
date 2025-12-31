# Barbershop Booking Mobile App

Aplikasi mobile untuk booking barbershop yang dibuat menggunakan React Native (Expo) dan Supabase.

## Fitur Aplikasi

- **Authentication**: Login dan Register dengan Supabase Auth
- **Home**: Tampilan informasi barbershop, layanan, dan tim
- **Services**: Daftar lengkap layanan yang tersedia
- **Booking**: Membuat appointment dengan pilihan layanan, barber, tanggal, dan waktu
- **Profile**: Melihat dan mengedit profil pengguna
- **Admin**: Dashboard untuk melihat statistik dan data appointments

## Teknologi yang Digunakan

- **Frontend**: React Native dengan Expo
- **Backend**: Node.js/Express dengan PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **Navigation**: React Navigation (Bottom Tabs & Stack Navigator)
- **State Management**: React Context API

## Prerequisites

- Node.js (>= 18)
- npm atau yarn
- Expo CLI
- Expo Go app (untuk testing di device)

## Instalasi

1. Clone repository ini
2. Masuk ke folder mobile-app:
   ```bash
   cd mobile-app
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Konfigurasi Supabase sudah tercantum di `src/config/supabase.js`

5. Jalankan aplikasi:
   ```bash
   npm start
   ```

6. Scan QR code dengan Expo Go app (Android/iOS)

## Struktur Folder

```
mobile-app/
├── src/
│   ├── config/
│   │   └── supabase.js          # Konfigurasi Supabase
│   ├── context/
│   │   └── AuthContext.js       # Context untuk authentication
│   ├── navigation/
│   │   └── AppNavigator.js      # Konfigurasi navigasi
│   ├── screens/
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   ├── HomeScreen.js
│   │   ├── ServicesScreen.js
│   │   ├── BookingScreen.js
│   │   ├── ProfileScreen.js
│   │   └── AdminScreen.js
│   └── components/              # Reusable components
├── assets/                      # Images, fonts, etc.
├── App.js                       # Entry point
├── app.json                     # Expo configuration
└── package.json
```

## Build APK

Untuk membuat APK, gunakan Expo Application Services (EAS):

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Login ke Expo:
   ```bash
   eas login
   ```

3. Configure EAS:
   ```bash
   eas build:configure
   ```

4. Build APK:
   ```bash
   eas build -p android --profile preview
   ```

## Fitur Mobile-Friendly

- Bottom Tab Navigation untuk navigasi mudah
- Pull to refresh di semua halaman
- Responsive design untuk berbagai ukuran layar
- Touch-friendly buttons dan forms
- Native animations dan transitions
- Keyboard-aware scrolling

## Testing

Aplikasi telah diuji dengan:
- Expo Go pada Android dan iOS
- Berbagai ukuran layar (phone dan tablet)
- Dark mode compatibility

## Pengembangan Selanjutnya

- [ ] Push notifications untuk appointment reminders
- [ ] Image upload untuk profile picture
- [ ] Rating dan review system
- [ ] Payment integration
- [ ] Offline mode dengan local storage
- [ ] Location services untuk mencari barbershop terdekat

## Kontributor

- Kelompok UAS II3140 Pengembangan Aplikasi Web dan Mobile

## License

MIT License
