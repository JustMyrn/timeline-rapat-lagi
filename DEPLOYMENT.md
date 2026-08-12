# Panduan Publikasi & Hosting (Vercel + Supabase)

Dokumen ini menjelaskan langkah-langkah untuk mempublikasikan (hosting) seluruh aplikasi Timeline Rapat secara gratis. Kita akan menggunakan **Supabase** untuk _Database_ dan **Vercel** untuk mempublikasikan _Frontend_ maupun _Backend_ Node.js Anda.

---

## 1. Hosting Database (Supabase)

Supabase adalah layanan _cloud_ PostgreSQL gratis yang sangat andal dan cepat.

### Langkah-langkah:

1. Buat akun dan projek baru di [Supabase](https://supabase.com/).
2. Klik **Connect** warna hijau yang ada di atas.
3. Pilih **Direct** lalu pilih **Transaction Pooler**.
4. Salin **Connection String (URI)** yang diberikan. URL-nya akan terlihat seperti ini: `postgresql://postgres.[id]:[password]@[host]:6543/postgres`
5. Masuk ke menu **SQL Editor** di panel Supabase, dan jalankan _script_ SQL untuk membuat tabel-tabel sistem (`rapat`, `departemen`, `user`, dan `log_akses`) agar struktur _database_ Anda siap digunakan.

---

## 2. Hosting Backend Server di Vercel

Vercel sebenarnya dirancang untuk _frontend_, namun Vercel juga memiliki fitur _Serverless Functions_ yang memungkinkan kita untuk meng-hosting _backend_ Express.js!

### Persiapan Kode Backend:

Agar _backend_ Express Anda bisa berjalan di Vercel, pastikan Anda menambahkan file konfigurasi bernama `vercel.json` di dalam folder `server`.

1. Buat file `vercel.json` di dalam folder `server` dengan isi berikut:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "server.js"
       }
     ]
   }
   ```
   _(Catatan: Sesuaikan `server.js` dengan nama file utama Node.js Anda, misal `index.js` atau `app.js`)._
2. Pastikan file `package.json` Anda benar dan tidak ada _error_, lalu **push** perubahan kode ke GitHub Anda.

### Proses Deploy Backend:

1. Login ke [Vercel](https://vercel.com) dan klik **Add New -> Project**.
2. Hubungkan dengan repositori GitHub proyek ini.
3. Pada halaman konfigurasi _deploy_, ubah **Root Directory** ke folder `server`.
4. Buka tab **Environment Variables** dan masukkan kunci-kunci berikut:
   - `DATABASE_URL` = _(Paste URL koneksi dari Supabase di Langkah 1)_
   - `JWT_SECRET` = _(String rahasia untuk keamanan login, bebas)_
5. Klik **Deploy**.
6. Setelah selesai, Vercel akan memberikan **URL Publik Backend** (contoh: `https://timeline-server.vercel.app`). **Simpan URL ini untuk langkah berikutnya!**

---

## 3. Hosting Frontend Client di Vercel

Langkah terakhir adalah mempublikasikan _frontend_ React Anda dan menyambungkannya ke _backend_ yang sudah berjalan.

### Persiapan Kode Frontend:

Sebelum _deploy_, Anda wajib mengubah URL API di kode lokal Anda agar tidak lagi menunjuk ke `localhost`.
Buka file konfigurasi API Anda (biasanya `client/src/services/api.js` atau `.env` di klien) dan ganti alamat _backend_ lokal dengan **URL Publik Backend** dari Vercel:

```javascript
// Ganti baris ini:
// const BASE_URL = 'http://localhost:5000/api';

// Menjadi URL Vercel backend Anda:
const BASE_URL = "https://timeline-server.vercel.app/api";
```

Lalu, simpan dan **push** kembali kodenya ke GitHub.

### Proses Deploy Frontend:

1. Kembali ke _dashboard_ [Vercel](https://vercel.com) dan klik **Add New -> Project** lagi.
2. Pilih repositori GitHub yang sama.
3. Pada halaman konfigurasi _deploy_, ubah **Root Directory** ke folder `client`.
4. Vercel biasanya akan otomatis mendeteksi bahwa ini adalah proyek `Vite` atau `Create React App`. Pastikan konfigurasi _build_ bawaan tidak diubah (biasanya `npm run build` dan folder output `dist`).
5. Klik **Deploy**.
6. Tunggu 1-2 menit hingga Vercel memproses _build_ antarmuka web Anda.
7. Selesai! Vercel akan memberikan URL publik untuk aplikasi web Anda (contoh: `https://timeline-rapat.vercel.app`).

---

## Ringkasan Alur Kerja (Production)

Saat aplikasi Anda diakses secara publik, arsitekturnya bekerja seperti ini:

- Pengunjung/Klien membuka ➔ **Vercel Frontend** (`https://timeline-rapat.vercel.app`)
- **Vercel Frontend** meminta data ➔ **Vercel Serverless Backend** (`https://timeline-server.vercel.app`)
- **Vercel Backend** membaca/menyimpan ke ➔ **Supabase PostgreSQL**

**Catatan Khusus (CORS Error):**
Jika saat mencoba _login_ Anda mengalami _error CORS_, buka kembali kode `server.js` (backend) Anda. Pastikan nama domain _frontend_ produksi Anda diizinkan pada pengaturan CORS Express, seperti ini:

```javascript
app.use(
  cors({
    origin: ["http://localhost:5173", "https://timeline-rapat.vercel.app"],
  }),
);
```
