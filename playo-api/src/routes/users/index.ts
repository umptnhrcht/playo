import type { User } from '@prisma/client'
import type { FastifyInstance } from 'fastify'

// JWT payload shape
export interface JwtPayload {
    sub: string   // user.id
    email: string
    name: string
}

// Augment @fastify/jwt's payload type — this is the correct extension point
declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: JwtPayload   // what you pass to jwt.sign()
        user: JwtPayload      // what req.user resolves to after jwtVerify()
    }
}

export type SafeUser = Pick<User, 'id' | 'email' | 'name' | 'avatar'>



export async function userRoutes(app: FastifyInstance) {
    // All user routes require auth
    app.addHook('preHandler', app.authenticate)

    // GET /users/me — return the current user's profile from DB
    app.get('/me', async (req, reply) => {
        const user = await app.prisma.user.findUnique({
            where: { id: req.user.sub },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                createdAt: true,
            },
        })

        if (!user) return reply.notFound('User not found')
        return reply.send({ user })
    })

    // PATCH /users/me — update name or avatar
    app.patch('/me', async (req, reply) => {
        const { name, avatar } = req.body as { name?: string; avatar?: string }

        if (!name && !avatar) {
            return reply.badRequest('Provide at least one field to update')
        }

        const user = await app.prisma.user.update({
            where: { id: req.user.sub },
            data: {
                ...(name && { name }),
                ...(avatar && { avatar }),
            },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
            },
        })

        return reply.send({ user })
    })
}