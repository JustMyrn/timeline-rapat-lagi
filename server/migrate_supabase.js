const { Client } = require('pg');

const connectionString = 'postgresql://postgres.piojqylybskjieltnvns:ibrahimbudi123@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    await client.connect();
    console.log('Connected to Supabase');

    await client.query(`
      ALTER TABLE reset_request ADD COLUMN IF NOT EXISTS catatan TEXT DEFAULT NULL;
    `);
    console.log('Added catatan column to reset_request table');

  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.end();
    console.log('Done.');
  }
}

migrate();
