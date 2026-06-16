import axios from 'axios'
import { storage } from '../utils/storage'

export const apiClient = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000',
    timeout: 10_000,
    headers: { 'Content-Type': 'application/json' },
})

// Attach JWT on every request
apiClient.interceptors.request.use(async (config) => {
    const token = await storage.get('auth_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// Auto sign-out on 401
apiClient.interceptors.response.use(
    (res) => res,
    async (error) => {
        if (error.response?.status === 401) {
            await storage.delete('auth_token')
        }
        return Promise.reject(error)
    }
)