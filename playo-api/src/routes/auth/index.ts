import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
    verifyGoogleToken,
    verifyGoogleAccessToken,
    upsertUser,
} from '../../services/auth.service'

const GoogleIdTokenBody = z.object({ idToken: z.string().min(1) })
const GoogleAccessTokenBody = z.object({ accessToken: z.string().min(1) })

export async function authRoutes(app: FastifyInstance) {
    // POST /auth/google — verify Google ID token
    app.post('/google', async (req, reply) => {
        const { idToken } = GoogleIdTokenBody.parse(req.body)
        const googleUser = await verifyGoogleToken(idToken)
        if (!googleUser) return reply.unauthorized('Invalid Google token')

        const user = await upsertUser(app.prisma, googleUser)
        const token = app.jwt.sign({ sub: user.id, email: user.email, name: user.name })
        return reply.send({ token, user })
    })

    // POST /auth/google/token — verify via access token (web fallback)
    app.post('/google/token', async (req, reply) => {
        const { accessToken } = GoogleAccessTokenBody.parse(req.body)
        const googleUser = await verifyGoogleAccessToken(accessToken)
        if (!googleUser) return reply.unauthorized('Invalid access token')

        const user = await upsertUser(app.prisma, googleUser)
        const token = app.jwt.sign({ sub: user.id, email: user.email, name: user.name })
        return reply.send({ token, user })
    })
}