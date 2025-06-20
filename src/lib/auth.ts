import crypto from 'crypto';
import { prisma } from './prisma';

// Length of salt in bytes
const SALT_LENGTH = 16;
// PBKDF2 configuration
const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

/**
 * Generate a random salt for password hashing
 */
export function generateSalt(): string {
  return crypto.randomBytes(SALT_LENGTH).toString('hex');
}

/**
 * Hash a password with PBKDF2 algorithm
 */
export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(
    password, 
    salt, 
    ITERATIONS, 
    KEY_LENGTH, 
    DIGEST
  ).toString('hex');
}

/**
 * Verify a password against a hash
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const hashedPassword = hashPassword(password, salt);
  return hashedPassword === hash;
}

/**
 * Save admin credentials to the database
 */
export async function saveAdminCredentials(password: string): Promise<void> {
  const salt = generateSalt();
  const hashedPassword = hashPassword(password, salt);
  
  await prisma.adminCredential.upsert({
    where: { id: 'admin' },
    update: {
      hashedPassword,
      salt,
      updatedAt: new Date()
    },
    create: {
      id: 'admin',
      hashedPassword,
      salt,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });
}

/**
 * Get admin credentials from the database
 */
export async function getAdminCredentials() {
  try {
    return await prisma.adminCredential.findUnique({
      where: { id: 'admin' }
    });
  } catch (err) {
    console.error('Error fetching admin credentials:', err);
    return null;
  }
}

/**
 * Verify admin password
 */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  try {
    // Get admin credentials from database
    const credentials = await getAdminCredentials();
    
    // Fall back to environment variable if no credentials in database
    if (!credentials) {
      console.log('No admin credentials found, falling back to environment variable');
      const envPassword = process.env.ADMIN_PASSWORD || 'secure123';
      console.log('Using password from env vars or default:', envPassword.replace(/./g, '*'));
      console.log('Comparing with provided password:', password.replace(/./g, '*'));
      return password === envPassword;
    }
    
    // Verify with hashed password
    console.log('Found admin credentials in database, using hashed password verification');
    const isValid = verifyPassword(password, credentials.hashedPassword, credentials.salt);
    console.log('Password verification result:', isValid ? 'VALID' : 'INVALID');
    return isValid;
  } catch (err) {
    console.error('Error during password verification:', err);
    // Fall back to environment variable in case of error
    const envPassword = process.env.ADMIN_PASSWORD || 'secure123';
    return password === envPassword;
  }
} 