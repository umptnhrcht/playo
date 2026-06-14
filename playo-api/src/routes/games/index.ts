import type { FastifyInstance } from 'fastify'

export async function gameRoutes(app: FastifyInstance) {
    // All game routes require auth
    app.addHook('preHandler', app.authenticate)

    app.get('/', async (req) => {
        return { games: [], message: 'Game routes — coming in Phase 2' }
    })
}