-- ============================================================
-- Timeline Rapat — Seed Data
-- Password: admin123 (bcrypt hash)
-- ============================================================

-- Departemen
INSERT INTO departemen (nama_departemen, kode_departemen) VALUES
  ('Teknologi Informasi & Elektronika', 'ITE'),
  ('Sumber Daya Manusia', 'SDM'),
  ('Keuangan & Perencanaan', 'KEU'),
  ('Operasional & Layanan', 'OPR'),
  ('Pemasaran & Komunikasi', 'MKT')
ON CONFLICT (kode_departemen) DO NOTHING;

-- Admin user  (password: admin123)
INSERT INTO "user" (nama, username, password, role, id_departemen) VALUES
  ('Administrator', 'admin', '$2b$10$q4GcNAc5N2lkZQkTy6WFJ.5LTbemrp04CicdGbtz0z.85YUu5GsoS', 'admin', NULL)
ON CONFLICT (username) DO NOTHING;

-- Rapat contoh (hari ini & besok)
INSERT INTO rapat (tanggal, jam_mulai, jam_selesai, topik, jenis, ruangan, id_departemen, status_manual, created_by) VALUES
  (CURRENT_DATE, '08:00', '08:45', 'Morning Briefing Operasional', 'Offline', 'Ruang Rapat Utama', 4, 'selesai', 1),
  (CURRENT_DATE, '09:00', '11:00', 'Rapat Koordinasi Evaluasi KPI Q3', 'Offline', 'Ruang Rapat Utama', 3, 'berlangsung', 1),
  (CURRENT_DATE, '13:00', '15:00', 'Perencanaan Migrasi Server', 'Online', NULL, 1, 'terjadwal', 1),
  (CURRENT_DATE, '15:30', '16:30', 'Review Anggaran Bulanan', 'Offline', 'Ruang Rapat Lt. 2', 3, 'terjadwal', 1),
  (CURRENT_DATE + 1, '08:00', '09:00', 'Standup Meeting Tim ITE', 'Online', NULL, 1, 'terjadwal', 1),
  (CURRENT_DATE + 1, '10:00', '12:00', 'Workshop Pengembangan SDM', 'Offline', 'Aula Utama', 2, 'terjadwal', 1),
  (CURRENT_DATE + 1, '14:00', '15:30', 'Evaluasi Kampanye Digital Q3', 'Online', NULL, 5, 'terjadwal', 1);

-- Update rapat online dengan meeting info
UPDATE rapat SET id_meeting = '852 1304 7190', sandi = 'Rapat2026', link_rapat = 'https://zoom.us/j/85213047190' WHERE topik = 'Perencanaan Migrasi Server';
UPDATE rapat SET id_meeting = '741 9283 0561', sandi = 'ITE2026', link_rapat = 'https://zoom.us/j/74192830561' WHERE topik = 'Standup Meeting Tim ITE';
UPDATE rapat SET id_meeting = '963 8521 4073', sandi = 'Digital2026', link_rapat = 'https://zoom.us/j/96385214073' WHERE topik = 'Evaluasi Kampanye Digital Q3';

-- Peserta rapat (departemen yang diundang)
INSERT INTO peserta_rapat (id_rapat, id_departemen) VALUES
  (1, 1), (1, 2), (1, 3), (1, 4), (1, 5),
  (2, 3), (2, 1),
  (3, 1), (3, 4),
  (4, 3), (4, 1), (4, 5),
  (5, 1),
  (6, 2), (6, 1), (6, 4),
  (7, 5), (7, 1);

-- Log awal
INSERT INTO log_akses (id_user, aksi, detail, ip) VALUES
  (1, 'LOGIN', 'Login berhasil', '127.0.0.1');
