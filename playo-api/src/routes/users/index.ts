import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { gameSelect } from '../../services/game.service.js'

const PatchBody = z.object({
    name: z.string().min(1).max(100).optional(),
    avatar: z.string().url().optional(),
})

export async function userRoutes(app: FastifyInstance) {
    app.addHook('preHandler', app.authenticate)

    // GET /users/me
    app.get('/me', async (req, reply) => {
        const user = await app.prisma.user.findUnique({
            where: { id: req.user.sub },
            select: { id: true, email: true, name: true, avatar: true, createdAt: true },
        })
        if (!user) return reply.notFound('User not found')
        return reply.send({ user })
    })

    // PATCH /users/me
    app.patch('/me', async (req, reply) => {
        const body = PatchBody.safeParse(req.body)
        if (!body.success) return reply.badRequest(body.error.issues[0]?.message)
        if (!body.data.name && !body.data.avatar) {
            return reply.badRequest('Provide at least one field to update')
        }
        const user = await app.prisma.user.update({
            where: { id: req.user.sub },
            data: body.data,
            select: { id: true, email: true, name: true, avatar: true },
        })
        return reply.send({ user })
    })

    // GET /users/me/games?role=joined|hosted
    app.get('/me/games', async (req, reply) => {
        const { role } = req.query as { role?: string }
        const userId = req.user.sub
        const now = new Date()

        if (role === 'hosted') {
            const games = await app.prisma.game.findMany({
                where: { hostId: userId, scheduledAt: { gte: now }, status: { not: 'CANCELLED' } },
                orderBy: { scheduledAt: 'asc' },
                select: gameSelect,
            })
            return reply.send({ games })
        }

        // Default: joined (confirmed or waitlisted, not hosted)
        const participations = await app.prisma.gameParticipant.findMany({
            where: {
                userId,
                status: { in: ['CONFIRMED', 'WAITLISTED'] },
                game: {
                    hostId: { not: userId },
                    scheduledAt: { gte: now },
                    status: { not: 'CANCELLED' },
                },
            },
            orderBy: { game: { scheduledAt: 'asc' } },
            select: { game: { select: gameSelect } },
        })

        return reply.send({ games: participations.map((p) => p.game) })
    })
}
