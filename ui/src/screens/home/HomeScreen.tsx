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
import { spacing } from '../../theme'
import { useTheme } from '../../theme/ThemeContext'
import type { Game, Sport } from '../../types'

export default function HomeScreen() {
    const router = useRouter()
    const { colors } = useTheme()
    const { user } = useAuthStore()

    const [games, setGames] = useState<Game[]>([])
    const [sport, setSport] = useState<Sport | 'ALL'>('ALL')
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const loadGames = useCallback(async (refreshing = false) => {
        if (refreshing) setIsRefreshing(true)
        else setIsLoading(true)
        setError(null)
        try {
            const { games } = await fetchGames(sport !== 'ALL' ? { sport } : undefined)
            setGames(games)
        } catch {
            setError('Could not load games. Pull down to retry.')
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }, [sport])

    useEffect(() => { loadGames() }, [loadGames])

    const initials = user?.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() ?? '?'

    const dateLabel = new Date().toLocaleDateString('en-IN', {
        weekday: 'short', day: 'numeric', month: 'short',
    })

    return (
        <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
            {/* Header */}
            <View style={[s.header, { backgroundColor: colors.background }]}>
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

            {/* Sport filter */}
            <SportFilter selected={sport} onChange={(s) => setSport(s)} />

            {/* Game list */}
            {isLoading ? (
                <View style={s.centered}>
                    <ActivityIndicator color={colors.brand} />
                </View>
            ) : error ? (
                <View style={s.centered}>
                    <Text style={[s.errorText, { color: colors.danger }]}>{error}</Text>
                </View>
            ) : (
                <FlatList
                    data={games}
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
                    renderItem={({ item }) => (
                        <GameCard
                            game={item}
                            onPress={(g) => router.push({ pathname: '/game/[id]', params: { id: g.id } })}
                            onJoin={(g) => router.push({ pathname: '/game/[id]', params: { id: g.id } })}
                        />
                    )}
                    ListHeaderComponent={
                        <View style={s.listHeader}>
                            <Text style={[s.listHeaderText, { color: colors.textPrimary }]}>Games today</Text>
                            <Text style={[s.listHeaderCount, { color: colors.textSecondary }]}>{games.length} found</Text>
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={s.centered}>
                            <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>No games yet</Text>
                            <Text style={[s.emptySubtitle, { color: colors.textSecondary }]}>Be the first to create one!</Text>
                        </View>
                    }
                />
            )}

            {/* FAB */}
            <Pressable
                style={({ pressed }) => [
                    s.fab,
                    { backgroundColor: pressed ? colors.brandDark : colors.brand },
                ]}
                onPress={() => router.push('/create-game')}
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
    listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    listHeaderText: { fontSize: 15, fontWeight: '500' },
    listHeaderCount: { fontSize: 13 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
    errorText: { fontSize: 14, textAlign: 'center' },
    emptyTitle: { fontSize: 16, fontWeight: '500', marginBottom: spacing.xs },
    emptySubtitle: { fontSize: 13 },
    fab: { position: 'absolute', bottom: spacing.xxl, right: spacing.lg, width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6 },
    fabIcon: { fontSize: 24, color: '#FFFFFF', lineHeight: 28 },
})