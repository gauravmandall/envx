import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { encrypt, decrypt } from './crypto'
import { prisma } from './prisma'

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

// In-memory cache for faster access and fallback
let envVarsCache: StoredEnvVariable[] | null = null;

// Development-only file storage path
const ENV_STORAGE_PATH = join(process.cwd(), 'data', 'env-variables.json');

// Clear the cache when needed
export function clearCache() {
  envVarsCache = null;
}

// Ensure data directory exists (for development only)
function ensureDataDirectory() {
  // Skip directory creation in serverless environments
  if (process.env.VERCEL) {
    return;
  }
  
  const dataDir = join(process.cwd(), 'data')
  if (!existsSync(dataDir)) {
    try {
      mkdirSync(dataDir, { recursive: true })
    } catch (error) {
      console.error('Failed to create data directory, but continuing anyway:', error);
      // Don't throw error - we'll use database for storage instead
    }
  }
}

// Read encrypted environment variables from Prisma database
async function readStoredEnvVarsFromDb(): Promise<StoredEnvVariable[]> {
  try {
    // Try to get from Prisma
    const envVars = await prisma.environmentVariable.findMany();
    
    // Transform from DB format to StoredEnvVariable format
    return envVars.map((item: { id: any; name: any; encryptedValue: any; createdAt: { toISOString: () => any }; updatedAt: { toISOString: () => any } }) => ({
      id: item.id,
      name: item.name,
      encryptedValue: item.encryptedValue,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString()
    }));
  } catch (error) {
    console.error('Error in Prisma read operation:', error);
    // Fall back to file storage
    return readStoredEnvVarsFromFile();
  }
}

// Read from file (fallback for development or if database fails)
function readStoredEnvVarsFromFile(): StoredEnvVariable[] {
  // Don't attempt to read from filesystem in serverless environments
  if (process.env.VERCEL) {
    console.log('Skipping file read in serverless environment');
    return [];
  }
  
  try {
    ensureDataDirectory();
    
    if (!existsSync(ENV_STORAGE_PATH)) {
      return [];
    }
    
    const data = readFileSync(ENV_STORAGE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading env storage file:', error);
    return [];
  }
}

// Write to Prisma database
async function writeStoredEnvVarsToDb(envVars: StoredEnvVariable[]): Promise<boolean> {
  try {
    // First, delete all existing records
    await prisma.environmentVariable.deleteMany({});
    
    // Then create all new records
    await prisma.$transaction(
      envVars.map(v => 
        prisma.environmentVariable.create({
          data: {
            id: v.id,
            name: v.name,
            encryptedValue: v.encryptedValue,
            createdAt: new Date(v.createdAt),
            updatedAt: new Date(v.updatedAt)
          }
        })
      )
    );
    
    // Update cache
    envVarsCache = [...envVars];
    return true;
  } catch (error) {
    console.error('Error in Prisma write operation:', error);
    // Fall back to file storage if database fails
    return writeStoredEnvVarsToFile(envVars);
  }
}

// Fallback write to file
function writeStoredEnvVarsToFile(envVars: StoredEnvVariable[]): boolean {
  // Don't attempt to write to filesystem in serverless environments
  if (process.env.VERCEL) {
    console.log('Skipping file write in serverless environment');
    return false;
  }
  
  try {
    ensureDataDirectory();
    writeFileSync(ENV_STORAGE_PATH, JSON.stringify(envVars, null, 2));
    envVarsCache = [...envVars];
    return true;
  } catch (error) {
    console.error('Error writing env storage to file:', error);
    return false;
  }
}

// Read encrypted environment variables from storage (with caching)
async function readStoredEnvVars(): Promise<StoredEnvVariable[]> {
  // Return cached version if available
  if (envVarsCache !== null) {
    return [...envVarsCache]; // Return a copy to prevent accidental mutations
  }
  
  const envVars = await readStoredEnvVarsFromDb();
  envVarsCache = [...envVars];
  return envVars;
}

// Write encrypted environment variables to storage
async function writeStoredEnvVars(envVars: StoredEnvVariable[]): Promise<boolean> {
  const success = await writeStoredEnvVarsToDb(envVars);
  return success;
}

// Get all environment variables (decrypted)
export async function getAllEnvVars(): Promise<EnvVariable[]> {
  const storedVars = await readStoredEnvVars();
  
  return storedVars.map(storedVar => {
    try {
      return {
        id: storedVar.id,
        name: storedVar.name,
        value: decrypt(storedVar.encryptedValue),
        createdAt: storedVar.createdAt,
        updatedAt: storedVar.updatedAt
      };
    } catch (error) {
      console.error(`Failed to decrypt variable ${storedVar.name}:`, error);
      // Return with placeholder value if decryption fails
      return {
        id: storedVar.id,
        name: storedVar.name,
        value: '[DECRYPTION_ERROR]',
        createdAt: storedVar.createdAt,
        updatedAt: storedVar.updatedAt
      };
    }
  });
}

// Get single environment variable by ID
export async function getEnvVarById(id: string): Promise<EnvVariable | null> {
  const allVars = await getAllEnvVars();
  return allVars.find(v => v.id === id) || null;
}

// Get single environment variable by name
export async function getEnvVarByName(name: string): Promise<EnvVariable | null> {
  const allVars = await getAllEnvVars();
  return allVars.find(v => v.name === name) || null;
}

// Create new environment variable
export async function createEnvVar(name: string, value: string): Promise<EnvVariable> {
  const storedVars = await readStoredEnvVars();
  
  // Check if name already exists
  if (storedVars.some(v => v.name === name)) {
    throw new Error(`Environment variable '${name}' already exists`);
  }
  
  const now = new Date().toISOString();
  const id = generateId();
  
  const newStoredVar: StoredEnvVariable = {
    id,
    name,
    encryptedValue: encrypt(value),
    createdAt: now,
    updatedAt: now
  };
  
  storedVars.push(newStoredVar);
  await writeStoredEnvVars(storedVars);
  
  return {
    id,
    name,
    value,
    createdAt: now,
    updatedAt: now
  };
}

// Update environment variable
export async function updateEnvVar(id: string, name: string, value: string): Promise<EnvVariable> {
  const storedVars = await readStoredEnvVars();
  const index = storedVars.findIndex(v => v.id === id);
  
  if (index === -1) {
    throw new Error('Environment variable not found');
  }
  
  // Check if name conflicts with another variable
  const existingWithName = storedVars.find(v => v.name === name && v.id !== id);
  if (existingWithName) {
    throw new Error(`Environment variable '${name}' already exists`);
  }
  
  const now = new Date().toISOString();
  
  storedVars[index] = {
    ...storedVars[index],
    name,
    encryptedValue: encrypt(value),
    updatedAt: now
  };
  
  await writeStoredEnvVars(storedVars);
  
  return {
    id,
    name,
    value,
    createdAt: storedVars[index].createdAt,
    updatedAt: now
  };
}

// Delete environment variable
export async function deleteEnvVar(id: string): Promise<boolean> {
  const storedVars = await readStoredEnvVars();
  const index = storedVars.findIndex(v => v.id === id);
  
  if (index === -1) {
    return false;
  }
  
  storedVars.splice(index, 1);
  return await writeStoredEnvVars(storedVars);
}

// Generate unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Bulk import environment variables (useful for migration)
export async function bulkImportEnvVars(envVars: Array<{ name: string; value: string }>): Promise<EnvVariable[]> {
  const storedVars = await readStoredEnvVars();
  const now = new Date().toISOString();
  const results: EnvVariable[] = [];
  
  for (const { name, value } of envVars) {
    // Skip if already exists
    if (storedVars.some(v => v.name === name)) {
      continue;
    }
    
    const id = generateId();
    const newStoredVar: StoredEnvVariable = {
      id,
      name,
      encryptedValue: encrypt(value),
      createdAt: now,
      updatedAt: now
    };
    
    storedVars.push(newStoredVar);
    results.push({
      id,
      name,
      value,
      createdAt: now,
      updatedAt: now
    });
  }
  
  await writeStoredEnvVars(storedVars);
  return results;
} 