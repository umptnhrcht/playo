import fp from 'fastify-plugin'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'



export const prismaPlugin = fp(async (app) => {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
    const adapter = new PrismaPg(pool)

    const prisma = new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development'
            ? ['query', 'warn', 'error']
            : ['warn', 'error'],
    })

    await prisma.$connect()
    app.log.info('Postgres connected via Prisma')

    app.decorate('prisma', prisma)

    app.addHook('onClose', async () => {
        await prisma.$disconnect()
    })
});

declare module 'fastify' {
    interface FastifyInstance {
        prisma: PrismaClient
    }
}