// This script helps set up the required Prisma database
// Run with: node prisma-setup.js

require('dotenv').config();
const { exec } = require('child_process');

if (!process.env.DATABASE_URL) {
  console.error('ERROR: Missing DATABASE_URL in environment variables.');
  console.error('Please create a .env.local or .env file with DATABASE_URL');
  process.exit(1);
}

console.log('Setting up Prisma for EnvX...');

async function setupPrisma() {
  try {
    // Run Prisma commands to set up the database
    console.log('Generating Prisma client...');
    await execCommand('npx prisma generate');
    
    console.log('Running database migrations...');
    await execCommand('npx prisma migrate deploy');
    
    console.log('✅ Database setup completed successfully');
    console.log('\n===== IMPORTANT =====');
    console.log('Make sure your .env.local file contains:');
    console.log('1. DATABASE_URL=your_postgresql_connection_string');
    console.log('2. MASTER_ENCRYPTION_KEY=your_secure_encryption_key');
    console.log('3. ADMIN_PASSWORD=your_admin_password');
    console.log('=====================');
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Helper function to execute shell commands
function execCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`> ${command}`);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        console.error(`Stderr: ${stderr}`);
        return reject(error);
      }
      
      console.log(stdout);
      resolve(stdout);
    });
  });
}

setupPrisma().catch(console.error); 