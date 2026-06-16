import type { User } from '../types'
import { apiClient } from './client'

interface GoogleSignInResponse {
    token: string
    user: User
}

export async function signInWithGoogle(idToken: string): Promise<GoogleSignInResponse> {
    const { data } = await apiClient.post<GoogleSignInResponse>('/auth/google', { idToken })
    return data
}
