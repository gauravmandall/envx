import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { encrypt, decrypt } from './crypto'

export interface StoredEnvVariable {
  id: string
  name: string
  encryptedValue: string
  createdAt: string
  updatedAt: string
}

export interface EnvVariable {
  id: string
  name: string
  value: string
  createdAt: string
  updatedAt: string
}

// In-memory storage for environments without filesystem write access (like Vercel production)
let inMemoryStorage: StoredEnvVariable[] = [];
const isVercelProduction = process.env.VERCEL_ENV === 'production';
const ENV_STORAGE_PATH = join(process.cwd(), 'data', 'env-variables.json');

// Ensure data directory exists
function ensureDataDirectory() {
  if (isVercelProduction) {
    return; // Skip filesystem operations in Vercel production
  }
  
  const dataDir = join(process.cwd(), 'data')
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }
}

// Read encrypted environment variables from storage
function readStoredEnvVars(): StoredEnvVariable[] {
  // If we have in-memory data and we're in Vercel production, use that
  if (isVercelProduction) {
    return [...inMemoryStorage]; // Return a copy to prevent accidental mutation
  }
  
  ensureDataDirectory()
  
  if (!existsSync(ENV_STORAGE_PATH)) {
    return []
  }
  
  try {
    const data = readFileSync(ENV_STORAGE_PATH, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading env storage:', error)
    return []
  }
}

// Write encrypted environment variables to storage
function writeStoredEnvVars(envVars: StoredEnvVariable[]) {
  if (isVercelProduction) {
    // In Vercel production, store in memory instead
    inMemoryStorage = [...envVars];
    return;
  }
  
  ensureDataDirectory()
  
  try {
    writeFileSync(ENV_STORAGE_PATH, JSON.stringify(envVars, null, 2))
  } catch (error) {
    console.error('Error writing env storage:', error)
    // Fallback to in-memory storage if file writing fails
    inMemoryStorage = [...envVars];
    console.log('Using in-memory storage as fallback')
  }
}

// Get all environment variables (decrypted)
export function getAllEnvVars(): EnvVariable[] {
  const storedVars = readStoredEnvVars()
  
  return storedVars.map(storedVar => {
    try {
      return {
        id: storedVar.id,
        name: storedVar.name,
        value: decrypt(storedVar.encryptedValue),
        createdAt: storedVar.createdAt,
        updatedAt: storedVar.updatedAt
      }
    } catch (error) {
      console.error(`Failed to decrypt variable ${storedVar.name}:`, error)
      // Return with placeholder value if decryption fails
      return {
        id: storedVar.id,
        name: storedVar.name,
        value: '[DECRYPTION_ERROR]',
        createdAt: storedVar.createdAt,
        updatedAt: storedVar.updatedAt
      }
    }
  })
}

// Get single environment variable by ID
export function getEnvVarById(id: string): EnvVariable | null {
  const allVars = getAllEnvVars()
  return allVars.find(v => v.id === id) || null
}

// Get single environment variable by name
export function getEnvVarByName(name: string): EnvVariable | null {
  const allVars = getAllEnvVars()
  return allVars.find(v => v.name === name) || null
}

// Create new environment variable
export function createEnvVar(name: string, value: string): EnvVariable {
  const storedVars = readStoredEnvVars()
  
  // Check if name already exists
  if (storedVars.some(v => v.name === name)) {
    throw new Error(`Environment variable '${name}' already exists`)
  }
  
  const now = new Date().toISOString()
  const id = generateId()
  
  const newStoredVar: StoredEnvVariable = {
    id,
    name,
    encryptedValue: encrypt(value),
    createdAt: now,
    updatedAt: now
  }
  
  storedVars.push(newStoredVar)
  writeStoredEnvVars(storedVars)
  
  return {
    id,
    name,
    value,
    createdAt: now,
    updatedAt: now
  }
}

// Update environment variable
export function updateEnvVar(id: string, name: string, value: string): EnvVariable {
  const storedVars = readStoredEnvVars()
  const index = storedVars.findIndex(v => v.id === id)
  
  if (index === -1) {
    throw new Error('Environment variable not found')
  }
  
  // Check if name conflicts with another variable
  const existingWithName = storedVars.find(v => v.name === name && v.id !== id)
  if (existingWithName) {
    throw new Error(`Environment variable '${name}' already exists`)
  }
  
  const now = new Date().toISOString()
  
  storedVars[index] = {
    ...storedVars[index],
    name,
    encryptedValue: encrypt(value),
    updatedAt: now
  }
  
  writeStoredEnvVars(storedVars)
  
  return {
    id,
    name,
    value,
    createdAt: storedVars[index].createdAt,
    updatedAt: now
  }
}

// Delete environment variable
export function deleteEnvVar(id: string): boolean {
  const storedVars = readStoredEnvVars()
  const index = storedVars.findIndex(v => v.id === id)
  
  if (index === -1) {
    return false
  }
  
  storedVars.splice(index, 1)
  writeStoredEnvVars(storedVars)
  
  return true
}

// Generate unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

// Bulk import environment variables (useful for migration)
export function bulkImportEnvVars(envVars: Array<{ name: string; value: string }>): EnvVariable[] {
  const storedVars = readStoredEnvVars()
  const now = new Date().toISOString()
  const results: EnvVariable[] = []
  
  for (const { name, value } of envVars) {
    // Skip if already exists
    if (storedVars.some(v => v.name === name)) {
      continue
    }
    
    const id = generateId()
    const newStoredVar: StoredEnvVariable = {
      id,
      name,
      encryptedValue: encrypt(value),
      createdAt: now,
      updatedAt: now
    }
    
    storedVars.push(newStoredVar)
    results.push({
      id,
      name,
      value,
      createdAt: now,
      updatedAt: now
    })
  }
  
  writeStoredEnvVars(storedVars)
  return results
} 