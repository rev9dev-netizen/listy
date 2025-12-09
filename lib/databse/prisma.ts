import { PrismaClient } from '@prisma/client'

// Prevent multiple PrismaClient instances in dev/hot-reload
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

// Debug: Log the DATABASE_URL being used (hide password)
if (process.env.NODE_ENV === 'development') {
    const dbUrl = process.env.DATABASE_URL || 'NOT SET'
    const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@')
    console.log('🔗 Prisma connecting with:', maskedUrl)
}

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        datasourceUrl: process.env.DATABASE_URL,
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

