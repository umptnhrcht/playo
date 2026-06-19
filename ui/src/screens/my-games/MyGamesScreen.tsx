import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
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
import { apiClient } from '../../api/client'
import { GameCard } from '../../components/GameCard'
import { useAuthStore } from '../../store/authStore'
import { radius, spacing } from '../../theme'
import { useTheme } from '../../theme/ThemeContext'
import type { Game } from '../../types'

type Tab = 'joined' | 'hosted'

export default function MyGamesScreen() {
    const router = useRouter()
    const { colors } = useTheme()
    const { user } = useAuthStore()

    const [activeTab, setActiveTab] = useState<Tab>('joined')
    const [joinedGames, setJoinedGames] = useState<Game[]>([])
    const [hostedGames, setHostedGames] = useState<Game[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)

    const loadGames = useCallback(async (refreshing = false) => {
        if (refreshing) setIsRefreshing(true)
        else setIsLoading(true)

        try {
            const [joinedRes, hostedRes] = await Promise.all([
                apiClient.get<{ games: Game[] }>('/users/me/games?role=joined'),
                apiClient.get<{ games: Game[] }>('/users/me/games?role=hosted'),
            ])
            setJoinedGames(joinedRes.data.games)
            setHostedGames(hostedRes.data.games)
        } catch {
            // fail silently — user sees empty state
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }, [])

    // Reload whenever this tab comes into focus
    useFocusEffect(useCallback(() => { loadGames() }, [loadGames]))

    function navigateToGame(g: Game) {
        router.push({ pathname: '/game/[id]', params: { id: g.id } })
    }

    const games = activeTab === 'joined' ? joinedGames : hostedGames

    return (
        <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
            {/* Header */}
            <View style={[s.header, { borderBottomColor: colors.border }]}>
                <Text style={[s.heading, { color: colors.textPrimary }]}>My Games</Text>
            </View>

            {/* Tabs */}
            <View style={[s.tabRow, { borderBottomColor: colors.border }]}>
                {(['joined', 'hosted'] as Tab[]).map((tab) => (
                    <Pressable
                        key={tab}
                        style={[
                            s.tab,
                            activeTab === tab && { borderBottomColor: colors.brand, borderBottomWidth: 2 },
                        ]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[
                            s.tabText,
                            { color: activeTab === tab ? colors.brand : colors.textSecondary },
                        ]}>
                            {tab === 'joined' ? 'Joined' : 'Hosted'}
                        </Text>
                        <View style={[s.countBadge, { backgroundColor: colors.brandLight }]}>
                            <Text style={[s.countText, { color: colors.brand }]}>
                                {tab === 'joined' ? joinedGames.length : hostedGames.length}
                            </Text>
                        </View>
                    </Pressable>
                ))}
            </View>

            {/* Content */}
            {isLoading ? (
                <View style={s.centered}>
                    <ActivityIndicator color={colors.brand} size="large" />
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
                        <GameCard game={item} onPress={navigateToGame} onJoin={navigateToGame} />
                    )}
                    ListEmptyComponent={
                        <View style={s.centered}>
                            <Text style={s.emptyIcon}>{activeTab === 'joined' ? '🏟️' : '🎮'}</Text>
                            <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>
                                {activeTab === 'joined' ? 'No games joined yet' : 'No games hosted yet'}
                            </Text>
                            <Text style={[s.emptySub, { color: colors.textSecondary }]}>
                                {activeTab === 'joined'
                                    ? 'Find a game on the home screen'
                                    : 'Create your first game with the + button'}
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    )
}

const s = StyleSheet.create({
    safe: { flex: 1 },
    header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 0.5 },
    heading: { fontSize: 22, fontWeight: '500' },
    tabRow: { flexDirection: 'row', borderBottomWidth: 0.5 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md },
    tabText: { fontSize: 14, fontWeight: '500' },
    countBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
    countText: { fontSize: 11, fontWeight: '500' },
    list: { padding: spacing.lg, paddingBottom: 100 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
    emptyIcon: { fontSize: 40 },
    emptyTitle: { fontSize: 16, fontWeight: '500' },
    emptySub: { fontSize: 13, textAlign: 'center' },
})
