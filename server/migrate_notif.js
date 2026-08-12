const fs = require('fs');
const { Pool } = require('pg');

const envFile = fs.readFileSync('.env', 'utf8');
let dbUrl = '';
envFile.split('\n').forEach(line => {
  if (line.startsWith('DATABASE_URL=')) {
    dbUrl = line.split('=')[1].replace(/['"]/g, '').trim();
  }
});

const pool = new Pool({
  connectionString: dbUrl
});

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifikasi (
        id_notifikasi SERIAL PRIMARY KEY,
        id_user INT NOT NULL,
        judul VARCHAR(200) NOT NULL,
        pesan TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        link VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_user) REFERENCES "user"(id_user) ON UPDATE CASCADE ON DELETE CASCADE
      );
    `);
    console.log('Success creating notifikasi table');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
}

run();
