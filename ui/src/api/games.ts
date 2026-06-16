import type { Game, Sport } from '../types'
import { apiClient } from './client'

export interface GamesFilter {
    sport?: Sport
    date?: string   // ISO date string
}

export interface GamesResponse {
    games: Game[]
}

export async function fetchGames(filter?: GamesFilter): Promise<GamesResponse> {
    const { data } = await apiClient.get<GamesResponse>('/games', { params: filter })
    return data
}