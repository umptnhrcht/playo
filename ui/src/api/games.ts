import type { Game, GamesFilter, Sport } from '../types'
import { apiClient } from './client'

export interface CreateGameInput {
    title: string
    sport: Sport
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

export async function fetchGames(filter?: GamesFilter): Promise<{ games: Game[] }> {
    const params: Record<string, any> = {}

    if (filter?.sport && filter.sport !== 'ALL') params.sport = filter.sport
    if (filter?.skillLevel && filter.skillLevel !== 'ALL') params.skillLevel = filter.skillLevel
    if (filter?.areaTags?.length) params.areaTags = filter.areaTags.join(',')
    if (filter?.lat !== undefined) params.lat = filter.lat
    if (filter?.lng !== undefined) params.lng = filter.lng
    if (filter?.radius) params.radius = filter.radius
    if (filter?.date) params.date = filter.date

    const { data } = await apiClient.get<{ games: Game[] }>('/games', { params })
    return data
}

export async function createGame(input: CreateGameInput): Promise<{ game: Game }> {
    const { data } = await apiClient.post<{ game: Game }>('/games', input)
    return data
}