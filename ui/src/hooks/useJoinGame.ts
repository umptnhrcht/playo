import { useState } from 'react'
import { apiClient } from '../api/client'
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
    userName: string | undefined,
    onUpdate: (updatedGame: Partial<Game>) => void
): UseJoinGameResult {
    const [isJoining, setIsJoining] = useState(false)
    const [isLeaving, setIsLeaving] = useState(false)

    const myParticipant = game.participants.find((p) => p.userId === userId)
    const joinStatus = myParticipant?.status ?? null

    // Refetch full game to get accurate participant list
    async function refetchGame() {
        try {
            const { data } = await apiClient.get<{ game: Game }>(`/games/${game.id}`)
            onUpdate(data.game)
        } catch {
            // optimistic update stays if refetch fails
        }
    }

    async function handleJoin() {
        if (!userId) return
        setIsJoining(true)
        try {
            const result = await joinGame(game.id)
            // Optimistic update first for instant feedback
            onUpdate({
                status: result.status === 'WAITLISTED' ? 'FULL' : game.status,
                participants: [
                    ...game.participants,
                    {
                        id: result.participant.id,
                        userId,
                        status: result.status,
                        user: { id: userId, name: userName ?? '', avatar: undefined },
                    },
                ],
                _count: { participants: game._count.participants + 1 },
            })
            // Then refetch to get accurate data (correct name, avatar etc)
            await refetchGame()
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
            // Optimistic update
            onUpdate({
                status: 'OPEN',
                participants: game.participants.filter((p) => p.userId !== userId),
                _count: { participants: Math.max(0, game._count.participants - 1) },
            })
            // Refetch to get accurate slot/waitlist state
            await refetchGame()
        } finally {
            setIsLeaving(false)
        }
    }

    return {
        isJoining,
        isLeaving,
        joinStatus: joinStatus as ParticipantStatus | null,
        handleJoin,
        handleLeave,
    }
}