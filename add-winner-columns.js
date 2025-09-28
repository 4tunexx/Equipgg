require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL in environment');
  process.exit(1);
}

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runSQL() {
  try {
    await client.connect();
    console.log('Connected to database');

    const sql = fs.readFileSync('./add-match-winner-columns.sql', 'utf8');
    console.log('Executing SQL...');

    // Execute the entire SQL file
    await client.query(sql);

    console.log('Successfully added winner columns to matches table');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

runSQL();