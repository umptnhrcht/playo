import fp from 'fastify-plugin'
import helmet from '@fastify/helmet'

export const helmetPlugin = fp(async (app) => {
    await app.register(helmet, {
        contentSecurityPolicy: process.env.NODE_ENV === 'production',
    })
})