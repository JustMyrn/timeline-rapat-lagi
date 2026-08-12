# Timeline Rapat (Meeting Timeline Management System)

Aplikasi manajemen jadwal rapat berbasis web interaktif dengan fitur penampil TV (*TV Display*) untuk memberikan informasi aktual (*real-time*) mengenai status dan ruang rapat. Sistem ini terdiri dari *Backend* berbasis Node.js/Express dan *Frontend* menggunakan React.js.

## Fitur Utama

- **TV Display (Real-time)**: Halaman khusus yang menampilkan animasi dan jadwal rapat berjalan secara langsung, sangat cocok ditampilkan pada monitor atau TV publik.
- **Dashboard & Statistik**: Ringkasan jadwal rapat bulanan, per departemen, serta total rapat selesai/dibatalkan dengan visualisasi grafik interaktif.
- **Manajemen Jadwal**: Penambahan, pengubahan, dan penghapusan jadwal rapat secara mulus, termasuk fitur toleransi waktu mulai/selesai rapat.
- **Manajemen Pengguna & Departemen**: Sistem autentikasi pengguna dan pengelola daftar departemen terkait.
- **Import Jadwal via Excel**: Menambahkan puluhan jadwal sekaligus menggunakan format *template* `.xlsx` yang disediakan.
- **Log Aktivitas**: Pemantauan semua interaksi pengguna di dalam aplikasi dengan waktu yang otomatis dikalibrasi (Zona WIB/Jakarta).

## Teknologi yang Digunakan

- **Frontend:** React.js, Tailwind CSS, Framer Motion (untuk animasi UI), Recharts (untuk grafik).
- **Backend:** Node.js, Express.js.
- **Database:** PostgreSQL (atau layanan seperti Supabase).
- **Lain-lain:** JWT untuk autentikasi, `node-postgres` untuk interaksi *database*, `xlsx` untuk pemrosesan impor.

---

## Prasyarat (Requirements)

Sebelum menjalankan aplikasi, pastikan Anda telah menginstal beberapa hal berikut di komputer Anda:
- [Node.js](https://nodejs.org/en/download/) (Versi 16 atau lebih baru)
- PostgreSQL terpasang di lokal Anda (contoh: menggunakan pgAdmin atau psql)

---

## Panduan Instalasi dan Menjalankan di Lokal (Local Development)

Secara garis besar, Anda perlu menjalankan *backend* (server) dan *frontend* (client) secara bersamaan melalui 2 terminal yang berbeda.

### 1. Setup Database
1. Buka PostgreSQL lokal Anda (misal melalui pgAdmin, DBeaver, atau terminal psql).
2. Buat sebuah database baru (misalnya dengan nama `timeline_rapat`).
3. Jalankan query/skrip SQL untuk membuat tabel-tabel utama (`rapat`, `departemen`, `user`, dan `log_akses`) beserta relasinya.

### 2. Konfigurasi Backend (Server)

Buka **Terminal 1**, dan ikuti langkah berikut:

```bash
# Masuk ke direktori server
cd server

# Install dependensi yang dibutuhkan
npm install
```

Buat file `.env` di dalam folder `server` (sejajar dengan `package.json`), dan isi dengan konfigurasi berikut:
```env
# Port lokal untuk backend server
PORT=5000

# Connection string ke database PostgreSQL lokal Anda
DATABASE_URL=postgresql://postgres:password123@localhost:5432/timeline_rapat

# Kunci rahasia untuk pembuatan token login
JWT_SECRET=rahasia-jwt-anda

# Menit toleransi perhitungan status "Berlangsung" dan "Akan Datang"
BUFFER_TOLERANSI_MENIT=5
```

Jalankan server backend:
```bash
npm run dev
```
*(Server akan berjalan pada `http://localhost:5000`)*

### 3. Konfigurasi Frontend (Client)

Buka **Terminal 2**, dan ikuti langkah berikut:

```bash
# Masuk ke direktori client
cd client

# Install dependensi yang dibutuhkan
npm install
```

Jalankan server frontend:
```bash
npm run dev
```
*(Aplikasi React akan terbuka dan dapat diakses biasanya melalui `http://localhost:5173` atau `http://localhost:3000`)*

---

## Struktur Direktori Secara Umum

```
timeline-rapat/
├── client/                 # Kode Frontend (React)
│   ├── public/             # Aset publik statis
│   ├── src/
│   │   ├── components/     # Komponen-komponen UI (Modal, Button, Form)
│   │   ├── context/        # React Context (AuthContext dll)
│   │   ├── pages/          # Halaman aplikasi (Dashboard, TVDisplay, Jadwal, dll)
│   │   └── services/       # File fetch/axios API ke backend
│   └── package.json
└── server/                 # Kode Backend (Node.js/Express)
    ├── src/
    │   ├── config/         # Pengaturan Database (db.js)
    │   ├── controllers/    # Logika bisnis dan fungsi API
    │   ├── middleware/     # Auth, pengecekan Token
    │   └── routes/         # Routing API (endpoints)
    └── package.json
```

## Tips Tambahan

1. **Waktu/Timezone:** Aplikasi ini telah disetel untuk mengkalibrasi jadwal dalam zona waktu `Asia/Jakarta` (WIB) demi menghindari bug pergeseran tanggal/bulan antar komputer klien dan *server*. Pastikan data yang dimasukkan ke *database* dipahami sebagai waktu WIB.
2. **TV Display:** URL spesial untuk menaruh *TV Display* adalah `/tv`. Halaman tersebut secara otomatis memuat ulang (*refresh*) data dalam interval tertentu secara asinkron tanpa mengganggu kenyamanan pandangan audiens.
