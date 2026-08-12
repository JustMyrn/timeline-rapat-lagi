const pool = require('../config/db');

const getStats = async (req, res) => {
  try {
    // Force UTC+7 (WIB) untuk Vercel
    const today = new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().split('T')[0];
    const bufferMenit = parseInt(process.env.BUFFER_TOLERANSI_MENIT) || 5;

    const { month } = req.query; 
    let targetYear, targetMonth;
    if (month) {
      [targetYear, targetMonth] = month.split('-');
    } else {
      const d = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
      targetYear = d.getFullYear();
      targetMonth = d.getMonth() + 1;
    }

    // Total rapat hari ini
    const q1 = await pool.query('SELECT COUNT(*) FROM rapat WHERE tanggal = $1', [today]);

    // Sedang berlangsung
    const q2 = await pool.query(`
      SELECT COUNT(*) FROM rapat
      WHERE tanggal = $1
        AND (status_manual IS NULL OR status_manual NOT IN ('selesai', 'dibatalkan'))
        AND (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::time BETWEEN jam_mulai AND (jam_selesai + (extra_menit + $2) * interval '1 minute')
    `, [today, bufferMenit]);

    // Akan datang
    const q3 = await pool.query(`
      SELECT COUNT(*) FROM rapat
      WHERE tanggal = $1 AND jam_mulai > (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::time AND (status_manual IS NULL OR status_manual NOT IN ('selesai', 'dibatalkan'))
    `, [today]);

    // Total bulan ini / terpilih
    const q4 = await pool.query(`
      SELECT COUNT(*) FROM rapat
      WHERE EXTRACT(MONTH FROM tanggal) = $1
        AND EXTRACT(YEAR FROM tanggal) = $2
    `, [targetMonth, targetYear]);

    // Total selesai bulan ini / terpilih
    const q5 = await pool.query(`
      SELECT COUNT(*) FROM rapat
      WHERE EXTRACT(MONTH FROM tanggal) = $1 AND EXTRACT(YEAR FROM tanggal) = $2
        AND (status_manual = 'selesai' OR (tanggal < (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::date))
    `, [targetMonth, targetYear]);

    // Total dibatalkan bulan ini / terpilih
    const q6 = await pool.query(`
      SELECT COUNT(*) FROM rapat
      WHERE EXTRACT(MONTH FROM tanggal) = $1 AND EXTRACT(YEAR FROM tanggal) = $2
        AND status_manual = 'dibatalkan'
    `, [targetMonth, targetYear]);

    res.json({
      total_hari_ini: parseInt(q1.rows[0].count),
      berlangsung: parseInt(q2.rows[0].count),
      akan_datang: parseInt(q3.rows[0].count),
      total_bulan_ini: parseInt(q4.rows[0].count),
      total_selesai: parseInt(q5.rows[0].count),
      total_dibatalkan: parseInt(q6.rows[0].count)
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};

const getUpcoming = async (req, res) => {
  try {
    const bufferMenit = parseInt(process.env.BUFFER_TOLERANSI_MENIT) || 5;
    const result = await pool.query(`
      SELECT r.id_rapat, r.topik, r.tanggal, r.jam_mulai, r.jam_selesai, r.jenis,
             d.nama_departemen AS penyelenggara,
             CASE
               WHEN r.status_manual IN ('selesai', 'dibatalkan') THEN r.status_manual
               WHEN r.tanggal < (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::date THEN 'selesai'
               WHEN r.tanggal > (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::date THEN 'akan_datang'
               WHEN r.tanggal = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::date THEN
                 CASE 
                   WHEN (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::time BETWEEN r.jam_mulai AND (r.jam_selesai + (r.extra_menit + $1) * interval '1 minute') THEN 'berlangsung'
                   WHEN r.jam_mulai > (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::time THEN 'akan_datang'
                   ELSE 'selesai'
                 END
             END AS status_computed
      FROM rapat r
      JOIN departemen d ON r.id_departemen = d.id_departemen
      WHERE r.tanggal = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::date
      ORDER BY r.jam_mulai ASC
    `, [bufferMenit]);

    res.json(result.rows);
  } catch (err) {
    console.error('Dashboard upcoming error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};

const getDepartmentStats = async (req, res) => {
  try {
    const { month } = req.query; 
    let targetYear, targetMonth;
    if (month) {
      [targetYear, targetMonth] = month.split('-');
    } else {
      const d = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
      targetYear = d.getFullYear();
      targetMonth = d.getMonth() + 1;
    }

    const result = await pool.query(`
      SELECT d.nama_departemen, d.kode_departemen, COUNT(r.id_rapat) AS jumlah
      FROM departemen d
      LEFT JOIN rapat r ON d.id_departemen = r.id_departemen
        AND EXTRACT(MONTH FROM r.tanggal) = $1
        AND EXTRACT(YEAR FROM r.tanggal) = $2
      GROUP BY d.id_departemen, d.nama_departemen, d.kode_departemen
      ORDER BY jumlah DESC, d.nama_departemen ASC
    `, [targetMonth, targetYear]);

    res.json(result.rows.map(row => ({
      nama: row.nama_departemen,
      kode: row.kode_departemen,
      jumlah: parseInt(row.jumlah)
    })));
  } catch (err) {
    console.error('Dashboard department stats error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};

module.exports = { getStats, getUpcoming, getDepartmentStats };
