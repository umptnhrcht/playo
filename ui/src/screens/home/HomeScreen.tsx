import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fetchGames } from '../../api/games'
import { GameCard } from '../../components/GameCard'
import { SportFilter } from '../../components/SportFilter'
import { useAuthStore } from '../../store/authStore'
import { radius, spacing } from '../../theme'
import { useTheme } from '../../theme/ThemeContext'
import type { Game, Sport } from '../../types'

function isToday(iso: string) {
    const d = new Date(iso)
    const n = new Date()
    return d.getDate() === n.getDate() &&
        d.getMonth() === n.getMonth() &&
        d.getFullYear() === n.getFullYear()
}

// ── Section header ────────────────────────────────────────────
function SectionHeader({
    title,
    count,
    collapsible,
    collapsed,
    onToggle,
    colors,
}: {
    title: string
    count: number
    collapsible?: boolean
    collapsed?: boolean
    onToggle?: () => void
    colors: any
}) {
    return (
        <Pressable
            style={[s.sectionHeader, { backgroundColor: colors.background }]}
            onPress={collapsible ? onToggle : undefined}
            accessibilityRole={collapsible ? 'button' : undefined}
            accessibilityLabel={collapsible ? `${title}, ${collapsed ? 'expand' : 'collapse'}` : undefined}
        >
            <View style={s.sectionHeaderLeft}>
                <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
                <View style={[s.countBadge, { backgroundColor: colors.brandLight }]}>
                    <Text style={[s.countText, { color: colors.brand }]}>{count}</Text>
                </View>
            </View>
            {collapsible && (
                <Text style={[s.chevron, { color: colors.textSecondary }]}>
                    {collapsed ? '▶' : '▼'}
                </Text>
            )}
        </Pressable>
    )
}

// ── Divider ───────────────────────────────────────────────────
function Divider({ label, colors }: { label: string; colors: any }) {
    return (
        <View style={[s.dividerRow, { backgroundColor: colors.background }]}>
            <View style={[s.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[s.dividerLabel, { color: colors.textSecondary, backgroundColor: colors.background }]}>
                {label}
            </Text>
            <View style={[s.dividerLine, { backgroundColor: colors.border }]} />
        </View>
    )
}

// ── Empty placeholder ─────────────────────────────────────────
function EmptySection({ message, sub, colors }: { message: string; sub: string; colors: any }) {
    return (
        <View style={[s.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={s.emptyIcon}>🏟️</Text>
            <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>{message}</Text>
            <Text style={[s.emptySub, { color: colors.textSecondary }]}>{sub}</Text>
        </View>
    )
}

// ── Main screen ───────────────────────────────────────────────
export default function HomeScreen() {
    const router = useRouter()
    const { colors } = useTheme()
    const { user } = useAuthStore()

    const [allGames, setAllGames] = useState<Game[]>([])
    const [sport, setSport] = useState<Sport | 'ALL'>('ALL')
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [todayCollapsed, setTodayCollapsed] = useState(false)

    const loadGames = useCallback(async (refreshing = false) => {
        if (refreshing) setIsRefreshing(true)
        else setIsLoading(true)
        setError(null)
        try {
            const { games } = await fetchGames(sport !== 'ALL' ? { sport } : undefined)
            setAllGames(games)
        } catch {
            setError('Could not load games. Pull down to retry.')
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }, [sport])

    useEffect(() => { loadGames() }, [loadGames])

    const todayGames = allGames.filter((g) => isToday(g.scheduledAt))
    const upcomingGames = allGames.filter((g) => !isToday(g.scheduledAt))

    const initials = user?.name
        .split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'

    const dateLabel = new Date().toLocaleDateString('en-IN', {
        weekday: 'short', day: 'numeric', month: 'short',
    })

    function navigateToGame(g: Game) {
        router.push({ pathname: '/game/[id]', params: { id: g.id } })
    }

    return (
        <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
            {/* ── Sticky header + filters ──────────────────── */}
            <View style={{ backgroundColor: colors.background }}>
                <View style={s.header}>
                    <View>
                        <Text style={[s.heading, { color: colors.textPrimary }]}>Find a game</Text>
                        <Text style={[s.subheading, { color: colors.textSecondary }]}>Bengaluru · {dateLabel}</Text>
                    </View>
                    <Pressable
                        style={[s.avatar, { backgroundColor: colors.brandLight, borderColor: colors.border }]}
                        onPress={() => router.push('/(tabs)/profile')}
                        accessibilityLabel="Go to profile"
                        accessibilityRole="button"
                    >
                        <Text style={[s.avatarText, { color: colors.brandDark }]}>{initials}</Text>
                    </Pressable>
                </View>
                <SportFilter selected={sport} onChange={(s) => setSport(s)} />
            </View>

            {/* ── Content ──────────────────────────────────── */}
            {isLoading ? (
                <View style={s.centered}>
                    <ActivityIndicator color={colors.brand} size="large" />
                    <Text style={[s.loadingText, { color: colors.textSecondary }]}>Finding games…</Text>
                </View>
            ) : error ? (
                <View style={s.centered}>
                    <Text style={s.errorIcon}>⚠️</Text>
                    <Text style={[s.errorText, { color: colors.danger }]}>{error}</Text>
                </View>
            ) : (
                <FlatList
                    data={todayCollapsed ? upcomingGames : [...todayGames, ...upcomingGames]}
                    keyExtractor={(g) => g.id}
                    contentContainerStyle={s.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={() => loadGames(true)}
                            tintColor={colors.brand}
                        />
                    }
                    ListHeaderComponent={
                        <View>
                            {/* Today section header — always visible */}
                            <SectionHeader
                                title="Games today"
                                count={todayGames.length}
                                collapsible
                                collapsed={todayCollapsed}
                                onToggle={() => setTodayCollapsed((v) => !v)}
                                colors={colors}
                            />

                            {/* Today games or collapsed placeholder */}
                            {todayCollapsed ? null : todayGames.length === 0 ? (
                                <EmptySection
                                    message="No games today"
                                    sub="Check back later or create one!"
                                    colors={colors}
                                />
                            ) : (
                                todayGames.map((g) => (
                                    <GameCard key={g.id} game={g} onPress={navigateToGame} onJoin={navigateToGame} />
                                ))
                            )}

                            {/* Divider */}
                            <Divider label="Upcoming" colors={colors} />

                            {/* Upcoming header */}
                            <SectionHeader
                                title="Future games"
                                count={upcomingGames.length}
                                colors={colors}
                            />
                        </View>
                    }
                    renderItem={({ item }) => (
                        <GameCard game={item} onPress={navigateToGame} onJoin={navigateToGame} />
                    )}
                    ListEmptyComponent={
                        <EmptySection
                            message="No upcoming games"
                            sub="Be the first to create one!"
                            colors={colors}
                        />
                    }
                />
            )}

            {/* ── FAB ──────────────────────────────────────── */}
            <Pressable
                style={({ pressed }) => [
                    s.fab,
                    { backgroundColor: pressed ? colors.brandDark : colors.brand },
                ]}
                onPress={() => router.push('/games/create-game')}
                accessibilityLabel="Create a new game"
                accessibilityRole="button"
            >
                <Text style={s.fabIcon}>＋</Text>
            </Pressable>
        </SafeAreaView>
    )
}

const s = StyleSheet.create({
    safe: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
    heading: { fontSize: 22, fontWeight: '500' },
    subheading: { fontSize: 13, marginTop: 2 },
    avatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 0.5, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 13, fontWeight: '500' },

    list: { paddingHorizontal: spacing.lg, paddingBottom: 100 },

    // Section header
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md },
    sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    sectionTitle: { fontSize: 15, fontWeight: '500' },
    countBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
    countText: { fontSize: 11, fontWeight: '500' },
    chevron: { fontSize: 11 },

    // Divider
    dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm, marginBottom: spacing.xs },
    dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
    dividerLabel: { fontSize: 12, fontWeight: '500', paddingHorizontal: spacing.xs },

    // Empty
    emptyBox: { borderWidth: 0.5, borderRadius: radius.lg, borderStyle: 'dashed', padding: spacing.xl, alignItems: 'center', marginBottom: spacing.lg },
    emptyIcon: { fontSize: 32, marginBottom: spacing.md },
    emptyTitle: { fontSize: 15, fontWeight: '500', marginBottom: spacing.xs },
    emptySub: { fontSize: 13, textAlign: 'center' },

    // States
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
    loadingText: { fontSize: 13, marginTop: spacing.md },
    errorIcon: { fontSize: 32, marginBottom: spacing.md },
    errorText: { fontSize: 14, textAlign: 'center' },

    // FAB
    fab: { position: 'absolute', bottom: spacing.xxl, right: spacing.lg, width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6 },
    fabIcon: { fontSize: 24, color: '#FFFFFF', lineHeight: 28 },
})