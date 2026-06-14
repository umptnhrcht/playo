import fp from 'fastify-plugin'
import Redis from 'ioredis'

export const redisPlugin = fp(async (app) => {
    const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
    })

    await redis.connect()
    app.log.info('Redis connected')

    app.decorate('redis', redis)

    app.addHook('onClose', async () => {
        await redis.quit()
    })
})

declare module 'fastify' {
    interface FastifyInstance {
        redis: Redis
    }
}