const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

client.connect()
  .then(() => client.query("ALTER DATABASE postgres SET timezone TO 'Asia/Jakarta';"))
  .then(() => {
    console.log('Timezone updated successfully to Asia/Jakarta');
    return client.end();
  })
  .catch(err => {
    console.error(err);
    client.end();
  });
