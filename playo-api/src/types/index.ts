import type { User } from '@prisma/client'

// JWT payload shape
export interface JwtPayload {
    sub: string   // user.id
    email: string
    name: string
}

declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: JwtPayload; // This types the token payload itself
        user: JwtPayload;    // This types request.user
    }
}

export type SafeUser = Pick<User, 'id' | 'email' | 'name' | 'avatar'>