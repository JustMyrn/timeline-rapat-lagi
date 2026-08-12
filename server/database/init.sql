-- ============================================================
-- Timeline Rapat — PostgreSQL Schema
-- ============================================================

-- 1. Departemen
CREATE TABLE IF NOT EXISTS departemen (
    id_departemen   SERIAL PRIMARY KEY,
    nama_departemen VARCHAR(100) NOT NULL,
    kode_departemen VARCHAR(20)  NOT NULL UNIQUE
);

-- 2. User
CREATE TABLE IF NOT EXISTS "user" (
    id_user        SERIAL PRIMARY KEY,
    nama           VARCHAR(100) NOT NULL,
    username       VARCHAR(50)  NOT NULL UNIQUE,
    password       VARCHAR(255) NOT NULL,
    role           VARCHAR(10)  NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
    id_departemen  INT REFERENCES departemen(id_departemen) ON DELETE SET NULL
);

-- 3. Rapat
CREATE TABLE IF NOT EXISTS rapat (
    id_rapat       SERIAL PRIMARY KEY,
    tanggal        DATE         NOT NULL,
    jam_mulai      TIME         NOT NULL,
    jam_selesai    TIME         NOT NULL,
    topik          VARCHAR(255) NOT NULL,
    jenis          VARCHAR(10)  NOT NULL CHECK (jenis IN ('Online', 'Offline')),
    id_meeting     VARCHAR(50),
    sandi          VARCHAR(100),
    link_rapat     VARCHAR(500),
    ruangan        VARCHAR(100),
    id_departemen  INT          NOT NULL REFERENCES departemen(id_departemen) ON DELETE RESTRICT,
    status_manual  VARCHAR(20)  NOT NULL DEFAULT 'terjadwal' CHECK (status_manual IN ('terjadwal', 'berlangsung', 'selesai', 'dibatalkan')),
    extra_menit    INT          NOT NULL DEFAULT 0,
    created_by     INT          REFERENCES "user"(id_user) ON DELETE SET NULL,
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- 4. Peserta Rapat (many-to-many rapat <-> departemen)
CREATE TABLE IF NOT EXISTS peserta_rapat (
    id_rapat       INT NOT NULL REFERENCES rapat(id_rapat) ON DELETE CASCADE,
    id_departemen  INT NOT NULL REFERENCES departemen(id_departemen) ON DELETE CASCADE,
    PRIMARY KEY (id_rapat, id_departemen)
);

-- 5. Log Akses
CREATE TABLE IF NOT EXISTS log_akses (
    id_log    SERIAL PRIMARY KEY,
    id_user   INT REFERENCES "user"(id_user) ON DELETE SET NULL,
    aksi      VARCHAR(50)  NOT NULL,
    detail    TEXT,
    ip        VARCHAR(45),
    waktu     TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- 6. Reset Password
CREATE TABLE IF NOT EXISTS reset_password (
    id_reset   SERIAL PRIMARY KEY,
    id_user    INT       NOT NULL REFERENCES "user"(id_user) ON DELETE CASCADE,
    status     VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rapat_tanggal ON rapat(tanggal);
CREATE INDEX IF NOT EXISTS idx_rapat_departemen ON rapat(id_departemen);
CREATE INDEX IF NOT EXISTS idx_log_waktu ON log_akses(waktu DESC);
CREATE INDEX IF NOT EXISTS idx_log_aksi ON log_akses(aksi);
