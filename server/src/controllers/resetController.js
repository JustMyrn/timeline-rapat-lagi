const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const getAllPending = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT rr.*, u.nama AS nama_user
      FROM reset_request rr
      LEFT JOIN "user" u ON rr.id_user = u.id_user
      WHERE rr.status = 'pending'
      ORDER BY rr.created_at ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error getAllPending:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};

const getHistory = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT rr.*, u.nama AS nama_user, a.nama AS nama_admin
      FROM reset_request rr
      LEFT JOIN "user" u ON rr.id_user = u.id_user
      LEFT JOIN "user" a ON rr.resolved_by = a.id_user
      WHERE rr.status = 'selesai'
      ORDER BY rr.resolved_at DESC
      LIMIT 20
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error getHistory:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};

const approve = async (req, res) => {
  try {
    const { id_request, id_user } = req.body;
    
    if (!id_request || !id_user) {
      return res.status(400).json({ error: 'Data tidak lengkap.' });
    }

    const reqCheck = await pool.query('SELECT * FROM reset_request WHERE id_request = $1', [id_request]);
    if (reqCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Permintaan tidak ditemukan.' });
    }

    const userCheck = await pool.query('SELECT nama, username FROM "user" WHERE id_user = $1', [id_user]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Akun tujuan sudah tidak ada.' });
    }

    const targetUser = userCheck.rows[0];

    // Generate random password
    const charset = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let tempPass = '';
    for (let i = 0; i < 10; i++) {
      tempPass += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    const hash = await bcrypt.hash(tempPass, 10);

    // Update password
    await pool.query('UPDATE "user" SET password = $1 WHERE id_user = $2', [hash, id_user]);
    
    // Update request status
    await pool.query(
      'UPDATE reset_request SET status=$1, resolved_at=NOW(), resolved_by=$2 WHERE id_request=$3',
      ['selesai', req.user.id_user, id_request]
    );

    // Log action
    await pool.query(
      'INSERT INTO log_akses (id_user, aksi, detail, ip) VALUES ($1, $2, $3, $4)',
      [
        req.user.id_user, 
        'RESET_PASSWORD', 
        `Password user "${targetUser.username}" direset via permintaan (ID ${id_request})`, 
        req.ip
      ]
    );

    res.json({
      message: 'Password berhasil direset',
      newPassInfo: {
        nama: targetUser.nama,
        username: targetUser.username,
        password: tempPass
      }
    });
  } catch (err) {
    console.error('Error approve reset:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server saat reset.' });
  }
};

const ignore = async (req, res) => {
  try {
    const { id_request } = req.body;
    
    if (!id_request) {
      return res.status(400).json({ error: 'Data tidak lengkap.' });
    }

    await pool.query(
      'UPDATE reset_request SET status=$1, resolved_at=NOW(), resolved_by=$2 WHERE id_request=$3',
      ['selesai', req.user.id_user, id_request]
    );

    res.json({ message: 'Permintaan ditandai selesai.' });
  } catch (err) {
    console.error('Error ignore reset:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server saat mengabaikan.' });
  }
};

module.exports = { getAllPending, getHistory, approve, ignore };
