import { useRouter } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
    ActivityIndicator,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fetchGames } from '../../api/games'
import { useLocation } from '../../hooks/useLocation'
import { radius, spacing } from '../../theme'
import { useTheme } from '../../theme/ThemeContext'
import type { Game } from '../../types'

// react-native-maps is native only — conditionally import
let MapView: any = null
let Marker: any = null
let Circle: any = null
let PROVIDER_GOOGLE: any = null

if (Platform.OS !== 'web') {
    const RNMaps = require('react-native-maps')
    MapView = RNMaps.default
    Marker = RNMaps.Marker
    Circle = RNMaps.Circle
    PROVIDER_GOOGLE = RNMaps.PROVIDER_GOOGLE
}

const BENGALURU = { latitude: 12.9716, longitude: 77.5946, latitudeDelta: 0.15, longitudeDelta: 0.15 }

const SPORT_PIN: Record<string, string> = {
    FOOTBALL: '#534AB7',
    BADMINTON: '#0F6E56',
    CRICKET: '#854F0B',
    TENNIS: '#534AB7',
    BASKETBALL: '#854F0B',
    PICKLEBALL: '#0F6E56',
    OTHER: '#888780',
}

const SPORT_ICON: Record<string, string> = {
    FOOTBALL: '⚽',
    BADMINTON: '🏸',
    CRICKET: '🏏',
    TENNIS: '🎾',
    BASKETBALL: '🏀',
    PICKLEBALL: '🏓',
    OTHER: '🏅',
}

// ── Web fallback ──────────────────────────────────────────────
function WebFallback({ games, colors, onGamePress }: {
    games: Game[]; colors: any; onGamePress: (g: Game) => void
}) {
    return (
        <View style={[s.webFallback, { backgroundColor: colors.background }]}>
            <Text style={s.webFallbackIcon}>🗺️</Text>
            <Text style={[s.webFallbackTitle, { color: colors.textPrimary }]}>
                Map view is available on iOS and Android
            </Text>
            <Text style={[s.webFallbackSub, { color: colors.textSecondary }]}>
                {games.length} game{games.length !== 1 ? 's' : ''} with location
            </Text>

            {/* Show games as a list on web */}
            <View style={[s.webList, { borderColor: colors.border }]}>
                {games.length === 0 ? (
                    <Text style={[s.webEmpty, { color: colors.textSecondary }]}>
                        No games with location data yet
                    </Text>
                ) : (
                    games.map((g) => (
                        <TouchableOpacity
                            key={g.id}
                            style={[s.webListItem, { borderBottomColor: colors.border }]}
                            onPress={() => onGamePress(g)}
                            activeOpacity={0.7}
                        >
                            <Text style={s.webListIcon}>{SPORT_ICON[g.sport] ?? '🏅'}</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={[s.webListTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                                    {g.title}
                                </Text>
                                <Text style={[s.webListMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                                    {"📍 " + g.venue}
                                </Text>
                            </View>
                            <Text style={[s.webListArrow, { color: colors.textSecondary }]}>›</Text>
                        </TouchableOpacity>
                    ))
                )}
            </View>
        </View>
    )
}

// ── Game pin marker ───────────────────────────────────────────
function GamePin({ game, selected, colors }: { game: Game; selected: boolean; colors: any }) {
    const pinColor = SPORT_PIN[game.sport] ?? '#534AB7'
    const isFull = game.status === 'FULL'
    const left = game.maxSlots - game._count.participants

    return (
        <View style={[
            s.pinContainer,
            {
                backgroundColor: selected ? pinColor : colors.surface,
                borderColor: selected ? pinColor : colors.border,
            },
        ]}>
            <Text style={s.pinIcon}>{SPORT_ICON[game.sport] ?? '🏅'}</Text>
            {!isFull && (
                <Text style={[s.pinSlots, { color: selected ? '#fff' : pinColor }]}>{left}</Text>
            )}
        </View>
    )
}

// ── Bottom card ───────────────────────────────────────────────
function BottomCard({ game, onPress, onClose, colors }: {
    game: Game; onPress: () => void; onClose: () => void; colors: any
}) {
    const isFull = game.status === 'FULL'
    const left = game.maxSlots - game._count.participants
    const time = new Date(game.scheduledAt).toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: true,
    })

    return (
        <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={s.cardHeader}>
                <View style={[s.sportBadge, { backgroundColor: colors.brandLight }]}>
                    <Text style={[s.sportBadgeText, { color: colors.brand }]}>
                        {SPORT_ICON[game.sport]} {game.sport.charAt(0) + game.sport.slice(1).toLowerCase()}
                    </Text>
                </View>
                <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
                    <Text style={[s.closeBtn, { color: colors.textSecondary }]}>✕</Text>
                </Pressable>
            </View>
            <Text style={[s.cardTitle, { color: colors.textPrimary }]} numberOfLines={2}>{game.title}</Text>
            <Text style={[s.cardMeta, { color: colors.textSecondary }]}>{"🕐 " + time}</Text>
            <Text style={[s.cardMeta, { color: colors.textSecondary }]} numberOfLines={1}>{"📍 " + game.venue}</Text>
            <View style={s.cardFooter}>
                <Text style={[s.slotsText, { color: isFull ? '#791F1F' : left <= 2 ? '#633806' : '#27500A' }]}>
                    {isFull ? 'Full · waitlist' : left + ' slot' + (left !== 1 ? 's' : '') + ' left'}
                </Text>
                <TouchableOpacity
                    style={[s.viewBtn, { backgroundColor: colors.brand }]}
                    onPress={onPress}
                    activeOpacity={0.8}
                >
                    <Text style={s.viewBtnText}>View game</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

// ── Main screen ───────────────────────────────────────────────
export default function MapScreen() {
    const router = useRouter()
    const { colors } = useTheme()
    const location = useLocation()
    const mapRef = useRef<any>(null)

    const [games, setGames] = useState<Game[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedGame, setSelectedGame] = useState<Game | null>(null)

    const mappableGames = games.filter((g) => g.lat && g.lng)

    const loadGames = useCallback(async () => {
        setIsLoading(true)
        try {
            const { games } = await fetchGames()
            setGames(games)
        } catch {
            // fail silently on map
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => { loadGames() }, [loadGames])

    async function handleLocateMe() {
        const coords = await location.requestLocation()
        if (coords && mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: coords.lat,
                longitude: coords.lng,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            }, 600)
        }
    }

    function handleMarkerPress(game: Game) {
        setSelectedGame(game)
        if (game.lat && game.lng && mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: game.lat - 0.01,
                longitude: game.lng,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            }, 400)
        }
    }

    function navigateToGame(g: Game) {
        router.push({ pathname: '/game/[id]', params: { id: g.id } })
    }

    return (
        <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
            {/* Header */}
            <View style={[s.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                <Text style={[s.heading, { color: colors.textPrimary }]}>Games map</Text>
                <View style={[s.countPill, { backgroundColor: colors.brandLight }]}>
                    <Text style={[s.countText, { color: colors.brand }]}>
                        {mappableGames.length + ' game' + (mappableGames.length !== 1 ? 's' : '')}
                    </Text>
                </View>
            </View>

            {/* Web fallback */}
            {Platform.OS === 'web' ? (
                <WebFallback
                    games={mappableGames}
                    colors={colors}
                    onGamePress={navigateToGame}
                />
            ) : (
                <View style={s.mapContainer}>
                    <MapView
                        ref={mapRef}
                        style={s.map}
                        provider={PROVIDER_GOOGLE}
                        initialRegion={BENGALURU}
                        showsUserLocation
                        showsMyLocationButton={false}
                        onPress={() => setSelectedGame(null)}
                    >
                        {location.coords && (
                            <Circle
                                center={{ latitude: location.coords.lat, longitude: location.coords.lng }}
                                radius={10_000}
                                strokeColor={colors.brand + '40'}
                                fillColor={colors.brand + '15'}
                            />
                        )}
                        {mappableGames.map((game) => (
                            <Marker
                                key={game.id}
                                coordinate={{ latitude: game.lat!, longitude: game.lng! }}
                                onPress={() => handleMarkerPress(game)}
                                tracksViewChanges={false}
                            >
                                <GamePin
                                    game={game}
                                    selected={selectedGame?.id === game.id}
                                    colors={colors}
                                />
                            </Marker>
                        ))}
                    </MapView>

                    {/* Loading overlay */}
                    {isLoading && (
                        <View style={[s.loadingOverlay, { backgroundColor: colors.background + 'CC' }]}>
                            <ActivityIndicator color={colors.brand} size="large" />
                            <Text style={[s.loadingText, { color: colors.textSecondary }]}>Loading games…</Text>
                        </View>
                    )}

                    {/* No coordinates notice */}
                    {!isLoading && mappableGames.length === 0 && (
                        <View style={[s.notice, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Text style={[s.noticeText, { color: colors.textSecondary }]}>
                                No games with location yet. Create one with a venue to see it here.
                            </Text>
                        </View>
                    )}

                    {/* Locate me */}
                    <Pressable
                        style={[s.locateBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={handleLocateMe}
                        accessibilityLabel="Go to my location"
                        accessibilityRole="button"
                    >
                        {location.isLocating
                            ? <ActivityIndicator color={colors.brand} size="small" />
                            : <Text style={{ fontSize: 18 }}>📍</Text>
                        }
                    </Pressable>

                    {/* Selected game card */}
                    {selectedGame && (
                        <View style={s.cardContainer}>
                            <BottomCard
                                game={selectedGame}
                                onPress={() => navigateToGame(selectedGame)}
                                onClose={() => setSelectedGame(null)}
                                colors={colors}
                            />
                        </View>
                    )}
                </View>
            )}
        </SafeAreaView>
    )
}

const s = StyleSheet.create({
    safe: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 0.5 },
    heading: { fontSize: 18, fontWeight: '500' },
    countPill: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill },
    countText: { fontSize: 12, fontWeight: '500' },

    mapContainer: { flex: 1 },
    map: { flex: 1 },

    pinContainer: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 20, borderWidth: 1.5 },
    pinIcon: { fontSize: 14 },
    pinSlots: { fontSize: 12, fontWeight: '600' },

    loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
    loadingText: { fontSize: 13 },
    notice: { position: 'absolute', bottom: spacing.xl, left: spacing.lg, right: spacing.lg, padding: spacing.md, borderRadius: radius.md, borderWidth: 0.5, alignItems: 'center' },
    noticeText: { fontSize: 13, textAlign: 'center' },
    locateBtn: { position: 'absolute', top: spacing.lg, right: spacing.lg, width: 44, height: 44, borderRadius: 22, borderWidth: 0.5, alignItems: 'center', justifyContent: 'center' },

    cardContainer: { position: 'absolute', bottom: spacing.xxl, left: spacing.lg, right: spacing.lg },
    card: { borderRadius: radius.lg, borderWidth: 0.5, padding: spacing.lg },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    sportBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm },
    sportBadgeText: { fontSize: 12, fontWeight: '500' },
    closeBtn: { fontSize: 16, padding: spacing.xs },
    cardTitle: { fontSize: 16, fontWeight: '500', marginBottom: spacing.sm },
    cardMeta: { fontSize: 13, marginBottom: spacing.xs },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
    slotsText: { fontSize: 13, fontWeight: '500' },
    viewBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.sm },
    viewBtnText: { fontSize: 13, fontWeight: '500', color: '#fff' },

    // Web fallback
    webFallback: { flex: 1, alignItems: 'center', paddingTop: spacing.xxl, paddingHorizontal: spacing.lg },
    webFallbackIcon: { fontSize: 48, marginBottom: spacing.md },
    webFallbackTitle: { fontSize: 16, fontWeight: '500', textAlign: 'center', marginBottom: spacing.xs },
    webFallbackSub: { fontSize: 13, marginBottom: spacing.xl },
    webList: { width: '100%', borderWidth: 0.5, borderRadius: radius.lg, overflow: 'hidden' },
    webListItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderBottomWidth: 0.5 },
    webListIcon: { fontSize: 20 },
    webListTitle: { fontSize: 14, fontWeight: '500', marginBottom: 2 },
    webListMeta: { fontSize: 12 },
    webListArrow: { fontSize: 20 },
    webEmpty: { padding: spacing.xl, textAlign: 'center' },
})