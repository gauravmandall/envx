#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔐 Environment Variables Manager (EnvX) Setup');
console.log('===============================================\n');

function generateSecureKey() {
  return crypto.randomBytes(32).toString('hex');
}

function promptForPassword() {
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

async function setup() {
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

    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Run: npm run dev (or yarn dev / bun dev)');
    console.log('2. Open: http://localhost:3000');
    console.log(`3. Login with password: ${adminPassword}`);
    console.log('\n⚠️  IMPORTANT:');
    console.log('- Keep your .env.local file secure');
    console.log('- Backup your master encryption key');
    console.log('- Never commit .env.local to version control');
    console.log('\n🔐 Your master encryption key:');
    console.log(`${masterKey}`);
    console.log('\n   Store this key securely - you cannot recover encrypted data without it!');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run setup
setup(); 