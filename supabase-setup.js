// This script helps set up the required Supabase table
// Run with: node supabase-setup.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Missing Supabase credentials in environment variables.');
  console.error('Please create a .env.local file with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupSupabase() {
  console.log('Setting up Supabase for EnvX...');

  try {
    // Create environment_variables table with RLS policies
    console.log('Creating environment_variables table if it doesn\'t exist...');
    
    // Using the REST API to execute SQL (if your service role key has SQL permissions)
    const { error: sqlError } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS environment_variables (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          encrypted_value TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
        
        -- Create an index on the name column for faster lookups
        CREATE INDEX IF NOT EXISTS idx_env_vars_name ON environment_variables (name);
      `
    });

    if (sqlError) {
      console.log('Could not create table using RPC, attempting alternative method...');
      
      // Alternative method: Check if table exists first
      const { data: tableExists } = await supabase
        .from('environment_variables')
        .select('id', { count: 'exact', head: true })
        .limit(1);
        
      if (tableExists === null) {
        // Table might not exist, try to create it using insert
        console.log('Table does not appear to exist, creating it manually...');
        
        // Create a dummy record that we'll delete afterward
        const { error: insertError } = await supabase
          .from('environment_variables')
          .insert({
            id: 'setup_temp_id',
            name: 'TEMP_SETUP_VAR',
            encrypted_value: 'temp_value',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (insertError) {
          throw new Error(`Could not create table: ${insertError.message}`);
        }
        
        // Delete the temporary record
        await supabase
          .from('environment_variables')
          .delete()
          .eq('id', 'setup_temp_id');
      }
    }

    console.log('✅ Database setup completed successfully');
    console.log('You can now use your application with Supabase storage.');
    
    // Display additional instructions
    console.log('\n===== IMPORTANT =====');
    console.log('Make sure your .env.local file contains:');
    console.log('1. NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
    console.log('2. SUPABASE_SERVICE_KEY=your_supabase_service_key');
    console.log('3. MASTER_ENCRYPTION_KEY=your_secure_encryption_key');
    console.log('=====================');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupSupabase().catch(console.error); 