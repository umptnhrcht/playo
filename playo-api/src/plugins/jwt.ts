import fp from 'fastify-plugin'
import fastifyJwt from '@fastify/jwt'
import type { FastifyRequest, FastifyReply } from 'fastify'

export const jwtPlugin = fp(async (app) => {
    await app.register(fastifyJwt, {
        secret: process.env.JWT_SECRET!,
        sign: { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' },
    })

    app.decorate('authenticate', async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            await req.jwtVerify()
        } catch {
            reply.unauthorized('Invalid or expired token')
        }
    })
})

declare module 'fastify' {
    interface FastifyInstance {
        authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
    }
}