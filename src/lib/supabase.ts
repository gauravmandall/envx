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