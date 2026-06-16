import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import { create } from 'zustand'
import { signInWithGoogle } from '../api/auth'
import type { AuthState } from '../types'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

// expo-secure-store is native only — fall back to localStorage on web
const storage = {
    async get(key: string): Promise<string | null> {
        if (Platform.OS === 'web') return localStorage.getItem(key)
        return SecureStore.getItemAsync(key)
    },
    async set(key: string, value: string): Promise<void> {
        if (Platform.OS === 'web') { localStorage.setItem(key, value); return }
        await SecureStore.setItemAsync(key, value)
    },
    async delete(key: string): Promise<void> {
        if (Platform.OS === 'web') { localStorage.removeItem(key); return }
        await SecureStore.deleteItemAsync(key)
    },
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    isLoading: false,

    signIn: async (idToken: string) => {
        set({ isLoading: true })
        try {
            const { token, user } = await signInWithGoogle(idToken)
            await storage.set(TOKEN_KEY, token)
            await storage.set(USER_KEY, JSON.stringify(user))
            set({ token, user, isLoading: false })
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