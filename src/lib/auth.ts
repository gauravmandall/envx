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
  return prisma.adminCredential.findUnique({
    where: { id: 'admin' }
  });
}

/**
 * Verify admin password
 */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  // Get admin credentials from database
  const credentials = await getAdminCredentials();
  
  // Fall back to environment variable if no credentials in database
  if (!credentials) {
    const envPassword = process.env.ADMIN_PASSWORD || 'secure123';
    return password === envPassword;
  }
  
  // Verify with hashed password
  return verifyPassword(password, credentials.hashedPassword, credentials.salt);
} 