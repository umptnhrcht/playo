import type { PrismaClient } from '@prisma/client'

// ── Haversine radius query (km) ───────────────────────────────
// Returns a Prisma `where` clause fragment filtering by distance
export function haversineFilter(lat: number, lng: number, radiusKm: number) {
    // Bounding box pre-filter — cheap, cuts most rows before haversine
    const latDelta = radiusKm / 111
    const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180))

    return {
        lat: { gte: lat - latDelta, lte: lat + latDelta },
        lng: { gte: lng - lngDelta, lte: lng + lngDelta },
    }
}

// True haversine distance in km between two points
export function haversineKm(
    lat1: number, lng1: number,
    lat2: number, lng2: number
): number {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── Shared select ─────────────────────────────────────────────
export const gameSelect = {
    id: true,
    title: true,
    sport: true,
    venue: true,
    lat: true,
    lng: true,
    placeId: true,
    areaTags: true,
    scheduledAt: true,
    maxSlots: true,
    skillLevel: true,
    status: true,
    description: true,
    hostId: true,
    createdAt: true,
    host: {
        select: { id: true, name: true, avatar: true },
    },
    participants: {
        where: { status: 'CONFIRMED' as const },
        select: {
            id: true,
            userId: true,
            status: true,
            user: { select: { id: true, name: true, avatar: true } },
        },
        take: 10,
    },
    _count: {
        select: { participants: true },
    },
} as const

// ── Types ─────────────────────────────────────────────────────
export interface CreateGameInput {
    title: string
    sport: string
    venue: string
    lat?: number
    lng?: number
    placeId?: string
    areaTags?: string[]
    scheduledAt: string
    maxSlots: number
    skillLevel?: string
    description?: string
}

export interface ListGamesFilter {
    sport?: string
    date?: string
    skillLevel?: string
    areaTags?: string[]
    lat?: number
    lng?: number
    radiusKm?: number
}

// ── Service functions ─────────────────────────────────────────
export async function createGame(
    prisma: PrismaClient,
    hostId: string,
    input: CreateGameInput
) {
    return prisma.game.create({
        data: {
            title: input.title,
            sport: input.sport as any,
            venue: input.venue,
            lat: input.lat,
            lng: input.lng,
            placeId: input.placeId,
            areaTags: input.areaTags ?? [],
            scheduledAt: new Date(input.scheduledAt),
            maxSlots: input.maxSlots,
            skillLevel: (input.skillLevel as any) ?? 'ALL',
            description: input.description,
            hostId,
        },
        select: gameSelect,
    })
}

export async function listGames(
    prisma: PrismaClient,
    filter?: ListGamesFilter
) {
    const now = new Date()

    // Build where clause
    const where: any = {
        scheduledAt: { gte: now },
        status: { in: ['OPEN', 'FULL'] },
    }

    if (filter?.sport) where.sport = filter.sport
    if (filter?.skillLevel) where.skillLevel = filter.skillLevel

    // Area tags filter — game must have ALL requested tags
    if (filter?.areaTags?.length) {
        where.areaTags = { hasEvery: filter.areaTags }
    }

    // Date filter — games on a specific day
    if (filter?.date) {
        const start = new Date(filter.date)
        const end = new Date(start.getTime() + 86_400_000)
        where.scheduledAt = { gte: start, lt: end }
    }

    // Geo bounding box pre-filter
    if (filter?.lat !== undefined && filter?.lng !== undefined && filter?.radiusKm) {
        const bbox = haversineFilter(filter.lat, filter.lng, filter.radiusKm)
        where.lat = bbox.lat
        where.lng = bbox.lng
    }

    const games = await prisma.game.findMany({
        where,
        orderBy: { scheduledAt: 'asc' },
        select: gameSelect,
        take: 100,
    })

    // Post-filter: precise haversine check (bounding box includes corners outside radius)
    if (filter?.lat !== undefined && filter?.lng !== undefined && filter?.radiusKm) {
        return games.filter((g) => {
            if (!g.lat || !g.lng) return false
            return haversineKm(filter.lat!, filter.lng!, g.lat, g.lng) <= filter.radiusKm!
        })
    }

    return games
}

export async function getGame(prisma: PrismaClient, id: string) {
    return prisma.game.findUnique({
        where: { id },
        select: gameSelect,
    })
}