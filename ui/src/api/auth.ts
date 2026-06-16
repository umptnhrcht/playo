import type { User } from '../types'
import { apiClient } from './client'

interface AuthResponse {
    token: string
    user: User
}

export async function signInWithGoogle(idToken: string): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/auth/google', { idToken })
    return data
}

export async function signInWithGoogleAccessToken(accessToken: string): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/auth/google/token', { accessToken })
    return data
}