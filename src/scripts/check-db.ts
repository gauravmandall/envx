#!/usr/bin/env node

import dotenv from 'dotenv';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { prisma } from '../lib/prisma';
import { verifyAdminPassword, saveAdminCredentials } from '../lib/auth';
import readline from 'readline';

// Load environment variables
dotenv.config();

// Disable certificate validation for this script
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function resetAdminPassword(newPassword: string) {
  console.log('\n🔄 Resetting admin password...');
  
  try {
    await saveAdminCredentials(newPassword);
    console.log(`✅ Admin password has been reset to: ${newPassword}`);
    
    // Also update the .env.local file to keep it in sync
    try {
      const envPath = join(process.cwd(), '.env.local');
      let envContent = '';
      
      try {
        envContent = readFileSync(envPath, 'utf8');
      } catch (error) {
        // File doesn't exist, create new content
        envContent = '';
      }
      
      // Update or add ADMIN_PASSWORD
      const lines = envContent.split('\n');
      const adminPasswordIndex = lines.findIndex(line => line.startsWith('ADMIN_PASSWORD='));
      
      if (adminPasswordIndex !== -1) {
        lines[adminPasswordIndex] = `ADMIN_PASSWORD=${newPassword}`;
      } else {
        lines.push(`ADMIN_PASSWORD=${newPassword}`);
      }
      
      // Write back to file
      writeFileSync(envPath, lines.join('\n'));
      console.log('✅ Updated .env.local file with new password');
    } catch (error) {
      console.error('❌ Error updating .env.local file:', error instanceof Error ? error.message : String(error));
      console.log('   Please update your .env.local file manually with the new password');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to reset password:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function checkDatabase() {
  console.log('🔍 EnvX Database Diagnosis Tool');
  console.log('==============================\n');

  try {
    // Check database connection
    console.log('1. Testing database connection...');
    try {
      await prisma.$connect();
      console.log('✅ Database connection successful!');
      
      // Check for database URL
      console.log(`📡 Using DATABASE_URL: ${process.env.DATABASE_URL ? '(provided)' : '(not set)'}`);
    } catch (err) {
      console.error('❌ Database connection failed:', err instanceof Error ? err.message : String(err));
      console.error('   Please check your DATABASE_URL in .env.local');
      return;
    }

    // Check for admin credentials
    console.log('\n2. Checking admin credentials in database...');
    const credentials = await prisma.adminCredential.findUnique({
      where: { id: 'admin' }
    });
    
    if (credentials) {
      console.log('✅ Admin credentials found in database!');
      console.log('   Created at:', credentials.createdAt);
      console.log('   Updated at:', credentials.updatedAt);
      console.log('   Salt length:', credentials.salt.length, 'characters');
      console.log('   Password hash length:', credentials.hashedPassword.length, 'characters');
    } else {
      console.log('❌ No admin credentials found in database!');
      console.log('   Will fall back to ADMIN_PASSWORD environment variable.');
      
      // Check for environment variable fallback
      if (process.env.ADMIN_PASSWORD) {
        console.log('✅ ADMIN_PASSWORD environment variable is set.');
        console.log('   Password:', process.env.ADMIN_PASSWORD);
      } else {
        console.log('❌ ADMIN_PASSWORD environment variable is not set!');
        console.log('   Using default password: secure123');
      }
    }
    
    // Check password verification
    if (process.env.ADMIN_PASSWORD) {
      console.log('\n3. Testing password verification...');
      
      const password = process.env.ADMIN_PASSWORD;
      const isValid = await verifyAdminPassword(password);
      
      console.log(`   Testing password: "${password}"`);
      console.log(`   Verification result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
      
      if (!isValid) {
        console.log('   ⚠️ This is unexpected! The password from your environment variable should be valid.');
        console.log('   Either the password was changed in the database, or there\'s a bug in the verification logic.');
      }
      
      // Test with wrong password
      const wrongPassword = 'wrong' + password;
      const wrongIsValid = await verifyAdminPassword(wrongPassword);
      
      console.log(`   Testing wrong password: "${wrongPassword.slice(0, 2)}${'*'.repeat(wrongPassword.length - 4)}${wrongPassword.slice(-2)}"`);
      console.log(`   Verification result: ${wrongIsValid ? '❌ VALID (should be invalid!)' : '✅ INVALID (correct)'}`);
    }
    
    await prisma.$disconnect();
    console.log('\n✅ Database check completed successfully!');
    
  } catch (err) {
    console.error('\n❌ Error during database check:', err instanceof Error ? err.message : String(err));
    
    try {
      await prisma.$disconnect();
    } catch (e) {
      // Ignore disconnection errors
    }
  }
}

async function promptForPasswordReset(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  try {
    const shouldReset = await new Promise<boolean>((resolve) => {
      rl.question('\nWould you like to reset the admin password? (y/n): ', (answer) => {
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
    
    if (shouldReset) {
      const newPassword = await new Promise<string>((resolve) => {
        rl.question('Enter new password (or press Enter to generate one): ', (password) => {
          if (password.trim() === '') {
            const generated = Math.random().toString(36).substring(2, 10) + 
                             Math.random().toString(36).substring(2, 10);
            console.log(`Generated password: ${generated}`);
            resolve(generated);
          } else {
            resolve(password.trim());
          }
        });
      });
      
      await resetAdminPassword(newPassword);
      console.log('\n🔑 You can now login with your new password.');
    } else {
      console.log('\nPassword reset cancelled.');
    }
  } catch (error) {
    console.error('Error during password reset:', error);
  } finally {
    rl.close();
  }
}

// Main function to run the script
async function main() {
  await checkDatabase();
  await promptForPasswordReset();
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 