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
    signInWithAccessToken: (idToken: string) => Promise<void>
    signOut: () => Promise<void>
    hydrate: () => Promise<void>
}

export type Sport =
    | 'CRICKET'
    | 'FOOTBALL'
    | 'BADMINTON'
    | 'TENNIS'
    | 'BASKETBALL'
    | 'PICKLEBALL'
    | 'OTHER'

export type GameStatus = 'OPEN' | 'FULL' | 'CANCELLED' | 'COMPLETED'

export type ParticipantStatus = 'CONFIRMED' | 'WAITLISTED' | 'CANCELLED'

export interface GameParticipant {
    id: string
    userId: string
    status: ParticipantStatus
    user: Pick<User, 'id' | 'name' | 'avatar'>
}

export interface Game {
    id: string
    title: string
    sport: Sport
    venue: string
    scheduledAt: string   // ISO string
    maxSlots: number
    status: GameStatus
    description?: string
    hostId: string
    host: Pick<User, 'id' | 'name' | 'avatar'>
    participants: GameParticipant[]
    _count: { participants: number }
}