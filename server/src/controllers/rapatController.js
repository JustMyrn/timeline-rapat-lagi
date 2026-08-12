const pool = require('../config/db');

// GET /api/rapat — list with optional filters
const getAll = async (req, res) => {
  try {
    const { tanggal, id_departemen, cari } = req.query;
    let where = [];
    let params = [];
    let idx = 1;

    if (tanggal) {
      where.push(`r.tanggal = $${idx++}`);
      params.push(tanggal);
    }
    if (id_departemen) {
      where.push(`r.id_departemen = $${idx++}`);
      params.push(parseInt(id_departemen));
    }
    if (cari) {
      where.push(`r.topik ILIKE $${idx++}`);
      params.push(`%${cari}%`);
    }

    const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const bufferMenit = parseInt(process.env.BUFFER_TOLERANSI_MENIT) || 5;

    const result = await pool.query(`
      SELECT r.*, d.nama_departemen AS penyelenggara,
             u.nama AS created_by_nama,
             CASE
               WHEN r.status_manual IN ('selesai', 'dibatalkan') THEN r.status_manual
               WHEN r.tanggal < (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::date THEN 'selesai'
               WHEN r.tanggal > (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::date THEN 'akan_datang'
               WHEN r.tanggal = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::date THEN
                 CASE 
                   WHEN (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::time BETWEEN r.jam_mulai AND (r.jam_selesai + (r.extra_menit + $${idx}) * interval '1 minute') THEN 'berlangsung'
                   WHEN r.jam_mulai > (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::time THEN 'akan_datang'
                   ELSE 'selesai'
                 END
             END AS status_computed
      FROM rapat r
      JOIN departemen d ON r.id_departemen = d.id_departemen
      LEFT JOIN "user" u ON r.created_by = u.id_user
      ${whereSql}
      ORDER BY r.tanggal DESC, r.jam_mulai ASC
    `, [...params, bufferMenit]);

    res.json(result.rows);
  } catch (err) {
    console.error('Rapat getAll error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};

// GET /api/rapat/tv — for TV display (today only)
const getTv = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const bufferMenit = parseInt(process.env.BUFFER_TOLERANSI_MENIT) || 5;

    const result = await pool.query(`
      SELECT r.id_rapat, r.topik, r.jam_mulai, r.jam_selesai, r.jenis, r.ruangan,
             r.id_meeting, r.link_rapat, r.status_manual, r.extra_menit, r.sandi,
             d.nama_departemen AS penyelenggara,
             ARRAY(
               SELECT d2.nama_departemen 
               FROM peserta_rapat pr 
               JOIN departemen d2 ON pr.id_departemen = d2.id_departemen 
               WHERE pr.id_rapat = r.id_rapat
             ) AS peserta_departemen,
             CASE
               WHEN r.status_manual IN ('selesai', 'dibatalkan') THEN r.status_manual
               WHEN (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::time BETWEEN r.jam_mulai AND (r.jam_selesai + (r.extra_menit + $2) * interval '1 minute') THEN 'berlangsung'
               WHEN r.jam_mulai > (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::time THEN 'akan_datang'
               ELSE 'selesai'
             END AS status_computed
      FROM rapat r
      JOIN departemen d ON r.id_departemen = d.id_departemen
      WHERE r.tanggal = $1
      ORDER BY r.jam_mulai ASC
    `, [today, bufferMenit]);

    res.json(result.rows);
  } catch (err) {
    console.error('Rapat TV error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};

// GET /api/rapat/:id — detail with peserta
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const bufferMenit = parseInt(process.env.BUFFER_TOLERANSI_MENIT) || 5;
    
    const rapat = await pool.query(`
      SELECT r.*, d.nama_departemen AS penyelenggara, d.kode_departemen,
             u.nama AS created_by_nama,
             CASE
               WHEN r.status_manual IN ('selesai', 'dibatalkan') THEN r.status_manual
               WHEN r.tanggal < (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::date THEN 'selesai'
               WHEN r.tanggal > (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::date THEN 'akan_datang'
               WHEN r.tanggal = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::date THEN
                 CASE 
                   WHEN (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::time BETWEEN r.jam_mulai AND (r.jam_selesai + (r.extra_menit + $2) * interval '1 minute') THEN 'berlangsung'
                   WHEN r.jam_mulai > (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::time THEN 'akan_datang'
                   ELSE 'selesai'
                 END
             END AS status_computed
      FROM rapat r
      JOIN departemen d ON r.id_departemen = d.id_departemen
      LEFT JOIN "user" u ON r.created_by = u.id_user
      WHERE r.id_rapat = $1
    `, [id, bufferMenit]);

    if (rapat.rows.length === 0) {
      return res.status(404).json({ error: 'Rapat tidak ditemukan.' });
    }

    // Get peserta
    const peserta = await pool.query(`
      SELECT p.id_departemen, d.nama_departemen, d.kode_departemen
      FROM peserta_rapat p
      JOIN departemen d ON p.id_departemen = d.id_departemen
      WHERE p.id_rapat = $1
      ORDER BY d.nama_departemen
    `, [id]);

    res.json({
      ...rapat.rows[0],
      departemen_peserta: peserta.rows
    });
  } catch (err) {
    console.error('Rapat getById error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};

// POST /api/rapat
const create = async (req, res) => {
  const client = await pool.connect();
  try {
    const { tanggal, jam_mulai, jam_selesai, topik, jenis, id_meeting, sandi, link_rapat, ruangan, id_departemen, peserta } = req.body;

    // Validation
    const errors = [];
    if (!tanggal) errors.push('Tanggal wajib diisi.');
    if (!jam_mulai) errors.push('Jam mulai wajib diisi.');
    if (!jam_selesai) errors.push('Jam selesai wajib diisi.');
    if (!topik) errors.push('Topik rapat wajib diisi.');
    if (!jenis) errors.push('Jenis rapat wajib dipilih.');
    if (!id_departemen) errors.push('Penyelenggara wajib dipilih.');
    if (jam_mulai && jam_selesai && jam_selesai <= jam_mulai) errors.push('Jam selesai harus lebih dari jam mulai.');

    if (errors.length) return res.status(400).json({ errors });

    await client.query('BEGIN');

    const result = await client.query(`
      INSERT INTO rapat (tanggal, jam_mulai, jam_selesai, topik, jenis, id_meeting, sandi, link_rapat, ruangan, id_departemen, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id_rapat
    `, [
      tanggal, jam_mulai, jam_selesai, topik, jenis,
      jenis === 'Online' ? id_meeting : null,
      jenis === 'Online' ? sandi : null,
      jenis === 'Online' ? link_rapat : null,
      jenis === 'Offline' ? ruangan : null,
      id_departemen,
      req.user.id_user
    ]);

    const id_rapat = result.rows[0].id_rapat;

    // Insert peserta
    if (peserta && peserta.length > 0) {
      for (const pid of peserta) {
        await client.query(
          'INSERT INTO peserta_rapat (id_rapat, id_departemen) VALUES ($1, $2) ON CONFLICT (id_rapat, id_departemen) DO NOTHING',
          [id_rapat, parseInt(pid)]
        );
      }

      // Notifikasi ke user di departemen peserta
      const usersRes = await client.query('SELECT id_user FROM "user" WHERE id_departemen = ANY($1::int[])', [peserta]);
      for (const row of usersRes.rows) {
        await client.query(
          'INSERT INTO notifikasi (id_user, judul, pesan, link) VALUES ($1, $2, $3, $4)',
          [row.id_user, 'Undangan Rapat Baru', `Departemen Anda diundang ke Rapat "${topik}" pada ${tanggal}.`, '/cari-rapat']
        );
      }
    }

    // Log
    await client.query(
      'INSERT INTO log_akses (id_user, aksi, detail, ip) VALUES ($1, $2, $3, $4)',
      [req.user.id_user, 'TAMBAH_RAPAT', `${topik} — ${tanggal}`, req.ip]
    );

    await client.query('COMMIT');
    res.status(201).json({ message: 'Jadwal rapat berhasil ditambahkan.', id_rapat });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Rapat create error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  } finally {
    client.release();
  }
};

// POST /api/rapat/bulk
const createBulk = async (req, res) => {
  const client = await pool.connect();
  try {
    const { meetings } = req.body;
    if (!meetings || !Array.isArray(meetings) || meetings.length === 0) {
      return res.status(400).json({ error: 'Data rapat tidak valid atau kosong.' });
    }

    await client.query('BEGIN');
    
    // Check duplicates efficiently in memory by fetching existing
    const tanggals = [...new Set(meetings.filter(m => m.tanggal).map(m => m.tanggal))];
    let existingSet = new Set();
    
    if (tanggals.length > 0) {
      const existingRes = await client.query(`
        SELECT tanggal, jam_mulai, topik, id_departemen 
        FROM rapat 
        WHERE tanggal = ANY($1::date[])
      `, [tanggals]);
      
      existingRes.rows.forEach(r => {
        const dateObj = new Date(r.tanggal);
        const dateStr = dateObj.getFullYear() + '-' + String(dateObj.getMonth() + 1).padStart(2, '0') + '-' + String(dateObj.getDate()).padStart(2, '0');
        const jamStr = r.jam_mulai.substring(0,5);
        existingSet.add(`${dateStr}_${jamStr}_${r.topik}_${r.id_departemen}`);
      });
    }

    let importedCount = 0;
    let skippedCount = 0;
    
    const validMeetings = [];
    for (const data of meetings) {
      const { tanggal, jam_mulai, jam_selesai, topik, jenis, id_departemen } = data;
      if (!tanggal || !jam_mulai || !jam_selesai || !topik || !jenis || !id_departemen) continue;
      
      const key = `${tanggal}_${jam_mulai.substring(0,5)}_${topik}_${id_departemen}`;
      if (existingSet.has(key)) {
        skippedCount++;
      } else {
        validMeetings.push(data);
        existingSet.add(key); // prevent duplicates within the imported list
      }
    }

    // Chunk size 100 for batch inserting
    const chunkSize = 100;
    for (let i = 0; i < validMeetings.length; i += chunkSize) {
      const chunk = validMeetings.slice(i, i + chunkSize);
      
      const values = [];
      const queryParams = [];
      let pIdx = 1;
      
      chunk.forEach(m => {
        values.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++})`);
        queryParams.push(
          m.tanggal, m.jam_mulai, m.jam_selesai, m.topik, m.jenis,
          m.jenis === 'Online' ? (m.id_meeting || null) : null,
          m.jenis === 'Online' ? (m.sandi || null) : null,
          m.jenis === 'Online' ? (m.link_rapat || null) : null,
          m.jenis === 'Offline' ? (m.ruangan || null) : null,
          m.id_departemen,
          req.user.id_user
        );
      });
      
      const insertQuery = `
        INSERT INTO rapat (tanggal, jam_mulai, jam_selesai, topik, jenis, id_meeting, sandi, link_rapat, ruangan, id_departemen, created_by)
        VALUES ${values.join(',')}
        RETURNING id_rapat, TO_CHAR(tanggal, 'YYYY-MM-DD') as tanggal_text, jam_mulai, topik, id_departemen
      `;
      
      const insertRes = await client.query(insertQuery, queryParams);
      
      // Batch insert peserta
      const pesertaValues = [];
      const pesertaParams = [];
      
      insertRes.rows.forEach(r => {
        const jamStr = r.jam_mulai.substring(0,5);
        const m = chunk.find(x => x.tanggal === r.tanggal_text && x.jam_mulai.substring(0,5) === jamStr && x.topik === r.topik && x.id_departemen === r.id_departemen);
        if (m && m.peserta && Array.isArray(m.peserta) && m.peserta.length > 0) {
          m.peserta.forEach(pid => {
            pesertaValues.push(`($X, $Y)`);
            pesertaParams.push(r.id_rapat, parseInt(pid));
          });
        }
      });
      
      if (pesertaValues.length > 0) {
        for (let j = 0; j < pesertaValues.length; j += 1000) {
           const chunkPesValues = pesertaValues.slice(j, j + 1000);
           const chunkPesParams = pesertaParams.slice(j * 2, (j + 1000) * 2);
           
           let newIdx = 1;
           const remappedValues = chunkPesValues.map(() => `($${newIdx++}, $${newIdx++})`);
           
           await client.query(`
             INSERT INTO peserta_rapat (id_rapat, id_departemen) 
             VALUES ${remappedValues.join(',')} 
             ON CONFLICT DO NOTHING
           `, chunkPesParams);
        }
      }
      
      importedCount += chunk.length;
    }

    await client.query(
      'INSERT INTO log_akses (id_user, aksi, detail, ip) VALUES ($1, $2, $3, $4)',
      [req.user.id_user, 'IMPORT_RAPAT', `Berhasil import ${importedCount} jadwal, dilewati ${skippedCount} duplikat`, req.ip]
    );

    await client.query('COMMIT');
    res.json({ 
      success: true, 
      message: `Selesai! ${importedCount} rapat berhasil ditambahkan.` + (skippedCount > 0 ? ` (${skippedCount} data dilewati karena sudah ada/duplikat).` : '')
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Rapat createBulk error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server saat import.' });
  } finally {
    client.release();
  }
};

// PUT /api/rapat/:id
const update = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { tanggal, jam_mulai, jam_selesai, topik, jenis, id_meeting, sandi, link_rapat, ruangan, id_departemen, status_manual, extra_menit, peserta } = req.body;

    await client.query('BEGIN');

    await client.query(`
      UPDATE rapat SET
        tanggal = COALESCE($1, tanggal),
        jam_mulai = COALESCE($2, jam_mulai),
        jam_selesai = COALESCE($3, jam_selesai),
        topik = COALESCE($4, topik),
        jenis = COALESCE($5, jenis),
        id_meeting = $6, sandi = $7, link_rapat = $8, ruangan = $9,
        id_departemen = COALESCE($10, id_departemen), 
        status_manual = COALESCE($11, status_manual), 
        extra_menit = COALESCE($12, extra_menit)
      WHERE id_rapat = $13
    `, [
      tanggal, jam_mulai, jam_selesai, topik, jenis,
      jenis === 'Online' ? (id_meeting || null) : null,
      jenis === 'Online' ? (sandi || null) : null,
      jenis === 'Online' ? (link_rapat || null) : null,
      jenis === 'Offline' ? (ruangan || null) : null,
      id_departemen || null, status_manual || null, extra_menit || null,
      id]);

    // Update peserta if provided
    if (peserta !== undefined) {
      await client.query('DELETE FROM peserta_rapat WHERE id_rapat = $1', [id]);
      if (peserta && peserta.length > 0) {
        for (const pid of peserta) {
          await client.query(
            'INSERT INTO peserta_rapat (id_rapat, id_departemen) VALUES ($1, $2) ON CONFLICT (id_rapat, id_departemen) DO NOTHING',
            [id, parseInt(pid)]
          );
        }
      }
    }

    // Notifikasi ke peserta saat rapat diubah
    const currentPeserta = await client.query('SELECT id_departemen FROM peserta_rapat WHERE id_rapat = $1', [id]);
    const deptIds = currentPeserta.rows.map(r => r.id_departemen);
    if (deptIds.length > 0) {
      const usersRes = await client.query('SELECT id_user FROM "user" WHERE id_departemen = ANY($1::int[])', [deptIds]);
      const safeTopik = topik || 'yang Anda ikuti';
      for (const row of usersRes.rows) {
        await client.query(
          'INSERT INTO notifikasi (id_user, judul, pesan, link) VALUES ($1, $2, $3, $4)',
          [row.id_user, 'Perubahan Jadwal Rapat', `Jadwal rapat "${safeTopik}" telah diubah oleh Admin.`, '/cari-rapat']
        );
      }
    }

    // Log
    await client.query(
      'INSERT INTO log_akses (id_user, aksi, detail, ip) VALUES ($1, $2, $3, $4)',
      [req.user.id_user, 'EDIT_RAPAT', `ID: ${id} — ${topik || ''}`, req.ip]
    );

    await client.query('COMMIT');
    res.json({ message: 'Jadwal rapat berhasil diperbarui.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Rapat update error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  } finally {
    client.release();
  }
};

// DELETE /api/rapat/:id
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    // Get topik for log
    const existing = await pool.query('SELECT topik, tanggal FROM rapat WHERE id_rapat = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Rapat tidak ditemukan.' });
    }

    // Ambil daftar user peserta sebelum dihapus untuk notifikasi
    const currentPeserta = await pool.query('SELECT id_departemen FROM peserta_rapat WHERE id_rapat = $1', [id]);
    const deptIds = currentPeserta.rows.map(r => r.id_departemen);

    await pool.query('DELETE FROM rapat WHERE id_rapat = $1', [id]);

    // Notifikasi ke peserta
    if (deptIds.length > 0) {
      const usersRes = await pool.query('SELECT id_user FROM "user" WHERE id_departemen = ANY($1::int[])', [deptIds]);
      for (const row of usersRes.rows) {
        await pool.query(
          'INSERT INTO notifikasi (id_user, judul, pesan, link) VALUES ($1, $2, $3, $4)',
          [row.id_user, 'Rapat Dibatalkan', `Rapat "${existing.rows[0].topik}" pada ${existing.rows[0].tanggal} telah dibatalkan.`, null]
        );
      }
    }

    // Log
    await pool.query(
      'INSERT INTO log_akses (id_user, aksi, detail, ip) VALUES ($1, $2, $3, $4)',
      [req.user.id_user, 'HAPUS_RAPAT', `${existing.rows[0].topik} — ${existing.rows[0].tanggal}`, req.ip]
    );

    res.json({ message: 'Jadwal rapat berhasil dihapus.' });
  } catch (err) {
    console.error('Rapat delete error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
};

module.exports = { getAll, getTv, getById, create, createBulk, update, remove };
