const bcrypt = require('bcryptjs');
const pool = require('../config/db');

// GET /api/user
const getAll = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id_user, u.nama, u.username, u.role, u.id_departemen,
             d.nama_departemen
      FROM "user" u
      LEFT JOIN departemen d ON u.id_departemen = d.id_departemen
      ORDER BY u.nama
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('User getAll error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};

// POST /api/user
const create = async (req, res) => {
  try {
    const { nama, username, password, role, id_departemen } = req.body;

    const errors = [];
    if (!nama) errors.push('Nama wajib diisi.');
    if (!username) errors.push('Username wajib diisi.');
    if (!password) errors.push('Password wajib diisi untuk user baru.');
    if (password && password.length < 6) errors.push('Password minimal 6 karakter.');
    if (!['admin', 'staff'].includes(role)) errors.push('Role tidak valid.');
    if (errors.length) return res.status(400).json({ errors });

    // Check duplicate username
    const existing = await pool.query('SELECT id_user FROM "user" WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Username sudah dipakai.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO "user" (nama, username, password, role, id_departemen) VALUES ($1, $2, $3, $4, $5) RETURNING id_user, nama, username, role',
      [nama.trim(), username.trim(), hash, role, id_departemen || null]
    );

    // Log
    await pool.query(
      'INSERT INTO log_akses (id_user, aksi, detail, ip) VALUES ($1, $2, $3, $4)',
      [req.user.id_user, 'TAMBAH_USER', username, req.ip]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('User create error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};

// PUT /api/user/:id
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, username, password, role, id_departemen } = req.body;

    const errors = [];
    if (!nama) errors.push('Nama wajib diisi.');
    if (!username) errors.push('Username wajib diisi.');
    if (password && password.length < 6) errors.push('Password minimal 6 karakter.');
    if (!['admin', 'staff'].includes(role)) errors.push('Role tidak valid.');
    if (errors.length) return res.status(400).json({ errors });

    // Check duplicate username (exclude self)
    const existing = await pool.query('SELECT id_user FROM "user" WHERE username = $1 AND id_user != $2', [username, id]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Username sudah dipakai oleh user lain.' });
    }

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await pool.query(
        'UPDATE "user" SET nama = $1, username = $2, password = $3, role = $4, id_departemen = $5 WHERE id_user = $6',
        [nama.trim(), username.trim(), hash, role, id_departemen || null, id]
      );
    } else {
      await pool.query(
        'UPDATE "user" SET nama = $1, username = $2, role = $3, id_departemen = $4 WHERE id_user = $5',
        [nama.trim(), username.trim(), role, id_departemen || null, id]
      );
    }

    // Log
    await pool.query(
      'INSERT INTO log_akses (id_user, aksi, detail, ip) VALUES ($1, $2, $3, $4)',
      [req.user.id_user, 'EDIT_USER', username, req.ip]
    );

    res.json({ message: 'User berhasil diperbarui.' });
  } catch (err) {
    console.error('User update error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};

// DELETE /api/user/:id
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    // Cannot delete self
    if (parseInt(id) === req.user.id_user) {
      return res.status(400).json({ error: 'Kamu tidak bisa menghapus akun kamu sendiri.' });
    }

    // Cannot delete last admin
    const target = await pool.query('SELECT role FROM "user" WHERE id_user = $1', [id]);
    if (target.rows.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan.' });
    }

    if (target.rows[0].role === 'admin') {
      const totalAdmin = await pool.query("SELECT COUNT(*) FROM \"user\" WHERE role = 'admin'");
      if (parseInt(totalAdmin.rows[0].count) <= 1) {
        return res.status(400).json({ error: 'Tidak bisa menghapus satu-satunya akun admin.' });
      }
    }

    await pool.query('DELETE FROM "user" WHERE id_user = $1', [id]);

    // Log
    await pool.query(
      'INSERT INTO log_akses (id_user, aksi, detail, ip) VALUES ($1, $2, $3, $4)',
      [req.user.id_user, 'HAPUS_USER', `ID: ${id}`, req.ip]
    );

    res.json({ message: 'User berhasil dihapus.' });
  } catch (err) {
    console.error('User delete error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};

module.exports = { getAll, create, update, remove };
