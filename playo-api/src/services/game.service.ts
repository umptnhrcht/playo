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

// ── Join game ─────────────────────────────────────────────────
export type JoinResult =
    | { status: 'CONFIRMED'; participant: any }
    | { status: 'WAITLISTED'; participant: any }
    | { status: 'ALREADY_JOINED' }
    | { status: 'HOST_CANNOT_JOIN' }
    | { status: 'GAME_UNAVAILABLE' }

export async function joinGame(
    prisma: PrismaClient,
    gameId: string,
    userId: string
): Promise<JoinResult> {
    // Fetch game with confirmed participant count
    const game = await prisma.game.findUnique({
        where: { id: gameId },
        select: {
            id: true,
            hostId: true,
            status: true,
            maxSlots: true,
            _count: { select: { participants: { where: { status: 'CONFIRMED' } } } },
        },
    })

    if (!game || game.status === 'CANCELLED' || game.status === 'COMPLETED') {
        return { status: 'GAME_UNAVAILABLE' }
    }

    if (game.hostId === userId) {
        return { status: 'HOST_CANNOT_JOIN' }
    }

    // Check if already joined
    const existing = await prisma.gameParticipant.findUnique({
        where: { gameId_userId: { gameId, userId } },
    })

    if (existing && existing.status !== 'CANCELLED') {
        return { status: 'ALREADY_JOINED' }
    }

    const confirmedCount = game._count.participants
    const isFull = confirmedCount >= game.maxSlots
    const joinStatus = isFull ? 'WAITLISTED' : 'CONFIRMED'

    // Upsert — handles re-joining after cancellation
    const participant = await prisma.gameParticipant.upsert({
        where: { gameId_userId: { gameId, userId } },
        update: { status: joinStatus, joinedAt: new Date() },
        create: { gameId, userId, status: joinStatus },
        select: { id: true, status: true, joinedAt: true },
    })

    // If now full, update game status
    if (!isFull && confirmedCount + 1 >= game.maxSlots) {
        await prisma.game.update({
            where: { id: gameId },
            data: { status: 'FULL' },
        })
    }

    return { status: joinStatus, participant }
}

// ── Leave game ────────────────────────────────────────────────
export type LeaveResult =
    | { status: 'LEFT'; promoted?: any }
    | { status: 'NOT_JOINED' }
    | { status: 'HOST_CANNOT_LEAVE' }

export async function leaveGame(
    prisma: PrismaClient,
    gameId: string,
    userId: string
): Promise<LeaveResult> {
    const game = await prisma.game.findUnique({
        where: { id: gameId },
        select: { hostId: true, status: true },
    })

    if (!game) return { status: 'NOT_JOINED' }
    if (game.hostId === userId) return { status: 'HOST_CANNOT_LEAVE' }

    const participant = await prisma.gameParticipant.findUnique({
        where: { gameId_userId: { gameId, userId } },
    })

    if (!participant || participant.status === 'CANCELLED') {
        return { status: 'NOT_JOINED' }
    }

    const wasConfirmed = participant.status === 'CONFIRMED'

    // Cancel the participant
    await prisma.gameParticipant.update({
        where: { gameId_userId: { gameId, userId } },
        data: { status: 'CANCELLED' },
    })

    let promoted: any = null

    // If they were confirmed, promote first waitlisted player
    if (wasConfirmed) {
        const nextWaitlisted = await prisma.gameParticipant.findFirst({
            where: { gameId, status: 'WAITLISTED' },
            orderBy: { joinedAt: 'asc' },
        })

        if (nextWaitlisted) {
            promoted = await prisma.gameParticipant.update({
                where: { id: nextWaitlisted.id },
                data: { status: 'CONFIRMED' },
                select: { id: true, userId: true, status: true },
            })
        }

        // Re-open game if it was full
        if (game.status === 'FULL' && !promoted) {
            await prisma.game.update({
                where: { id: gameId },
                data: { status: 'OPEN' },
            })
        }
    }

    return { status: 'LEFT', promoted }
}
