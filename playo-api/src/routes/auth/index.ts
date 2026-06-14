import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { verifyGoogleToken, upsertUser } from '../../services/auth.service'

const GoogleBody = z.object({ idToken: z.string().min(1) })

export async function authRoutes(app: FastifyInstance) {
    // POST /auth/google  — exchange Google ID token for a Playo JWT
    app.post('/google', async (req, reply) => {
        const { idToken } = GoogleBody.parse(req.body)

        const googleUser = await verifyGoogleToken(idToken)
        if (!googleUser) return reply.unauthorized('Invalid Google token')

        const user = await upsertUser(app.prisma, googleUser)
        const token = app.jwt.sign({ sub: user.id, email: user.email, name: user.name })

        return reply.send({ token, user })
    })
}