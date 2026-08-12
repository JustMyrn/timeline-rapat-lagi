const pool = require('../config/db');

// Mendapatkan notifikasi untuk user (gabungan notif DB & pengingat dinamis)
const getNotifikasi = async (req, res) => {
  try {
    const userId = req.user.id_user;
    const userDeptId = req.user.id_departemen;

    // 1. Ambil notifikasi dari database
    const dbNotif = await pool.query(
      `SELECT * FROM notifikasi 
       WHERE id_user = $1 
       ORDER BY created_at DESC LIMIT 20`,
      [userId]
    );

    // 2. Ambil pengingat rapat terdekat secara dinamis (Hanya untuk rapat Hari Ini)
    // Filter rapat hari ini yang belum selesai
    const dynamicQuery = `
      SELECT r.*, d.nama_departemen AS penyelenggara
      FROM rapat r
      JOIN departemen d ON r.id_departemen = d.id_departemen
      LEFT JOIN peserta_rapat pr ON r.id_rapat = pr.id_rapat
      WHERE r.tanggal = CURRENT_DATE
        AND (r.jam_mulai > CURRENT_TIME OR (r.jam_selesai + (r.extra_menit) * interval '1 minute') >= CURRENT_TIME)
        AND (r.id_departemen = $1 OR pr.id_departemen = $1)
      GROUP BY r.id_rapat, d.nama_departemen
      ORDER BY r.jam_mulai ASC
    `;
    const upcomingRapat = await pool.query(dynamicQuery, [userDeptId]);

    // Map rapat menjadi bentuk notifikasi "Terdekat"
    const dynamicNotifs = upcomingRapat.rows.map(rapat => {
      let isHost = rapat.id_departemen === userDeptId;
      return {
        id_notifikasi: 'dyn-' + rapat.id_rapat, // ID unik statis untuk FE
        judul: 'Pengingat Rapat Hari Ini',
        pesan: `Rapat "${rapat.topik}" akan berlangsung pukul ${rapat.jam_mulai.substring(0, 5)}. ${isHost ? '(Anda Host)' : ''}`,
        is_read: false, // Selalu false agar menjadi pengingat di atas
        link: '/cari-rapat', // Atau link ke detail jika ada rutenya
        created_at: new Date().toISOString(),
        is_dynamic: true // Flag khusus
      };
    });

    // Gabungkan array: dynamic di atas, lalu dbNotif
    const allNotifs = [...dynamicNotifs, ...dbNotif.rows];

    res.json(allNotifs);
  } catch (err) {
    console.error('Error fetching notifikasi:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const notifId = req.params.id;
    // Abaikan jika ini notifikasi dinamis
    if (notifId && notifId.toString().startsWith('dyn-')) {
      return res.json({ message: 'Dynamic notif ignored' });
    }

    await pool.query(
      'UPDATE notifikasi SET is_read = true WHERE id_notifikasi = $1 AND id_user = $2',
      [notifId, req.user.id_user]
    );
    res.json({ message: 'Marked as read' });
  } catch (err) {
    console.error('Error markAsRead:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifikasi SET is_read = true WHERE id_user = $1 AND is_read = false',
      [req.user.id_user]
    );
    res.json({ message: 'All marked as read' });
  } catch (err) {
    console.error('Error markAllAsRead:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = { getNotifikasi, markAsRead, markAllAsRead };
