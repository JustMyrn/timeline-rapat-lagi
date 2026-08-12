-- ============================================================
-- SISTEM TIMELINE JADWAL RAPAT
-- Departemen ITE Kantor Wilayah PT. Bank Rakyat Indonesia
-- ============================================================
-- Skema disesuaikan dengan klien tetapi untuk PostgreSQL (Neon/Supabase)

-- Hapus tabel lama jika ada
DROP TABLE IF EXISTS log_akses CASCADE;
DROP TABLE IF EXISTS peserta_rapat CASCADE;
DROP TABLE IF EXISTS rapat CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;
DROP TABLE IF EXISTS departemen CASCADE;

-- 1. DEPARTEMEN
CREATE TABLE departemen (
  id_departemen SERIAL PRIMARY KEY,
  nama_departemen VARCHAR(100) NOT NULL,
  kode_departemen VARCHAR(20) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. USER
CREATE TABLE "user" (
  id_user SERIAL PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'staff',
  id_departemen INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_departemen) REFERENCES departemen(id_departemen) ON UPDATE CASCADE ON DELETE SET NULL
);

-- 3. RAPAT
CREATE TABLE rapat (
  id_rapat SERIAL PRIMARY KEY,
  tanggal DATE NOT NULL,
  jam_mulai TIME NOT NULL,
  jam_selesai TIME NOT NULL,
  topik VARCHAR(200) NOT NULL,
  jenis VARCHAR(20) NOT NULL DEFAULT 'Online',
  id_meeting VARCHAR(50) DEFAULT NULL,
  sandi VARCHAR(100) DEFAULT NULL,
  link_rapat TEXT,
  ruangan VARCHAR(100) DEFAULT NULL,
  id_departemen INT NOT NULL,
  extra_menit INT NOT NULL DEFAULT 0,
  status_manual VARCHAR(20) NOT NULL DEFAULT 'auto',
  created_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_departemen) REFERENCES departemen(id_departemen) ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES "user"(id_user) ON UPDATE CASCADE ON DELETE SET NULL
);

-- 4. PESERTA_RAPAT
CREATE TABLE peserta_rapat (
  id SERIAL PRIMARY KEY,
  id_rapat INT NOT NULL,
  id_departemen INT NOT NULL,
  UNIQUE (id_rapat, id_departemen),
  FOREIGN KEY (id_rapat) REFERENCES rapat(id_rapat) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (id_departemen) REFERENCES departemen(id_departemen) ON UPDATE CASCADE ON DELETE CASCADE
);

-- 5. LOG_AKSES
CREATE TABLE log_akses (
  id_log SERIAL PRIMARY KEY,
  id_user INT DEFAULT NULL,
  aksi VARCHAR(200) NOT NULL,
  detail TEXT DEFAULT NULL,
  ip VARCHAR(45) DEFAULT NULL,
  waktu TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_user) REFERENCES "user"(id_user) ON UPDATE CASCADE ON DELETE SET NULL
);

-- Index untuk performa query timeline
CREATE INDEX idx_rapat_tanggal ON rapat(tanggal);
CREATE INDEX idx_rapat_jam ON rapat(jam_mulai, jam_selesai);

-- Insert Akun Admin Default
INSERT INTO "user" (username, password, nama, role) 
VALUES ('admin', '$2b$10$rKn0kyDDzjLU9BIcqezTfOXoXLN5V0veY3CYajwgjtkB6a9FoRyXW', 'Administrator', 'admin');
-- Password default adalah: admin123

CREATE TABLE notifikasi (
    id_notifikasi SERIAL PRIMARY KEY,
    id_user INT NOT NULL REFERENCES "user"(id_user) ON UPDATE CASCADE ON DELETE CASCADE,
    judul VARCHAR(200) NOT NULL,
    pesan TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    link VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS file_backup (
    id_backup SERIAL PRIMARY KEY,
    nama_file VARCHAR(255) NOT NULL,
    ukuran_kb INT NOT NULL,
    isi_data TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reset_request (
  id_request SERIAL PRIMARY KEY,
  username_input VARCHAR(50) NOT NULL,
  id_user INT DEFAULT NULL REFERENCES "user"(id_user) ON DELETE SET NULL,
  ip VARCHAR(45) DEFAULT NULL,
  catatan TEXT DEFAULT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  resolved_at TIMESTAMP DEFAULT NULL,
  resolved_by INT DEFAULT NULL REFERENCES "user"(id_user) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);