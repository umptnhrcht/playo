import type { FastifyInstance } from 'fastify'

export async function healthRoutes(app: FastifyInstance) {
    app.get('/health', async (req, reply) => {
        const checks: Record<string, string> = { api: 'ok' }

        try {
            await app.prisma.$queryRaw`SELECT 1`
            checks.postgres = 'ok'
        } catch {
            checks.postgres = 'error'
        }

        try {
            await app.redis.ping()
            checks.redis = 'ok'
        } catch {
            checks.redis = 'error'
        }

        const allOk = Object.values(checks).every((v) => v === 'ok')
        return reply.code(allOk ? 200 : 503).send({ status: allOk ? 'ok' : 'degraded', checks })
    })
}