/**
 * Database Connection Examples
 * 
 * This file shows different PostgreSQL connection string formats
 * for various cloud providers and scenarios.
 */

export const DB_CONNECTION_EXAMPLES = {
  // Standard PostgreSQL connection
  standard: "postgresql://username:password@hostname:port/database",

  // PostgreSQL with SSL (for cloud databases like Supabase, Heroku, etc.)
  withSSL: "postgresql://username:password@hostname:port/database?sslmode=require",
  
  // PostgreSQL with SSL and connection limit (for Vercel deployments)
  vercel: "postgresql://username:password@hostname:port/database?sslmode=require&connection_limit=5",
  
  // Neon.tech serverless PostgreSQL
  neon: "postgresql://username:password@hostname:port/database?sslmode=require&pgbouncer=true",
  
  // When using pgBouncer (connection pooling)
  pooled: "postgresql://username:password@hostname:port/database?pgbouncer=true&statement_cache_mode=describe"
};

/**
 * Special characters in passwords need to be URL encoded
 * For example, if password is "p@ssw0rd!", use:
 * "postgresql://username:p%40ssw0rd%21@hostname:port/database"
 */

/**
 * Usage in .env file:
 * 
 * DATABASE_URL="postgresql://username:password@hostname:port/database?sslmode=require"
 */ 