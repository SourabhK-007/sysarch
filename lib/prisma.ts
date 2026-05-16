import { PrismaClient } from './generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { withAccelerate } from '@prisma/extension-accelerate'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

const createPrismaClient = () => {
  if (connectionString.startsWith('prisma+postgres://') || connectionString.startsWith('prisma://')) {
    return new PrismaClient({
      accelerateUrl: connectionString,
    }).$extends(withAccelerate())
  } else {
    // If not using Accelerate, we use the driver adapter
    // It's safer to use pg's Pool directly with PrismaPg as per Prisma adapter docs
    const pool = new Pool({ connectionString })
    const adapter = new PrismaPg(pool)
    return new PrismaClient({ adapter }).$extends(withAccelerate())
  }
}

type PrismaClientSingleton = ReturnType<typeof createPrismaClient>

const globalForPrisma = globalThis as unknown as { prisma: PrismaClientSingleton | undefined }

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
