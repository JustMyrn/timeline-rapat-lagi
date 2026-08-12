const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password wajib diisi.' });
    }

    const result = await pool.query(
      'SELECT u.*, d.nama_departemen FROM "user" u LEFT JOIN departemen d ON u.id_departemen = d.id_departemen WHERE u.username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Username atau password salah.' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Username atau password salah.' });
    }

    const token = jwt.sign(
      { id_user: user.id_user, username: user.username, role: user.role, nama: user.nama },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log login
    await pool.query(
      'INSERT INTO log_akses (id_user, aksi, detail, ip) VALUES ($1, $2, $3, $4)',
      [user.id_user, 'LOGIN', 'Login berhasil', req.ip]
    );

    res.json({
      token,
      user: {
        id_user: user.id_user,
        nama: user.nama,
        username: user.username,
        role: user.role,
        departemen: user.nama_departemen || null
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};

const me = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT u.id_user, u.nama, u.username, u.role, d.nama_departemen FROM "user" u LEFT JOIN departemen d ON u.id_departemen = d.id_departemen WHERE u.id_user = $1',
      [req.user.id_user]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};

const resetRequest = async (req, res) => {
  try {
    const { username, catatan } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username wajib diisi.' });
    }

    const result = await pool.query('SELECT id_user FROM "user" WHERE username = $1', [username]);
    
    // Perlambat respons (400ms) untuk mencegah username enumeration
    await new Promise(r => setTimeout(r, 400));

    if (result.rows.length > 0) {
      const user = result.rows[0];
      
      const cek = await pool.query(
        "SELECT id_request FROM reset_request WHERE id_user = $1 AND status = 'pending'",
        [user.id_user]
      );
      
      if (cek.rows.length === 0) {
        await pool.query(
          "INSERT INTO reset_request (username_input, id_user, catatan, ip) VALUES ($1, $2, $3, $4)",
          [username, user.id_user, catatan || null, req.ip]
        );
      }
    }

    // Pesan selalu sama
    res.json({ message: 'Jika username tersebut terdaftar, permintaan reset password sudah dikirim ke admin. Silakan hubungi admin sistem untuk konfirmasi lebih lanjut.' });
  } catch (err) {
    console.error('Reset request error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server saat memproses permintaan.' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { password_lama, password_baru, konfirmasi } = req.body;
    const id_user = req.user.id_user;

    const result = await pool.query('SELECT password FROM "user" WHERE id_user = $1', [id_user]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan.' });
    }
    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password_lama, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Password lama tidak sesuai.' });
    }
    if (password_baru.length < 6) {
      return res.status(400).json({ error: 'Password baru minimal 6 karakter.' });
    }
    if (password_baru !== konfirmasi) {
      return res.status(400).json({ error: 'Konfirmasi password baru tidak cocok.' });
    }
    const isSameAsOld = await bcrypt.compare(password_baru, user.password);
    if (isSameAsOld) {
      return res.status(400).json({ error: 'Password baru tidak boleh sama dengan password lama.' });
    }

    const hash = await bcrypt.hash(password_baru, 10);
    await pool.query('UPDATE "user" SET password = $1 WHERE id_user = $2', [hash, id_user]);

    await pool.query(
      'INSERT INTO log_akses (id_user, aksi, detail, ip) VALUES ($1, $2, $3, $4)',
      [id_user, 'GANTI_PASSWORD', 'User mengganti password akun sendiri', req.ip]
    );

    res.json({ message: 'Password berhasil diganti. Gunakan password baru untuk login berikutnya.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};

module.exports = { login, me, resetRequest, changePassword };
