import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { autocompletePlaces, getPlaceDetail } from '../../services/places.service'

const AutocompleteQuery = z.object({
    input: z.string().min(1).max(200),
    sessionToken: z.string().uuid(),
})

const DetailQuery = z.object({
    placeId: z.string().min(1),
    sessionToken: z.string().uuid(),
})

export async function placesRoutes(app: FastifyInstance) {
    // Auth required — prevents API key abuse from unauthenticated callers
    app.addHook('preHandler', app.authenticate)

    // GET /places/autocomplete?input=Kanteerava&sessionToken=<uuid>
    app.get('/autocomplete', async (req, reply) => {
        const query = AutocompleteQuery.safeParse(req.query)
        if (!query.success) return reply.badRequest(query.error.issues[0]?.message)

        const predictions = await autocompletePlaces(query.data.input, query.data.sessionToken)
        return reply.send({ predictions })
    })

    // GET /places/detail?placeId=ChIJ...&sessionToken=<uuid>
    app.get('/detail', async (req, reply) => {
        const query = DetailQuery.safeParse(req.query)
        if (!query.success) return reply.badRequest(query.error.issues[0]?.message)

        const place = await getPlaceDetail(query.data.placeId, query.data.sessionToken)
        return reply.send({ place })
    })
}