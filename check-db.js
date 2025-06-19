// Simple script to test PostgreSQL connectivity
require('dotenv').config();
const { Client } = require('pg');

async function testConnection() {
  console.log('Testing database connection...');
  
  if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    // Add SSL config if needed (for services like Heroku, Supabase, etc.)
    // ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('✅ Successfully connected to the database!');
    
    const result = await client.query('SELECT NOW()');
    console.log(`⏰ Database time: ${result.rows[0].now}`);
    
    await client.end();
  } catch (err) {
    console.error('❌ Database connection error:', err);
    process.exit(1);
  }
}

testConnection().catch(console.error); 