import type { Game, Sport } from '../types'
import { apiClient } from './client'

export interface GamesFilter {
    sport?: Sport
    date?: string
}

export interface CreateGameInput {
    title: string
    sport: Sport
    venue: string
    scheduledAt: string   // ISO string
    maxSlots: number
    description?: string
}

export async function fetchGames(filter?: GamesFilter): Promise<{ games: Game[] }> {
    const { data } = await apiClient.get<{ games: Game[] }>('/games', { params: filter })
    return data
}

export async function createGame(input: CreateGameInput): Promise<{ game: Game }> {
    const { data } = await apiClient.post<{ game: Game }>('/games', input)
    return data
}