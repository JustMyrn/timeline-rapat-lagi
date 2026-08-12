const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.piojqylybskjieltnvns:ibrahimbudi123@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});
client.connect()
  .then(() => client.query("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle in transaction' AND pid != pg_backend_pid();"))
  .then(res => { console.log('Terminated', res.rowCount, 'connections'); client.end(); })
  .catch(e => { console.error(e); client.end(); });
