const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.piojqylybskjieltnvns:ibrahimbudi123@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});
client.connect()
  .then(() => client.query("SELECT * FROM \"user\""))
  .then(r => { console.log(r.rows); client.end(); })
  .catch(e => { console.error(e); client.end(); });
