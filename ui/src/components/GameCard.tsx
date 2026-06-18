import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { radius, spacing, type ThemeColors } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import type { Game, Sport } from '../types';

function sportConfig(colors: ThemeColors): Record<Sport, { label: string; color: string; bg: string }> {
    return {
        FOOTBALL: { label: 'Football', color: colors.sportFootballFg, bg: colors.sportFootballBg },
        BADMINTON: { label: 'Badminton', color: colors.sportBadmintonFg, bg: colors.sportBadmintonBg },
        CRICKET: { label: 'Cricket', color: colors.sportCricketFg, bg: colors.sportCricketBg },
        TENNIS: { label: 'Tennis', color: colors.sportFootballFg, bg: colors.sportFootballBg },
        BASKETBALL: { label: 'Basketball', color: colors.sportCricketFg, bg: colors.sportCricketBg },
        PICKLEBALL: { label: 'Pickleball', color: colors.sportBadmintonFg, bg: colors.sportBadmintonBg },
        OTHER: { label: 'Other', color: colors.textSecondary, bg: colors.surfaceSecondary },
    }
}

function SlotBadge({ game, colors }: { game: Game; colors: ThemeColors }) {
    const taken = game._count.participants
    const left = game.maxSlots - taken

    if (game.status === 'FULL') {
        return <Text style={[s.slotBadge, { backgroundColor: colors.slotFullBg, color: colors.slotFullFg }]}>Full · waitlist</Text>
    }
    if (left <= 2) {
        return <Text style={[s.slotBadge, { backgroundColor: colors.slotFewBg, color: colors.slotFewFg }]}>{left} {left !== 1 ? 'slots' : 'slot'} left</Text>
    }
    return <Text style={[s.slotBadge, { backgroundColor: colors.slotOpenBg, color: colors.slotOpenFg }]}>{left} slots left</Text>
}

const AV_BG = ['#CECBF6', '#9FE1CB', '#F5C4B3', '#B5D4F4']
const AV_FG = ['#26215C', '#04342C', '#4A1B0C', '#042C53']

function ParticipantAvatars({ game, colors }: { game: Game; colors: ThemeColors }) {
    const shown = game.participants.slice(0, 3)
    const extra = game._count.participants - shown.length

    return (
        <View style={s.avatarRow}>
            {shown.map((p, i) => {
                const initials = p.user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                return (
                    <View key={p.id} style={[s.avatar, { backgroundColor: AV_BG[i % 4], borderColor: colors.surface, marginLeft: i === 0 ? 0 : -6 }]}>
                        <Text style={[s.avatarText, { color: AV_FG[i % 4] }]}>{initials}</Text>
                    </View>
                )
            })}
            {extra > 0 && (
                <View style={[s.avatar, { backgroundColor: colors.surfaceSecondary, borderColor: colors.surface, marginLeft: -6 }]}>
                    <Text style={[s.avatarText, { color: colors.textSecondary }]}>+{extra}</Text>
                </View>
            )}
        </View>
    )
}

function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

interface Props {
    game: Game
    onPress: (game: Game) => void
    onJoin: (game: Game) => void
}

export function GameCard({ game, onPress, onJoin }: Props) {
    const { colors } = useTheme()
    const sport = sportConfig(colors)[game.sport]
    const isFull = game.status === 'FULL'

    return (
        // Use View + TouchableOpacity instead of nested Pressables
        // TouchableOpacity doesn't render as <button> on web
        <View
            style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
            {/* Tappable area covers everything except the join button */}
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onPress(game)}
                accessibilityRole="button"
                accessibilityLabel={`${game.title}, ${sport.label}`}
            >
                <View style={s.cardTop}>
                    <View style={[s.sportBadge, { backgroundColor: sport.bg }]}>
                        <Text style={[s.sportLabel, { color: sport.color }]}>{sport.label}</Text>
                    </View>
                    <SlotBadge game={game} colors={colors} />
                </View>

                <Text style={[s.title, { color: colors.textPrimary }]} numberOfLines={1}>
                    {game.title}
                </Text>

                <View style={s.meta}>
                    <Text style={[s.metaText, { color: colors.textSecondary }]}>🕐 {formatTime(game.scheduledAt)}</Text>
                    <Text style={[s.metaText, { color: colors.textSecondary }]} numberOfLines={1}>📍 {game.venue}</Text>
                </View>
            </TouchableOpacity>

            {/* Bottom row — outside the TouchableOpacity so Join doesn't trigger card tap */}
            <View style={[s.cardBottom, { borderTopColor: colors.border }]}>
                <ParticipantAvatars game={game} colors={colors} />
                <TouchableOpacity
                    style={[s.joinBtn, { borderColor: isFull ? colors.border : colors.brand }]}
                    onPress={() => onJoin(game)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={isFull ? 'Join waitlist' : 'Join game'}
                >
                    <Text style={[s.joinBtnText, { color: isFull ? colors.textSecondary : colors.brand }]}>
                        {isFull ? 'Waitlist' : 'Join'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

const s = StyleSheet.create({
    card: { borderRadius: radius.lg, borderWidth: 0.5, padding: spacing.lg, marginBottom: spacing.md },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    sportBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm },
    sportLabel: { fontSize: 12, fontWeight: '500' },
    slotBadge: { fontSize: 12, fontWeight: '500', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm, overflow: 'hidden' },
    title: { fontSize: 15, fontWeight: '500', marginBottom: spacing.sm },
    meta: { gap: spacing.xs, marginBottom: spacing.md },
    metaText: { fontSize: 13 },
    cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.sm, borderTopWidth: 0.5 },
    avatarRow: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 8, fontWeight: '500' },
    joinBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs + 2, borderRadius: radius.sm, borderWidth: 0.5 },
    joinBtnText: { fontSize: 12, fontWeight: '500' },
})