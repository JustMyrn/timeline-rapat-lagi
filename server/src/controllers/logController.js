const pool = require('../config/db');

// GET /api/log — with filters and pagination
const getAll = async (req, res) => {
  try {
    const { tanggal, aksi, cari, halaman = 1 } = req.query;
    const perHalaman = 25;
    const offset = (Math.max(1, parseInt(halaman)) - 1) * perHalaman;

    let where = [];
    let params = [];
    let idx = 1;

    if (tanggal) {
      where.push(`DATE(l.waktu) = $${idx++}`);
      params.push(tanggal);
    }
    if (aksi) {
      where.push(`l.aksi = $${idx++}`);
      params.push(aksi);
    }
    if (cari) {
      const like = `%${cari}%`;
      where.push(`(l.detail ILIKE $${idx} OR u.username ILIKE $${idx + 1} OR u.nama ILIKE $${idx + 2})`);
      params.push(like, like, like);
      idx += 3;
    }

    const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

    // Count total
    const countResult = await pool.query(`
      SELECT COUNT(*) FROM log_akses l
      LEFT JOIN "user" u ON l.id_user = u.id_user
      ${whereSql}
    `, params);
    const totalData = parseInt(countResult.rows[0].count);
    const totalHalaman = Math.max(1, Math.ceil(totalData / perHalaman));

    // Fetch data
    const result = await pool.query(`
      SELECT l.*, 
             TO_CHAR(l.waktu, 'YYYY-MM-DD"T"HH24:MI:SS"+07:00"') AS waktu_iso,
             u.nama AS nama_user, u.username
      FROM log_akses l
      LEFT JOIN "user" u ON l.id_user = u.id_user
      ${whereSql}
      ORDER BY l.waktu DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `, [...params, perHalaman, offset]);

    // Get distinct actions for filter dropdown
    const aksiList = await pool.query('SELECT DISTINCT aksi FROM log_akses ORDER BY aksi');

    res.json({
      data: result.rows,
      pagination: {
        halaman: parseInt(halaman),
        perHalaman,
        totalData,
        totalHalaman
      },
      daftarAksi: aksiList.rows.map(r => r.aksi)
    });
  } catch (err) {
    console.error('Log getAll error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};

module.exports = { getAll };
