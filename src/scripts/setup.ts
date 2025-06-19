#!/usr/bin/env node

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { PrismaClient } from '@prisma/client';
import { saveAdminCredentials } from '../lib/auth';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔐 Environment Variables Manager (EnvX) Setup');
console.log('===============================================\n');

function generateSecureKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

function promptForPassword(): Promise<string> {
  return new Promise((resolve) => {
    rl.question('Enter a secure admin password (or press Enter to generate one): ', (password) => {
      if (password.trim() === '') {
        const generated = crypto.randomBytes(16).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
        console.log(`Generated admin password: ${generated}`);
        resolve(generated);
      } else {
        resolve(password.trim());
      }
    });
  });
}

async function setupDatabase(adminPassword: string) {
  console.log('\n🔄 Setting up database...');
  
  try {
    // Initialize Prisma client
    const prisma = new PrismaClient();
    
    // Store admin credentials in database
    await saveAdminCredentials(adminPassword);
    console.log('✅ Admin credentials stored in database');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Failed to set up database:', error instanceof Error ? error.message : String(error));
    console.log('   Admin credentials will only be stored in .env.local file.');
  }
}

async function setup(): Promise<void> {
  try {
    // Check if .env.local already exists
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      console.log('⚠️  .env.local already exists. Please backup or remove it first.');
      process.exit(1);
    }

    console.log('🔑 Setting up your environment variables...\n');

    // Generate master encryption key
    const masterKey = generateSecureKey();
    console.log('✅ Generated master encryption key (64 characters)');

    // Get admin password
    const adminPassword = await promptForPassword();
    console.log('✅ Admin password set');

    // Create .env.local content
    const envContent = `# Environment Variables Manager Configuration
# Generated on ${new Date().toISOString()}

# Admin password for accessing the environment variables manager
ADMIN_PASSWORD=${adminPassword}

# Master encryption key for encrypting environment variables
# CRITICAL: Keep this key secure and backed up!
# If you lose this key, all encrypted environment variables cannot be decrypted
MASTER_ENCRYPTION_KEY=${masterKey}

# Database connection string for PostgreSQL (setup separately)
# DATABASE_URL=postgresql://username:password@hostname:port/database?sslmode=require
`;

    // Write .env.local file
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ Created .env.local file');

    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('✅ Created data directory');
    }
    
    // If DATABASE_URL is provided, set up the database
    if (process.env.DATABASE_URL) {
      await setupDatabase(adminPassword);
    } else {
      console.log('\n⚠️ No DATABASE_URL found in environment variables.');
      console.log('   Set DATABASE_URL in .env.local to enable persistent storage.');
    }

    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Set up your PostgreSQL database and update DATABASE_URL in .env.local');
    console.log('2. Run: npm run db:setup');
    console.log('3. Run: npm run dev (or yarn dev / bun dev)');
    console.log('4. Open: http://localhost:3000');
    console.log(`5. Login with password: ${adminPassword}`);
    console.log('\n⚠️  IMPORTANT:');
    console.log('- Keep your .env.local file secure');
    console.log('- Backup your master encryption key');
    console.log('- Never commit .env.local to version control');
    console.log('\n🔐 Your master encryption key:');
    console.log(`${masterKey}`);
    console.log('\n   Store this key securely - you cannot recover encrypted data without it!');

  } catch (error) {
    console.error('❌ Setup failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run setup
setup().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 