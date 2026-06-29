import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { apiClient } from '../../api/client'
import { useJoinGame } from '../../hooks/useJoinGame'
import { useAuthStore } from '../../store/authStore'
import { radius, spacing } from '../../theme'
import { useTheme } from '../../theme/ThemeContext'
import type { Game } from '../../types'

const SPORT_ICON: Record<string, string> = {
    FOOTBALL: '⚽',
    BADMINTON: '🏸',
    CRICKET: '🏏',
    TENNIS: '🎾',
    BASKETBALL: '🏀',
    PICKLEBALL: '🏓',
    OTHER: '🏅',
}

const SKILL_LABEL: Record<string, string> = {
    ALL: 'All levels',
    BEGINNER: 'Beginner',
    INTERMEDIATE: 'Intermediate',
    PRO: 'Pro',
}

const AV_BG = ['#CECBF6', '#9FE1CB', '#F5C4B3', '#B5D4F4']
const AV_FG = ['#26215C', '#04342C', '#4A1B0C', '#042C53']

// ── Participant row ───────────────────────────────────────────
function ParticipantRow({ name, status, index, isHost, colors }: {
    name: string; status: string; index: number; isHost: boolean; colors: any
}) {
    const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    const bg = AV_BG[index % 4]
    const fg = AV_FG[index % 4]

    return (
        <View style={[s.participantRow, { borderBottomColor: colors.border }]}>
            <View style={[s.participantAvatar, { backgroundColor: bg }]}>
                <Text style={[s.participantInitials, { color: fg }]}>{initials}</Text>
            </View>
            <Text style={[s.participantName, { color: colors.textPrimary }]}>{name}</Text>
            <View style={s.participantBadges}>
                {isHost && (
                    <View style={[s.badge, { backgroundColor: colors.brandLight }]}>
                        <Text style={[s.badgeText, { color: colors.brand }]}>Host</Text>
                    </View>
                )}
                {status === 'WAITLISTED' && (
                    <View style={[s.badge, { backgroundColor: '#FAEEDA' }]}>
                        <Text style={[s.badgeText, { color: '#633806' }]}>Waitlist</Text>
                    </View>
                )}
            </View>
        </View>
    )
}

// ── Join button ───────────────────────────────────────────────
function JoinButton({ game, userId, userName, onUpdate, colors }: {
    game: Game; userId: string | undefined; userName: string | undefined; onUpdate: (u: Partial<Game>) => void; colors: any
}) {
    const { isJoining, isLeaving, joinStatus, handleJoin, handleLeave } = useJoinGame(game, userId, userName, onUpdate)

    const isHost = game.hostId === userId

    if (isHost) {
        return (
            <View style={[s.hostBadge, { backgroundColor: colors.brandLight }]}>
                <Text style={[s.hostBadgeText, { color: colors.brand }]}>You are hosting this game</Text>
            </View>
        )
    }

    if (game.status === 'CANCELLED') {
        return (
            <View style={[s.joinBtn, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={[s.joinBtnText, { color: colors.textSecondary }]}>Game cancelled</Text>
            </View>
        )
    }

    if (joinStatus === 'CONFIRMED') {
        return (
            <Pressable
                style={[s.leaveBtn, { borderColor: colors.danger }]}
                onPress={() => {
                    Alert.alert('Leave game', 'Are you sure you want to leave?', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Leave', style: 'destructive', onPress: handleLeave },
                    ])
                }}
                disabled={isLeaving}
            >
                {isLeaving
                    ? <ActivityIndicator color={colors.danger} />
                    : <Text style={[s.leaveBtnText, { color: colors.danger }]}>Leave game</Text>
                }
            </Pressable>
        )
    }

    if (joinStatus === 'WAITLISTED') {
        return (
            <Pressable
                style={[s.leaveBtn, { borderColor: colors.textSecondary }]}
                onPress={() => {
                    Alert.alert('Leave waitlist', 'Remove yourself from the waitlist?', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Remove', style: 'destructive', onPress: handleLeave },
                    ])
                }}
                disabled={isLeaving}
            >
                {isLeaving
                    ? <ActivityIndicator color={colors.textSecondary} />
                    : <Text style={[s.leaveBtnText, { color: colors.textSecondary }]}>Leave waitlist</Text>
                }
            </Pressable>
        )
    }

    const label = game.status === 'FULL' ? 'Join waitlist' : 'Join game'
    const btnColor = game.status === 'FULL' ? colors.textSecondary : colors.brand
    const btnBg = game.status === 'FULL' ? colors.surface : colors.brand

    return (
        <Pressable
            style={[s.joinBtn, { backgroundColor: btnBg, borderColor: btnColor }]}
            onPress={async () => {
                try {
                    await handleJoin()
                } catch (err: any) {
                    const msg = err?.response?.data?.message ?? 'Could not join. Please try again.'
                    Alert.alert('Error', msg)
                }
            }}
            disabled={isJoining}
        >
            {isJoining
                ? <ActivityIndicator color={game.status === 'FULL' ? colors.textSecondary : '#fff'} />
                : <Text style={[s.joinBtnText, { color: game.status === 'FULL' ? colors.textSecondary : '#fff' }]}>
                    {label}
                </Text>
            }
        </Pressable>
    )
}

// ── Main screen ───────────────────────────────────────────────
export default function GameDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>()
    const router = useRouter()
    const { colors } = useTheme()
    const { user } = useAuthStore()

    const [game, setGame] = useState<Game | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!id) return
        setIsLoading(true)
        apiClient.get<{ game: Game }>(`/games/${id}`)
            .then(({ data }) => setGame(data.game))
            .catch(() => setError('Could not load game. Please try again.'))
            .finally(() => setIsLoading(false))
    }, [id])

    function handleGameUpdate(update: Partial<Game>) {
        setGame((prev) => {
            if (!prev) return prev
            // If full game object returned from refetch, replace entirely
            if ((update as Game).id) return update as Game
            return { ...prev, ...update }
        })
    }

    if (isLoading) {
        return (
            <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
                <View style={s.centered}>
                    <ActivityIndicator color={colors.brand} size="large" />
                </View>
            </SafeAreaView>
        )
    }

    if (error || !game) {
        return (
            <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
                <View style={s.centered}>
                    <Text style={[s.errorText, { color: colors.danger }]}>{error ?? 'Game not found'}</Text>
                    <Pressable onPress={() => router.back()} style={[s.backPill, { borderColor: colors.border }]}>
                        <Text style={[s.backPillText, { color: colors.textSecondary }]}>← Go back</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        )
    }

    const confirmedParticipants = game.participants.filter((p) => p.status === 'CONFIRMED')
    const waitlistParticipants = game.participants.filter((p) => p.status === 'WAITLISTED')
    const slotsLeft = game.maxSlots - game._count.participants
    const isFull = game.status === 'FULL'

    const scheduledDate = new Date(game.scheduledAt).toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
    const scheduledTime = new Date(game.scheduledAt).toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: true,
    })

    return (
        <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
            {/* Header */}
            <View style={[s.header, { borderBottomColor: colors.border }]}>
                <Pressable onPress={() => router.back()} accessibilityRole="button">
                    <Text style={[s.backBtn, { color: colors.brand }]}>← Back</Text>
                </Pressable>
                <Text style={[s.sportIcon]}>{SPORT_ICON[game.sport] ?? '🏅'}</Text>
            </View>

            <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

                {/* Title + sport */}
                <View style={s.titleSection}>
                    <View style={[s.sportBadge, { backgroundColor: colors.brandLight }]}>
                        <Text style={[s.sportBadgeText, { color: colors.brand }]}>
                            {game.sport.charAt(0) + game.sport.slice(1).toLowerCase()}
                        </Text>
                    </View>
                    {game.skillLevel !== 'ALL' && (
                        <View style={[s.skillBadge, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                            <Text style={[s.skillBadgeText, { color: colors.textSecondary }]}>
                                {SKILL_LABEL[game.skillLevel]}
                            </Text>
                        </View>
                    )}
                    <Text style={[s.title, { color: colors.textPrimary }]}>{game.title}</Text>
                </View>

                {/* Info card */}
                <View style={[s.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <InfoRow icon="📅" label="Date" value={scheduledDate} colors={colors} />
                    <InfoRow icon="🕐" label="Time" value={scheduledTime} colors={colors} />
                    <InfoRow icon="📍" label="Venue" value={game.venue} colors={colors} />
                    <InfoRow
                        icon="👥"
                        label="Slots"
                        value={isFull ? 'Full — waitlist open' : slotsLeft + ' of ' + game.maxSlots + ' slots left'}
                        valueColor={isFull ? '#791F1F' : slotsLeft <= 2 ? '#633806' : '#27500A'}
                        colors={colors}
                        last
                    />
                </View>

                {/* Area tags */}
                {game.areaTags?.length > 0 && (
                    <View style={s.tagsRow}>
                        {game.areaTags.map((tag) => (
                            <View key={tag} style={[s.tag, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                                <Text style={[s.tagText, { color: colors.textSecondary }]}>{tag}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Description */}
                {game.description && (
                    <View style={s.section}>
                        <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>About this game</Text>
                        <Text style={[s.description, { color: colors.textSecondary }]}>{game.description}</Text>
                    </View>
                )}

                {/* Participants */}
                <View style={s.section}>
                    <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>
                        {'Players (' + confirmedParticipants.length + ')'}
                    </Text>
                    <View style={[s.participantList, { borderColor: colors.border }]}>
                        {/* Host always first */}
                        <ParticipantRow
                            name={game.host.name}
                            status="CONFIRMED"
                            index={0}
                            isHost
                            colors={colors}
                        />
                        {confirmedParticipants.map((p, i) => (
                            <ParticipantRow
                                key={p.id}
                                name={p.user.name}
                                status={p.status}
                                index={i + 1}
                                isHost={false}
                                colors={colors}
                            />
                        ))}
                        {confirmedParticipants.length === 0 && (
                            <View style={s.emptyParticipants}>
                                <Text style={[s.emptyText, { color: colors.textSecondary }]}>
                                    No players yet — be the first to join!
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Waitlist */}
                {waitlistParticipants.length > 0 && (
                    <View style={s.section}>
                        <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>
                            {'Waitlist (' + waitlistParticipants.length + ')'}
                        </Text>
                        <View style={[s.participantList, { borderColor: colors.border }]}>
                            {waitlistParticipants.map((p, i) => (
                                <ParticipantRow
                                    key={p.id}
                                    name={p.user.name}
                                    status={p.status}
                                    index={i}
                                    isHost={false}
                                    colors={colors}
                                />
                            ))}
                        </View>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Sticky join button */}
            <View style={[s.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
                <JoinButton
                    game={game}
                    userId={user?.id}
                    userName={user?.name}
                    onUpdate={handleGameUpdate}
                    colors={colors}
                />
            </View>
        </SafeAreaView>
    )
}

function InfoRow({ icon, label, value, valueColor, colors, last }: {
    icon: string; label: string; value: string
    valueColor?: string; colors: any; last?: boolean
}) {
    return (
        <View style={[s.infoRow, !last && { borderBottomWidth: 0.5, borderBottomColor: colors.border }]}>
            <Text style={s.infoIcon}>{icon}</Text>
            <View style={s.infoContent}>
                <Text style={[s.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
                <Text style={[s.infoValue, { color: valueColor ?? colors.textPrimary }]}>{value}</Text>
            </View>
        </View>
    )
}

const s = StyleSheet.create({
    safe: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 0.5 },
    backBtn: { fontSize: 15 },
    sportIcon: { fontSize: 24 },

    scroll: { padding: spacing.lg },

    titleSection: { marginBottom: spacing.lg },
    sportBadge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm, marginBottom: spacing.sm },
    sportBadgeText: { fontSize: 12, fontWeight: '500' },
    skillBadge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm, borderWidth: 0.5, marginBottom: spacing.sm },
    skillBadgeText: { fontSize: 12 },
    title: { fontSize: 22, fontWeight: '500', lineHeight: 30 },

    infoCard: { borderRadius: radius.lg, borderWidth: 0.5, marginBottom: spacing.lg, overflow: 'hidden' },
    infoRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
    infoIcon: { fontSize: 18, width: 28, textAlign: 'center' },
    infoContent: { flex: 1 },
    infoLabel: { fontSize: 11, fontWeight: '500', marginBottom: 2 },
    infoValue: { fontSize: 14 },

    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
    tag: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.pill, borderWidth: 0.5 },
    tagText: { fontSize: 12 },

    section: { marginBottom: spacing.lg },
    sectionTitle: { fontSize: 15, fontWeight: '500', marginBottom: spacing.md },
    description: { fontSize: 14, lineHeight: 22 },

    participantList: { borderWidth: 0.5, borderRadius: radius.lg, overflow: 'hidden' },
    participantRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md, borderBottomWidth: 0.5 },
    participantAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    participantInitials: { fontSize: 13, fontWeight: '500' },
    participantName: { flex: 1, fontSize: 14 },
    participantBadges: { flexDirection: 'row', gap: spacing.xs },
    badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
    badgeText: { fontSize: 11, fontWeight: '500' },
    emptyParticipants: { padding: spacing.lg, alignItems: 'center' },
    emptyText: { fontSize: 13 },

    // Footer
    footer: { padding: spacing.lg, borderTopWidth: 0.5 },
    joinBtn: { borderRadius: radius.md, paddingVertical: spacing.md + 2, alignItems: 'center', borderWidth: 0.5 },
    joinBtnText: { fontSize: 15, fontWeight: '500' },
    leaveBtn: { borderRadius: radius.md, paddingVertical: spacing.md + 2, alignItems: 'center', borderWidth: 0.5 },
    leaveBtnText: { fontSize: 15, fontWeight: '500' },
    hostBadge: { borderRadius: radius.md, paddingVertical: spacing.md + 2, alignItems: 'center' },
    hostBadgeText: { fontSize: 14, fontWeight: '500' },

    // Error / loading
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
    errorText: { fontSize: 14, textAlign: 'center' },
    backPill: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: 0.5 },
    backPillText: { fontSize: 14 },
})