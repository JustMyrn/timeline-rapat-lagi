const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.piojqylybskjieltnvns:ibrahimbudi123@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});
client.connect()
  .then(() => client.query("INSERT INTO reset_request (username_input, id_user, ip) VALUES ('admin', 1, '127.0.0.1')"))
  .then(() => { console.log('Mock request created'); client.end(); })
  .catch(e => { console.error('Error:', e.message); client.end(); });
