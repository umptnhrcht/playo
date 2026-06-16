import { create } from 'zustand'
import { signInWithGoogle, signInWithGoogleAccessToken } from '../api/auth'
import type { AuthState } from '../types'
import { storage } from '../utils/storage'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

async function persistAndSet(
    set: (state: Partial<AuthState>) => void,
    token: string,
    user: AuthState['user']
) {
    await storage.set(TOKEN_KEY, token)
    await storage.set(USER_KEY, JSON.stringify(user))
    set({ token, user, isLoading: false })
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    isLoading: false,

    signIn: async (idToken: string) => {
        set({ isLoading: true })
        try {
            const { token, user } = await signInWithGoogle(idToken)
            await persistAndSet(set, token, user)
        } catch (err) {
            set({ isLoading: false })
            throw err
        }
    },

    signInWithAccessToken: async (accessToken: string) => {
        set({ isLoading: true })
        try {
            const { token, user } = await signInWithGoogleAccessToken(accessToken)
            await persistAndSet(set, token, user)
        } catch (err) {
            set({ isLoading: false })
            throw err
        }
    },

    signOut: async () => {
        await storage.delete(TOKEN_KEY)
        await storage.delete(USER_KEY)
        set({ user: null, token: null })
    },

    hydrate: async () => {
        const token = await storage.get(TOKEN_KEY)
        const raw = await storage.get(USER_KEY)
        if (token && raw) {
            set({ token, user: JSON.parse(raw) })
        }
    },
}))