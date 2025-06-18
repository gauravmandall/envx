import crypto from 'crypto'

// Enhanced security with multiple encryption layers
const PRIMARY_ALGORITHM = 'aes-256-gcm'
const SECONDARY_ALGORITHM = 'chacha20-poly1305'
const IV_LENGTH = 16 // For GCM, this is always 16
const CHACHA_IV_LENGTH = 12 // For ChaCha20-Poly1305
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const KEY_LENGTH = 32
const PBKDF2_ITERATIONS = 600000 // Increased iterations for better security
const MERKLE_DEPTH = 3 // Merkle-tree inspired layering

// Get the master key from environment variable
function getMasterKey(): string {
  const masterKey = process.env.MASTER_ENCRYPTION_KEY
  if (!masterKey) {
    console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('MASTER') || key.includes('KEY')))
    throw new Error('MASTER_ENCRYPTION_KEY environment variable is required. Make sure .env.local exists with MASTER_ENCRYPTION_KEY set.')
  }
  if (masterKey.length !== 64) {
    throw new Error('MASTER_ENCRYPTION_KEY must be a 64-character hex string')
  }
  return masterKey
}

// Enhanced key derivation with merkle-tree inspired layering
function deriveKey(masterKey: string, salt: Buffer, layer: number = 0): Buffer {
  return crypto.pbkdf2Sync(masterKey, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha512')
}

// Generate layered salts (merkle-tree inspired)
function generateLayeredSalts(baseSalt: Buffer, depth: number): Buffer[] {
  const salts: Buffer[] = [baseSalt]
  
  for (let i = 1; i < depth; i++) {
    const prevSalt = salts[i - 1]
    const newSalt = crypto.createHash('sha256').update(prevSalt).digest()
    salts.push(newSalt)
  }
  
  return salts
}

// Double encryption with different algorithms for maximum security
function doubleEncrypt(text: string, key1: Buffer, key2: Buffer, iv1: Buffer, iv2: Buffer): { encrypted: string; tag1: Buffer; tag2: Buffer } {
  // First layer: AES-256-GCM
  const cipher1 = crypto.createCipheriv(PRIMARY_ALGORITHM, key1, iv1)
  let encrypted1 = cipher1.update(text, 'utf8', 'hex')
  encrypted1 += cipher1.final('hex')
  const tag1 = cipher1.getAuthTag()
  
  // Second layer: ChaCha20-Poly1305
  const cipher2 = crypto.createCipheriv(SECONDARY_ALGORITHM, key2, iv2)
  let encrypted2 = cipher2.update(encrypted1, 'hex', 'hex')
  encrypted2 += cipher2.final('hex')
  const tag2 = cipher2.getAuthTag()
  
  return { encrypted: encrypted2, tag1, tag2 }
}

// Double decryption
function doubleDecrypt(encryptedData: string, key1: Buffer, key2: Buffer, iv1: Buffer, iv2: Buffer, tag1: Buffer, tag2: Buffer): string {
  // First: Decrypt ChaCha20-Poly1305 layer
  const decipher2 = crypto.createDecipheriv(SECONDARY_ALGORITHM, key2, iv2)
  decipher2.setAuthTag(tag2)
  let decrypted2 = decipher2.update(encryptedData, 'hex', 'hex')
  decrypted2 += decipher2.final('hex')
  
  // Second: Decrypt AES-256-GCM layer
  const decipher1 = crypto.createDecipheriv(PRIMARY_ALGORITHM, key1, iv1)
  decipher1.setAuthTag(tag1)
  let decrypted1 = decipher1.update(decrypted2, 'hex', 'utf8')
  decrypted1 += decipher1.final('utf8')
  
  return decrypted1
}

export function encrypt(text: string): string {
  try {
    const masterKey = getMasterKey()
    
    // Generate base salt and create layered salts (merkle-tree inspired)
    const baseSalt = crypto.randomBytes(SALT_LENGTH)
    const layeredSalts = generateLayeredSalts(baseSalt, MERKLE_DEPTH)
    
    // Generate IVs for both encryption layers
    const iv1 = crypto.randomBytes(IV_LENGTH)
    const iv2 = crypto.randomBytes(CHACHA_IV_LENGTH)
    
    // Derive keys from different salt layers
    const key1 = deriveKey(masterKey, layeredSalts[0])
    const key2 = deriveKey(masterKey, layeredSalts[1])
    
    // Double encryption with different algorithms
    const { encrypted, tag1, tag2 } = doubleEncrypt(text, key1, key2, iv1, iv2)
    
    // Combine all components: baseSalt + iv1 + iv2 + tag1 + tag2 + encrypted data
    const combined = Buffer.concat([
      baseSalt,           // 64 bytes - base salt for key derivation
      iv1,               // 16 bytes - AES-GCM IV
      iv2,               // 12 bytes - ChaCha20 IV
      tag1,              // 16 bytes - AES-GCM auth tag
      tag2,              // 16 bytes - ChaCha20 auth tag
      Buffer.from(encrypted, 'hex')  // Variable - double encrypted data
    ])
    
    return combined.toString('base64')
  } catch (error) {
    console.error('Enhanced encryption error:', error)
    throw new Error('Failed to encrypt data with enhanced security')
  }
}

export function decrypt(encryptedData: string): string {
  try {
    const masterKey = getMasterKey()
    const combined = Buffer.from(encryptedData, 'base64')
    
    // Extract components in order: baseSalt + iv1 + iv2 + tag1 + tag2 + encrypted
    const baseSalt = combined.slice(0, SALT_LENGTH)                                    // 64 bytes
    const iv1 = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)                  // 16 bytes  
    const iv2 = combined.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + CHACHA_IV_LENGTH) // 12 bytes
    const tag1Offset = SALT_LENGTH + IV_LENGTH + CHACHA_IV_LENGTH
    const tag1 = combined.slice(tag1Offset, tag1Offset + TAG_LENGTH)                 // 16 bytes
    const tag2 = combined.slice(tag1Offset + TAG_LENGTH, tag1Offset + TAG_LENGTH * 2) // 16 bytes
    const encrypted = combined.slice(tag1Offset + TAG_LENGTH * 2)                     // Variable
    
    // Regenerate layered salts from base salt
    const layeredSalts = generateLayeredSalts(baseSalt, MERKLE_DEPTH)
    
    // Derive the same keys used for encryption
    const key1 = deriveKey(masterKey, layeredSalts[0])
    const key2 = deriveKey(masterKey, layeredSalts[1])
    
    // Double decryption
    const decrypted = doubleDecrypt(encrypted.toString('hex'), key1, key2, iv1, iv2, tag1, tag2)
    
    return decrypted
  } catch (error) {
    console.error('Enhanced decryption error:', error)
    throw new Error('Failed to decrypt data with enhanced security')
  }
}

// Generate a secure random master key (for initial setup)
export function generateMasterKey(): string {
  return crypto.randomBytes(32).toString('hex')
} 