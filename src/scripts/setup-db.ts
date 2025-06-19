// Database setup script with SSL handling
import dotenv from 'dotenv';
import { Client } from 'pg';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Disable certificate validation for this script
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// SQL for creating the environment_variables table
const CREATE_TABLE_SQL = `
-- Create the environment_variables table if it doesn't exist
CREATE TABLE IF NOT EXISTS "environment_variables" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "encrypted_value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "environment_variables_pkey" PRIMARY KEY ("id")
);

-- Create unique index on name if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS "environment_variables_name_key" ON "environment_variables"("name");

-- Create the admin_credentials table if it doesn't exist
CREATE TABLE IF NOT EXISTS "admin_credentials" (
    "id" TEXT NOT NULL DEFAULT 'admin',
    "hashed_password" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_credentials_pkey" PRIMARY KEY ("id")
);
`;

async function setupDatabase(): Promise<void> {
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
    console.error('\n❌ Setup failed:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

// Test database connection
async function testConnection(): Promise<boolean> {
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
    console.error('❌ Database connection error:', err instanceof Error ? err.message : String(err));
    throw new Error(`Failed to connect to database: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// Create necessary database tables
async function createTables(): Promise<boolean> {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { 
      rejectUnauthorized: false 
    }
  });
  
  try {
    await client.connect();
    
    // Execute SQL to create tables
    await client.query(CREATE_TABLE_SQL);
    
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
    console.error('❌ Error creating tables:', err instanceof Error ? err.message : String(err));
    throw new Error(`Failed to create database tables: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// Generate Prisma client
async function generatePrismaClient(): Promise<boolean> {
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

setupDatabase().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 