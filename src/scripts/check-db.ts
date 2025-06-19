// Database connection test script
import dotenv from 'dotenv';
import { Client } from 'pg';

// Load environment variables
dotenv.config();

// Disable certificate validation for this script
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function testConnection(): Promise<void> {
  console.log('Testing database connection...');
  
  if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { 
      rejectUnauthorized: false 
    }
  });
  
  try {
    await client.connect();
    console.log('✅ Successfully connected to the database!');
    
    // Check if the environment_variables table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'environment_variables'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ environment_variables table exists');
      
      // Count records
      const countResult = await client.query('SELECT COUNT(*) FROM environment_variables');
      console.log(`📊 Current environment variables count: ${countResult.rows[0].count}`);
    } else {
      console.log('⚠️  environment_variables table does not exist yet');
      console.log('   Run npm run db:setup to create the database tables');
    }
    
    const result = await client.query('SELECT NOW()');
    console.log(`⏰ Database time: ${result.rows[0].now}`);
    
    await client.end();
  } catch (err) {
    console.error('❌ Database connection error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

testConnection().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 