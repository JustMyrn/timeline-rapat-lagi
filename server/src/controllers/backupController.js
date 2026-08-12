const pool = require('../config/db');

// GET /api/backup
const getAll = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id_backup, nama_file, ukuran_kb, (created_at + INTERVAL '7 hours') AS created_at 
      FROM file_backup 
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Backup getAll error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};

// POST /api/backup
const createBackup = async (req, res) => {
  try {
    // Generate filename
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const filename = `Backup_TimelineRapat_${stamp}.json`;

    // Fetch all tables
    const [
      rapatRes,
      deptRes,
      userRes,
      pesertaRes,
      logRes,
      notifRes
    ] = await Promise.all([
      pool.query('SELECT * FROM rapat'),
      pool.query('SELECT * FROM departemen'),
      pool.query('SELECT * FROM "user"'),
      pool.query('SELECT * FROM peserta_rapat'),
      pool.query('SELECT * FROM log_akses'),
      pool.query('SELECT * FROM notifikasi')
    ]);

    const backupData = {
      meta: {
        generated_at: now.toISOString(),
        version: "1.0",
      },
      data: {
        rapat: rapatRes.rows,
        departemen: deptRes.rows,
        user: userRes.rows,
        peserta_rapat: pesertaRes.rows,
        log_akses: logRes.rows,
        notifikasi: notifRes.rows
      }
    };

    const isi_data = JSON.stringify(backupData);
    const ukuran_kb = Math.round(Buffer.byteLength(isi_data, 'utf8') / 1024);

    await pool.query(
      'INSERT INTO file_backup (nama_file, ukuran_kb, isi_data) VALUES ($1, $2, $3)',
      [filename, ukuran_kb, isi_data]
    );

    // Log action
    await pool.query(
      'INSERT INTO log_akses (id_user, aksi, detail, ip) VALUES ($1, $2, $3, $4)',
      [req.user.id_user, 'BACKUP_MANUAL', `File: ${filename}`, req.ip]
    );

    res.status(201).json({ message: `Backup berhasil dibuat: ${filename}` });
  } catch (err) {
    console.error('Backup create error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan saat membuat backup: ' + err.message });
  }
};

// GET /api/backup/download/:filename
const downloadBackup = async (req, res) => {
  try {
    const { filename } = req.params;
    const result = await pool.query('SELECT isi_data FROM file_backup WHERE nama_file = $1', [filename]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File backup tidak ditemukan.' });
    }

    const fileContent = result.rows[0].isi_data;

    res.setHeader('Content-disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-type', 'application/json');
    res.send(fileContent);
  } catch (err) {
    console.error('Backup download error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan saat mengunduh backup.' });
  }
};

// DELETE /api/backup/:filename
const remove = async (req, res) => {
  try {
    const { filename } = req.params;
    const result = await pool.query('DELETE FROM file_backup WHERE nama_file = $1 RETURNING id_backup', [filename]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'File backup tidak ditemukan.' });
    }

    // Log action
    await pool.query(
      'INSERT INTO log_akses (id_user, aksi, detail, ip) VALUES ($1, $2, $3, $4)',
      [req.user.id_user, 'HAPUS_BACKUP', `File: ${filename}`, req.ip]
    );

    res.json({ message: `Backup ${filename} berhasil dihapus.` });
  } catch (err) {
    console.error('Backup delete error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan saat menghapus backup.' });
  }
};

module.exports = { getAll, createBackup, downloadBackup, remove };
