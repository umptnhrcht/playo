import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fetchGames } from '../../api/games'
import { DateStrip } from '../../components/DateStrip'
import { FilterSheet } from '../../components/FilterSheet'
import { GameCard } from '../../components/GameCard'
import { SportFilter } from '../../components/SportFilter'
import { useLocation } from '../../hooks/useLocation'
import { useAuthStore } from '../../store/authStore'
import { radius, spacing } from '../../theme'
import { useTheme } from '../../theme/ThemeContext'
import type { Game, GamesFilter, Sport } from '../../types'

function isToday(iso: string) {
    const d = new Date(iso)
    const n = new Date()
    return (
        d.getDate() === n.getDate() &&
        d.getMonth() === n.getMonth() &&
        d.getFullYear() === n.getFullYear()
    )
}

function isSameDay(iso: string, dateKey: string) {
    return iso.startsWith(dateKey)
}

// ── Section header ────────────────────────────────────────────
function SectionHeader({
    title, count, collapsible, collapsed, onToggle, colors,
}: {
    title: string; count: number; collapsible?: boolean
    collapsed?: boolean; onToggle?: () => void; colors: any
}) {
    return (
        <Pressable
            style={[s.sectionHeader, { backgroundColor: colors.background }]}
            onPress={collapsible ? onToggle : undefined}
            accessibilityRole={collapsible ? 'button' : undefined}
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

// ── Active filter summary ─────────────────────────────────────
function ActiveFilters({ filter, selectedDate, onClear, colors }: {
    filter: GamesFilter; selectedDate?: string; onClear: () => void; colors: any
}) {
    const parts: string[] = []
    if (filter.sport && filter.sport !== 'ALL') parts.push(filter.sport)
    if (filter.skillLevel && filter.skillLevel !== 'ALL') parts.push(filter.skillLevel)
    if (filter.areaTags?.length) parts.push(...filter.areaTags)
    if (filter.lat !== undefined) parts.push('Within ' + (filter.radius ?? 10) + 'km')
    if (selectedDate) parts.push(selectedDate)

    if (!parts.length) return null

    return (
        <View style={s.activeFiltersRow}>
            <Text style={[s.activeFilterText, { color: colors.textSecondary }]} numberOfLines={1}>
                {parts.join(' · ')}
            </Text>
            <Pressable onPress={onClear} accessibilityRole="button">
                <Text style={[s.clearFilters, { color: colors.danger }]}>✕ Clear</Text>
            </Pressable>
        </View>
    )
}

// ── Main screen ───────────────────────────────────────────────
export default function HomeScreen() {
    const router = useRouter()
    const { colors } = useTheme()
    const { user } = useAuthStore()
    const location = useLocation()

    const [allGames, setAllGames] = useState<Game[]>([])
    const [filter, setFilter] = useState<GamesFilter>({})
    const [sport, setSport] = useState<Sport | 'ALL'>('ALL')
    const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined)
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [todayCollapsed, setTodayCollapsed] = useState(false)
    const [showFilterSheet, setShowFilterSheet] = useState(false)

    const activeFilter: GamesFilter = {
        ...filter,
        sport: sport !== 'ALL' ? sport : filter.sport,
        date: selectedDate,
    }

    const loadGames = useCallback(async (refreshing = false) => {
        if (refreshing) setIsRefreshing(true)
        else setIsLoading(true)
        setError(null)
        try {
            const { games } = await fetchGames(activeFilter)
            setAllGames(games)
        } catch {
            setError('Could not load games. Pull down to retry.')
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }, [JSON.stringify(activeFilter)])

    useEffect(() => { loadGames() }, [loadGames])

    useEffect(() => {
        if (location.error) Alert.alert('Location', location.error)
    }, [location.error])

    async function handleNearMe(): Promise<{ lat: number; lng: number } | null> {
        const coords = await location.requestLocation()
        if (coords) {
            setFilter((prev) => ({ ...prev, lat: coords.lat, lng: coords.lng, radius: prev.radius ?? 10 }))
            return coords
        }
        return null
    }

    function toggleNearMe() {
        if (filter.lat !== undefined) {
            setFilter((prev) => ({ ...prev, lat: undefined, lng: undefined, radius: undefined }))
            location.clearLocation()
        } else {
            handleNearMe()
        }
    }

    function handleApplyFilter(newFilter: GamesFilter) {
        setFilter(newFilter)
        if (newFilter.sport) setSport(newFilter.sport)
    }

    function clearFilters() {
        setFilter({})
        setSport('ALL')
        setSelectedDate(undefined)
        location.clearLocation()
    }

    // When a specific date is selected, skip the today/upcoming split
    // and just show all games for that day
    const showDateView = selectedDate !== undefined

    const todayGames = allGames.filter((g) => isToday(g.scheduledAt))
    const upcomingGames = allGames.filter((g) => !isToday(g.scheduledAt))
    const dateGames = selectedDate
        ? allGames.filter((g) => isSameDay(g.scheduledAt, selectedDate))
        : []

    const hasActiveFilters =
        (filter.sport && filter.sport !== 'ALL') ||
        (filter.skillLevel && filter.skillLevel !== 'ALL') ||
        (filter.areaTags?.length ?? 0) > 0 ||
        filter.lat !== undefined ||
        selectedDate !== undefined

    const initials = user?.name
        .split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'

    const dateLabel = new Date().toLocaleDateString('en-IN', {
        weekday: 'short', day: 'numeric', month: 'short',
    })

    function navigateToGame(g: Game) {
        router.push({ pathname: '/game/[id]', params: { id: g.id } })
    }

    // ── Date-specific view (flat list, no sections) ───────────
    const renderDateView = () => (
        <FlatList
            data={dateGames}
            keyExtractor={(g) => g.id}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={() => loadGames(true)} tintColor={colors.brand} />
            }
            ListHeaderComponent={
                <SectionHeader
                    title={selectedDate === new Date().toISOString().split('T')[0] ? 'Today' : selectedDate!}
                    count={dateGames.length}
                    colors={colors}
                />
            }
            renderItem={({ item }) => (
                <GameCard game={item} onPress={navigateToGame} onJoin={navigateToGame} />
            )}
            ListEmptyComponent={
                <EmptySection
                    message="No games on this day"
                    sub={hasActiveFilters ? 'Try adjusting your filters' : 'Be the first to create one!'}
                    colors={colors}
                />
            }
        />
    )

    // ── Default view (today + upcoming sections) ──────────────
    const renderDefaultView = () => (
        <FlatList
            data={upcomingGames}
            keyExtractor={(g) => g.id}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={() => loadGames(true)} tintColor={colors.brand} />
            }
            ListHeaderComponent={
                <View>
                    <SectionHeader
                        title="Games today"
                        count={todayGames.length}
                        collapsible
                        collapsed={todayCollapsed}
                        onToggle={() => setTodayCollapsed((v) => !v)}
                        colors={colors}
                    />
                    {!todayCollapsed && (
                        todayGames.length === 0
                            ? <EmptySection message="No games today" sub="Check back later or create one!" colors={colors} />
                            : todayGames.map((g) => (
                                <GameCard key={g.id} game={g} onPress={navigateToGame} onJoin={navigateToGame} />
                            ))
                    )}
                    <Divider label="Upcoming" colors={colors} />
                    <SectionHeader title="Future games" count={upcomingGames.length} colors={colors} />
                </View>
            }
            renderItem={({ item }) => (
                <GameCard game={item} onPress={navigateToGame} onJoin={navigateToGame} />
            )}
            ListEmptyComponent={
                <EmptySection
                    message="No upcoming games"
                    sub={hasActiveFilters ? 'Try adjusting your filters' : 'Be the first to create one!'}
                    colors={colors}
                />
            }
        />
    )

    return (
        <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>

            {/* ── Sticky header ────────────────────────────────── */}
            <View style={{ backgroundColor: colors.background }}>
                <View style={s.header}>
                    <View>
                        <Text style={[s.heading, { color: colors.textPrimary }]}>Find a game</Text>
                        <Text style={[s.subheading, { color: colors.textSecondary }]}>Bengaluru · {dateLabel}</Text>
                    </View>
                    <View style={s.headerRight}>
                        <Pressable
                            style={[
                                s.filterBtn,
                                {
                                    backgroundColor: hasActiveFilters ? colors.brandLight : colors.surface,
                                    borderColor: hasActiveFilters ? colors.brand : colors.border,
                                },
                            ]}
                            onPress={() => setShowFilterSheet(true)}
                            accessibilityRole="button"
                            accessibilityLabel="Open filters"
                        >
                            <Text style={[s.filterBtnText, { color: hasActiveFilters ? colors.brand : colors.textSecondary }]}>
                                {'⚙ Filter' + (hasActiveFilters ? ' •' : '')}
                            </Text>
                        </Pressable>
                        <Pressable
                            style={[s.avatar, { backgroundColor: colors.brandLight, borderColor: colors.border }]}
                            onPress={() => router.push('/(tabs)/profile')}
                            accessibilityRole="button"
                        >
                            <Text style={[s.avatarText, { color: colors.brandDark }]}>{initials}</Text>
                        </Pressable>
                    </View>
                </View>

                {/* Sport quick-filter */}
                <SportFilter selected={sport} onChange={setSport} />

                {/* Near me quick toggle */}
                <View style={s.quickRow}>
                    <Pressable
                        style={[
                            s.quickPill,
                            {
                                backgroundColor: filter.lat !== undefined ? colors.brandLight : colors.surface,
                                borderColor: filter.lat !== undefined ? colors.brand : colors.border,
                            },
                        ]}
                        onPress={toggleNearMe}
                        accessibilityRole="switch"
                        accessibilityState={{ checked: filter.lat !== undefined }}
                    >
                        {location.isLocating
                            ? <ActivityIndicator size="small" color={colors.brand} style={{ marginRight: spacing.xs }} />
                            : <Text style={[s.quickPillIcon, { color: filter.lat !== undefined ? colors.brand : colors.textSecondary }]}>
                                📍
                            </Text>
                        }
                        <Text style={[s.quickPillText, { color: filter.lat !== undefined ? colors.brand : colors.textSecondary }]}>
                            {filter.lat !== undefined ? 'Within ' + (filter.radius ?? 10) + 'km' : 'Near me'}
                        </Text>
                    </Pressable>
                </View>

                {/* Date strip */}
                <DateStrip selected={selectedDate} onChange={setSelectedDate} />

                {/* Active filter summary */}
                {hasActiveFilters && (
                    <ActiveFilters
                        filter={filter}
                        selectedDate={selectedDate}
                        onClear={clearFilters}
                        colors={colors}
                    />
                )}
            </View>

            {/* ── Content ──────────────────────────────────────── */}
            {isLoading ? (
                <View style={s.centered}>
                    <ActivityIndicator color={colors.brand} size="large" />
                    <Text style={[s.loadingText, { color: colors.textSecondary }]}>Finding games…</Text>
                </View>
            ) : error ? (
                <View style={s.centered}>
                    <Text style={s.stateIcon}>⚠️</Text>
                    <Text style={[s.errorText, { color: colors.danger }]}>{error}</Text>
                </View>
            ) : showDateView ? renderDateView() : renderDefaultView()}

            {/* ── FAB ──────────────────────────────────────────── */}
            <Pressable
                style={({ pressed }) => [s.fab, { backgroundColor: pressed ? colors.brandDark : colors.brand }]}
                onPress={() => router.push('/games/create-game')}
                accessibilityLabel="Create a new game"
                accessibilityRole="button"
            >
                <Text style={s.fabIcon}>＋</Text>
            </Pressable>

            {/* ── Filter sheet ─────────────────────────────────── */}
            <FilterSheet
                visible={showFilterSheet}
                filter={filter}
                isLocating={location.isLocating}
                onApply={handleApplyFilter}
                onClose={() => setShowFilterSheet(false)}
                onNearMe={handleNearMe}
            />
        </SafeAreaView>
    )
}

const s = StyleSheet.create({
    safe: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
    heading: { fontSize: 22, fontWeight: '500' },
    subheading: { fontSize: 13, marginTop: 2 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    filterBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, borderRadius: radius.pill, borderWidth: 0.5 },
    filterBtnText: { fontSize: 13, fontWeight: '500' },
    avatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 0.5, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 13, fontWeight: '500' },
    activeFiltersRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
    activeFilterText: { fontSize: 12, flex: 1 },
    clearFilters: { fontSize: 12, fontWeight: '500', paddingLeft: spacing.sm },
    list: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md },
    sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    sectionTitle: { fontSize: 15, fontWeight: '500' },
    countBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
    countText: { fontSize: 11, fontWeight: '500' },
    chevron: { fontSize: 11 },
    dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm, marginBottom: spacing.xs },
    dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
    dividerLabel: { fontSize: 12, fontWeight: '500', paddingHorizontal: spacing.xs },
    emptyBox: { borderWidth: 0.5, borderRadius: radius.lg, borderStyle: 'dashed', padding: spacing.xl, alignItems: 'center', marginBottom: spacing.lg },
    emptyIcon: { fontSize: 32, marginBottom: spacing.md },
    emptyTitle: { fontSize: 15, fontWeight: '500', marginBottom: spacing.xs },
    emptySub: { fontSize: 13, textAlign: 'center' },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
    loadingText: { fontSize: 13, marginTop: spacing.md },
    stateIcon: { fontSize: 32, marginBottom: spacing.md },
    errorText: { fontSize: 14, textAlign: 'center' },
    quickRow: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
    quickPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, borderRadius: radius.pill, borderWidth: 0.5, gap: spacing.xs },
    quickPillIcon: { fontSize: 13 },
    quickPillText: { fontSize: 13, fontWeight: '500' },
    fab: { position: 'absolute', bottom: spacing.xxl, right: spacing.lg, width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6 },
    fabIcon: { fontSize: 24, color: '#FFFFFF', lineHeight: 28 },
})