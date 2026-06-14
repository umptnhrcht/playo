import fp from 'fastify-plugin'
import cors from '@fastify/cors'

export const corsPlugin = fp(async (app) => {
    await app.register(cors, {
        origin: process.env.NODE_ENV === 'production'
            ? ['https://playo.co', 'https://app.playo.co']
            : true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        credentials: true,
    })
})