import { PrismaClient } from '@prisma/client'

// Handle SSL certificate validation in different environments
// In development, the DATABASE_URL should be manually updated with proper SSL params
// For Vercel, we need to set NODE_TLS_REJECT_UNAUTHORIZED
if (process.env.VERCEL) {
  // Disable SSL validation when running on Vercel
  // WARNING: This is not ideal, but a temporary solution for cloud DB connectivity
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
//
// Learn more: 
// https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || 
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma 