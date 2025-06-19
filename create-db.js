// Script to create database tables directly using SQL
require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  console.log('Setting up database tables...');
  
  if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    // Uncomment if needed for cloud databases
    // ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // Read SQL script
    const sqlPath = path.join(__dirname, 'create-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Running SQL script...');
    await client.query(sql);
    console.log('✅ Tables created successfully');
    
    // Verify table exists
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'environment_variables'
      );
    `);
    
    if (checkResult.rows[0].exists) {
      console.log('✅ environment_variables table exists');
    } else {
      console.error('❌ Table creation failed');
    }
    
    await client.end();
  } catch (err) {
    console.error('❌ Database setup error:', err);
    process.exit(1);
  }
}

setupDatabase().catch(console.error); 