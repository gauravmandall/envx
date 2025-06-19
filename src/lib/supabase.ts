import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not found. Storage features might not work properly.')
}

// Create a single supabase client for the entire application
export const supabase = createClient(supabaseUrl, supabaseKey)

// Define types for the environment variables table
export interface DbEnvVariable {
  id: string
  name: string
  encrypted_value: string
  created_at: string
  updated_at: string
}

// Table name for environment variables
export const ENV_VARS_TABLE = 'environment_variables'

// Initialize Supabase table
export async function initSupabaseTable(): Promise<boolean> {
  try {
    if (!supabaseUrl || !supabaseKey) {
      console.log('Supabase not configured, skipping initialization');
      return false;
    }
    
    // Check if table exists by attempting to select one row
    const { data, error } = await supabase
      .from(ENV_VARS_TABLE)
      .select('id')
      .limit(1);
      
    if (error) {
      console.log('Table might not exist, attempting to create it...');
      
      // Create a dummy record to initialize the table
      const dummyRecord = {
        id: 'init_' + Date.now().toString(),
        name: 'INIT_VAR',
        encrypted_value: 'init_value',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { error: createError } = await supabase
        .from(ENV_VARS_TABLE)
        .insert(dummyRecord);
      
      if (createError) {
        console.error('Failed to create table:', createError);
        return false;
      }
      
      console.log('Successfully created table');
      
      // Delete the dummy record
      await supabase
        .from(ENV_VARS_TABLE)
        .delete()
        .eq('id', dummyRecord.id);
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing Supabase table:', error);
    return false;
  }
} 