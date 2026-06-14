import type { User } from '@prisma/client'

// JWT payload shape
export interface JwtPayload {
    sub: string   // user.id
    email: string
    name: string
}

// Extend Fastify request with typed user
declare module 'fastify' {
    interface FastifyRequest {
        user: JwtPayload
    }
}

export type SafeUser = Pick<User, 'id' | 'email' | 'name' | 'avatar'>