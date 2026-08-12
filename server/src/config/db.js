const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase')
    ? { rejectUnauthorized: false }
    : (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false)
});

pool.on('connect', (client) => {
  client.query("SET TIME ZONE 'Asia/Jakarta'", (err) => {
    if (err) console.error('Failed to set timezone:', err);
  });
  console.log('🔗 Connected to PostgreSQL (Timezone: Asia/Jakarta)');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err.message);
  // Don't use process.exit in serverless environments like Vercel
});

module.exports = pool;
