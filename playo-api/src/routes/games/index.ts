import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { createGame, listGames, getGame } from '../../services/game.service.js'

// ── Validation schemas ────────────────────────────────────────
const SportEnum = z.enum(['CRICKET', 'FOOTBALL', 'BADMINTON', 'TENNIS', 'BASKETBALL', 'PICKLEBALL', 'OTHER'])
const SkillLevelEnum = z.enum(['ALL', 'BEGINNER', 'INTERMEDIATE', 'PRO'])

const CreateGameBody = z.object({
    title: z.string().min(3).max(100),
    sport: SportEnum,
    venue: z.string().min(3).max(200),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    placeId: z.string().optional(),
    areaTags: z.array(z.string().max(50)).max(5).optional(),
    scheduledAt: z.string().datetime(),
    maxSlots: z.number().int().min(2).max(100),
    skillLevel: SkillLevelEnum.optional(),
    description: z.string().max(500).optional(),
})

const ListGamesQuery = z.object({
    sport: SportEnum.optional(),
    date: z.string().optional(),
    skillLevel: SkillLevelEnum.optional(),
    areaTags: z.string().optional(),   // comma-separated e.g. "Indiranagar,Koramangala"
    lat: z.coerce.number().optional(),
    lng: z.coerce.number().optional(),
    radius: z.coerce.number().min(1).max(50).optional(),  // km
})

export async function gameRoutes(app: FastifyInstance) {
    app.addHook('preHandler', app.authenticate)

    // ── GET /games ────────────────────────────────────────────
    app.get('/', async (req, reply) => {
        const query = ListGamesQuery.safeParse(req.query)
        if (!query.success) return reply.badRequest(query.error.issues[0]?.message)

        const { sport, date, skillLevel, areaTags, lat, lng, radius } = query.data

        const games = await listGames(app.prisma, {
            sport,
            date,
            skillLevel,
            areaTags: areaTags ? areaTags.split(',').map((t) => t.trim()) : undefined,
            lat,
            lng,
            radiusKm: radius,
        })

        return reply.send({ games })
    })

    // ── POST /games ───────────────────────────────────────────
    app.post('/', async (req, reply) => {
        const body = CreateGameBody.safeParse(req.body)
        if (!body.success) return reply.badRequest(body.error.issues[0]?.message)

        if (new Date(body.data.scheduledAt) <= new Date()) {
            return reply.badRequest('scheduledAt must be in the future')
        }

        // Warn if venue provided but no coordinates
        if (body.data.venue && !body.data.lat) {
            app.log.warn('Game created without coordinates — radius search will not include this game')
        }

        const game = await createGame(app.prisma, req.user.sub, body.data)
        return reply.code(201).send({ game })
    })

    // ── GET /games/:id ────────────────────────────────────────
    app.get('/:id', async (req, reply) => {
        const { id } = req.params as { id: string }
        const game = await getGame(app.prisma, id)
        if (!game) return reply.notFound('Game not found')
        return reply.send({ game })
    })

    // ── DELETE /games/:id ─────────────────────────────────────
    app.delete('/:id', async (req, reply) => {
        const { id } = req.params as { id: string }
        const game = await getGame(app.prisma, id)
        if (!game) return reply.notFound('Game not found')
        if (game.hostId !== req.user.sub) return reply.forbidden('Only the host can cancel this game')

        await app.prisma.game.update({
            where: { id },
            data: { status: 'CANCELLED' },
        })

        return reply.send({ message: 'Game cancelled' })
    })
}