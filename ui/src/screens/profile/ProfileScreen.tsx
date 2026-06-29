import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuthStore } from '../../store/authStore'
import { radius, spacing } from '../../theme'
import { useTheme } from '../../theme/ThemeContext'
import { AppAlert } from '../../utils/alert'

const SPORT_ICONS: Record<string, string> = {
    FOOTBALL: '⚽',
    BADMINTON: '🏸',
    CRICKET: '🏏',
    TENNIS: '🎾',
    BASKETBALL: '🏀',
    PICKLEBALL: '🏓',
    OTHER: '🏅',
}

export default function ProfileScreen() {
    const { colors } = useTheme()
    const { user, signOut } = useAuthStore()

    const initials = user?.name
        .split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'

    async function handleSignOut() {
        const confirmed = await AppAlert.confirm('Sign out', 'Are you sure you want to sign out?', {
            confirmText: 'Sign out',
            destructive: true,
        })
        if (confirmed) signOut()
    }

    return (
        <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
            <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

                {/* Avatar + name */}
                <View style={s.hero}>
                    <View style={[s.avatar, { backgroundColor: colors.brandLight, borderColor: colors.border }]}>
                        <Text style={[s.avatarText, { color: colors.brandDark }]}>{initials}</Text>
                    </View>
                    <Text style={[s.name, { color: colors.textPrimary }]}>{user?.name}</Text>
                    <Text style={[s.email, { color: colors.textSecondary }]}>{user?.email}</Text>
                </View>

                {/* Stats row */}
                <View style={[s.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={s.stat}>
                        <Text style={[s.statValue, { color: colors.textPrimary }]}>—</Text>
                        <Text style={[s.statLabel, { color: colors.textSecondary }]}>Games joined</Text>
                    </View>
                    <View style={[s.statDivider, { backgroundColor: colors.border }]} />
                    <View style={s.stat}>
                        <Text style={[s.statValue, { color: colors.textPrimary }]}>—</Text>
                        <Text style={[s.statLabel, { color: colors.textSecondary }]}>Games hosted</Text>
                    </View>
                    <View style={[s.statDivider, { backgroundColor: colors.border }]} />
                    <View style={s.stat}>
                        <Text style={[s.statValue, { color: colors.textPrimary }]}>—</Text>
                        <Text style={[s.statLabel, { color: colors.textSecondary }]}>Sports played</Text>
                    </View>
                </View>

                {/* Account section */}
                <View style={s.section}>
                    <Text style={[s.sectionTitle, { color: colors.textSecondary }]}>ACCOUNT</Text>
                    <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <SettingsRow label="Edit profile" icon="✏️" onPress={() => { }} colors={colors} />
                        <SettingsRow label="Favourite sports" icon="⭐" onPress={() => { }} colors={colors} />
                        <SettingsRow label="Home area" icon="📍" onPress={() => { }} colors={colors} last />
                    </View>
                </View>

                {/* App section */}
                <View style={s.section}>
                    <Text style={[s.sectionTitle, { color: colors.textSecondary }]}>APP</Text>
                    <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <SettingsRow label="Notifications" icon="🔔" onPress={() => { }} colors={colors} />
                        <SettingsRow label="Privacy policy" icon="🔒" onPress={() => { }} colors={colors} />
                        <SettingsRow label="Terms of service" icon="📄" onPress={() => { }} colors={colors} last />
                    </View>
                </View>

                {/* Sign out */}
                <Pressable
                    style={[s.signOutBtn, { borderColor: colors.danger }]}
                    onPress={handleSignOut}
                    accessibilityRole="button"
                >
                    <Text style={[s.signOutText, { color: colors.danger }]}>Sign out</Text>
                </Pressable>

                <Text style={[s.version, { color: colors.textSecondary }]}>Playo v0.1.0</Text>
            </ScrollView>
        </SafeAreaView>
    )
}

function SettingsRow({ label, icon, onPress, colors, last }: {
    label: string; icon: string; onPress: () => void; colors: any; last?: boolean
}) {
    return (
        <Pressable
            style={[s.settingsRow, !last && { borderBottomWidth: 0.5, borderBottomColor: colors.border }]}
            onPress={onPress}
            accessibilityRole="button"
        >
            <Text style={s.settingsIcon}>{icon}</Text>
            <Text style={[s.settingsLabel, { color: colors.textPrimary }]}>{label}</Text>
            <Text style={[s.settingsArrow, { color: colors.textSecondary }]}>›</Text>
        </Pressable>
    )
}

const s = StyleSheet.create({
    safe: { flex: 1 },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },

    hero: { alignItems: 'center', paddingVertical: spacing.xl },
    avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 0.5, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
    avatarText: { fontSize: 28, fontWeight: '500' },
    name: { fontSize: 20, fontWeight: '500', marginBottom: spacing.xs },
    email: { fontSize: 14 },

    statsRow: { flexDirection: 'row', borderRadius: radius.lg, borderWidth: 0.5, marginBottom: spacing.xl, overflow: 'hidden' },
    stat: { flex: 1, alignItems: 'center', paddingVertical: spacing.lg },
    statValue: { fontSize: 20, fontWeight: '500', marginBottom: 4 },
    statLabel: { fontSize: 11 },
    statDivider: { width: 0.5 },

    section: { marginBottom: spacing.lg },
    sectionTitle: { fontSize: 11, fontWeight: '500', letterSpacing: 0.8, marginBottom: spacing.sm },
    card: { borderRadius: radius.lg, borderWidth: 0.5, overflow: 'hidden' },

    settingsRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
    settingsIcon: { fontSize: 18, width: 28, textAlign: 'center' },
    settingsLabel: { flex: 1, fontSize: 15 },
    settingsArrow: { fontSize: 20 },

    signOutBtn: { borderRadius: radius.md, borderWidth: 0.5, paddingVertical: spacing.md, alignItems: 'center', marginBottom: spacing.md },
    signOutText: { fontSize: 15, fontWeight: '500' },
    version: { textAlign: 'center', fontSize: 12 },
})