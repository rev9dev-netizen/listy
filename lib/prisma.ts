// Temporary mock until Prisma engines download successfully
// import { PrismaClient } from '@prisma/client'

// Mock Prisma Client for development
const mockPrismaClient = {
    user: {
        findUnique: async () => null,
        findFirst: async () => null,
        create: async (data: unknown) => data,
        update: async (data: unknown) => data,
    },
    project: {
        findFirst: async () => null,
        findMany: async () => [],
        create: async (data: unknown) => data,
        update: async (data: unknown) => data,
        deleteMany: async () => ({ count: 0 }),
    },
    keyword: {
        findMany: async () => [],
        create: async (data: unknown) => data,
        createMany: async () => ({ count: 0 }),
        deleteMany: async () => ({ count: 0 }),
    },
    draft: {
        findFirst: async () => null,
        findMany: async () => [],
        create: async (data: unknown) => data,
    },
    constraint: {
        create: async (data: unknown) => data,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any

const globalForPrisma = globalThis as unknown as {
    prisma: typeof mockPrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? mockPrismaClient

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
