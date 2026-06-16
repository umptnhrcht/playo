export interface User {
    id: string
    email: string
    name: string
    avatar?: string
}

export interface AuthState {
    user: User | null
    token: string | null
    isLoading: boolean
    signIn: (idToken: string) => Promise<void>
    signOut: () => Promise<void>
    hydrate: () => Promise<void>
}
