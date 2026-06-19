import { useState } from 'react'
import { joinGame, leaveGame } from '../api/games'
import type { Game, ParticipantStatus } from '../types'

interface UseJoinGameResult {
    isJoining: boolean
    isLeaving: boolean
    joinStatus: ParticipantStatus | null
    handleJoin: () => Promise<any>
    handleLeave: () => Promise<void>
}

export function useJoinGame(
    game: Game,
    userId: string | undefined,
    onUpdate: (updatedGame: Partial<Game>) => void
): UseJoinGameResult {
    const [isJoining, setIsJoining] = useState(false)
    const [isLeaving, setIsLeaving] = useState(false)

    // Derive current join status from participants list
    const myParticipant = game.participants.find((p) => p.userId === userId)
    const joinStatus = myParticipant?.status ?? null

    async function handleJoin() {
        if (!userId) return
        setIsJoining(true)
        try {
            const result = await joinGame(game.id)
            // Optimistically update participant list
            onUpdate({
                status: result.status === 'WAITLISTED' ? 'FULL' : game.status,
                participants: [
                    ...game.participants,
                    { id: result.participant.id, userId, status: result.status, user: { id: userId, name: '', avatar: undefined } },
                ],
                _count: { participants: game._count.participants + 1 },
            })
            return result
        } finally {
            setIsJoining(false)
        }
    }

    async function handleLeave() {
        if (!userId) return
        setIsLeaving(true)
        try {
            await leaveGame(game.id)
            onUpdate({
                status: 'OPEN',
                participants: game.participants.filter((p) => p.userId !== userId),
                _count: { participants: Math.max(0, game._count.participants - 1) },
            })
        } finally {
            setIsLeaving(false)
        }
    }

    return { isJoining, isLeaving, joinStatus: joinStatus as ParticipantStatus | null, handleJoin, handleLeave }
}
