// Complete database setup script with SSL handling
require('dotenv').config();
const { Client } = require('pg');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Disable certificate validation for this script
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function setupDatabase() {
  console.log('📦 Setting up EnvX database...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL environment variable is not set!');
    console.error('   Please create a .env file with your PostgreSQL connection string.');
    process.exit(1);
  }
  
  try {
    // Step 1: Test database connection
    console.log('🔌 Testing database connection...');
    await testConnection();
    
    // Step 2: Create database tables
    console.log('\n📝 Creating database tables...');
    await createTables();
    
    // Step 3: Generate Prisma client
    console.log('\n🔧 Generating Prisma client...');
    await generatePrismaClient();
    
    console.log('\n✅ Database setup complete! Your application is ready to use.');
    console.log('\n⚠️  SECURITY WARNING:');
    console.log('   This script disabled SSL certificate validation temporarily.');
    console.log('   For production use, please ensure your DATABASE_URL has valid certificates.');
    console.log('\n🚀 Next steps:');
    console.log('   1. Start your application: npm run dev');
    console.log('   2. Access it in your browser at: http://localhost:3000');
  } catch (err) {
    console.error('\n❌ Setup failed:', err.message);
    process.exit(1);
  }
}

// Test database connection
async function testConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { 
      rejectUnauthorized: false 
    }
  });
  
  try {
    await client.connect();
    const result = await client.query('SELECT NOW()');
    console.log(`✅ Connected successfully! Database time: ${result.rows[0].now}`);
    await client.end();
    return true;
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    throw new Error(`Failed to connect to database: ${err.message}`);
  }
}

// Create necessary database tables
async function createTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { 
      rejectUnauthorized: false 
    }
  });
  
  try {
    await client.connect();
    
    // Read SQL script
    const sqlPath = path.join(__dirname, 'create-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await client.query(sql);
    
    // Verify table exists
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'environment_variables'
      );
    `);
    
    if (checkResult.rows[0].exists) {
      console.log('✅ Database tables created successfully');
    } else {
      throw new Error('Table creation failed');
    }
    
    await client.end();
    return true;
  } catch (err) {
    console.error('❌ Error creating tables:', err.message);
    throw new Error(`Failed to create database tables: ${err.message}`);
  }
}

// Generate Prisma client
async function generatePrismaClient() {
  return new Promise((resolve, reject) => {
    exec('npx prisma generate', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error generating Prisma client:', stderr);
        reject(new Error(`Prisma client generation failed: ${error.message}`));
        return;
      }
      
      console.log('✅ Prisma client generated successfully');
      resolve(true);
    });
  });
}

setupDatabase().catch(console.error); 