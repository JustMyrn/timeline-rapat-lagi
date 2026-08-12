const pool = require('../config/db');

// GET /api/departemen — with total rapat count
const getAll = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*, COUNT(r.id_rapat)::int AS total_rapat
      FROM departemen d
      LEFT JOIN rapat r ON d.id_departemen = r.id_departemen
      GROUP BY d.id_departemen
      ORDER BY d.nama_departemen
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Departemen getAll error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};

// POST /api/departemen
const create = async (req, res) => {
  try {
    const { nama_departemen, kode_departemen } = req.body;
    const kode = (kode_departemen || '').toUpperCase().trim();

    if (!nama_departemen || !kode) {
      return res.status(400).json({ error: 'Nama dan kode departemen wajib diisi.' });
    }

    // Check duplicate kode
    const existing = await pool.query('SELECT id_departemen FROM departemen WHERE kode_departemen = $1', [kode]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Kode departemen sudah dipakai.' });
    }

    const result = await pool.query(
      'INSERT INTO departemen (nama_departemen, kode_departemen) VALUES ($1, $2) RETURNING *',
      [nama_departemen.trim(), kode]
    );

    // Log
    await pool.query(
      'INSERT INTO log_akses (id_user, aksi, detail, ip) VALUES ($1, $2, $3, $4)',
      [req.user.id_user, 'TAMBAH_DEPARTEMEN', `${kode}: ${nama_departemen}`, req.ip]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Departemen create error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};

// PUT /api/departemen/:id
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_departemen, kode_departemen } = req.body;
    const kode = (kode_departemen || '').toUpperCase().trim();

    if (!nama_departemen || !kode) {
      return res.status(400).json({ error: 'Nama dan kode departemen wajib diisi.' });
    }

    // Check duplicate kode (exclude self)
    const existing = await pool.query('SELECT id_departemen FROM departemen WHERE kode_departemen = $1 AND id_departemen != $2', [kode, id]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Kode departemen sudah dipakai oleh departemen lain.' });
    }

    await pool.query(
      'UPDATE departemen SET nama_departemen = $1, kode_departemen = $2 WHERE id_departemen = $3',
      [nama_departemen.trim(), kode, id]
    );

    // Log
    await pool.query(
      'INSERT INTO log_akses (id_user, aksi, detail, ip) VALUES ($1, $2, $3, $4)',
      [req.user.id_user, 'EDIT_DEPARTEMEN', `${kode}: ${nama_departemen}`, req.ip]
    );

    res.json({ message: 'Departemen berhasil diperbarui.' });
  } catch (err) {
    console.error('Departemen update error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};

// DELETE /api/departemen/:id
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if used by rapat
    const used = await pool.query('SELECT COUNT(*) FROM rapat WHERE id_departemen = $1', [id]);
    if (parseInt(used.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Departemen tidak bisa dihapus karena masih digunakan di data rapat.' });
    }

    // Clean up peserta_rapat references
    await pool.query('DELETE FROM peserta_rapat WHERE id_departemen = $1', [id]);
    await pool.query('DELETE FROM departemen WHERE id_departemen = $1', [id]);

    // Log
    await pool.query(
      'INSERT INTO log_akses (id_user, aksi, detail, ip) VALUES ($1, $2, $3, $4)',
      [req.user.id_user, 'HAPUS_DEPARTEMEN', `ID: ${id}`, req.ip]
    );

    res.json({ message: 'Departemen berhasil dihapus.' });
  } catch (err) {
    console.error('Departemen delete error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};

module.exports = { getAll, create, update, remove };
