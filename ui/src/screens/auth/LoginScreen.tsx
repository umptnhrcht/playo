import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useGoogleAuth } from '../../hooks/useGoogleAuth'
import { radius, spacing } from '../../theme'
import { useTheme } from '../../theme/ThemeContext'

const SPORTS = [
    { label: 'Football', icon: '⚽' },
    { label: 'Badminton', icon: '🏸' },
    { label: 'Cricket', icon: '🏏' },
] as const

export default function LoginScreen() {
    const { signIn, isLoading } = useGoogleAuth()
    const { colors } = useTheme()

    async function handleSignIn() {
        try {
            await signIn()
        } catch {
            Alert.alert('Sign-in failed', 'Something went wrong. Please try again.')
        }
    }

    return (
        <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
            <View style={s.hero}>
                <View style={[s.logoMark, { backgroundColor: colors.brandDark }]}>
                    <Text style={s.logoEmoji}>⚽</Text>
                </View>
                <Text style={[s.heading, { color: colors.textPrimary }]}>Play with the city</Text>
                <Text style={[s.subheading, { color: colors.textSecondary }]}>
                    Find games, fill slots, and meet players near you in Bengaluru.
                </Text>
                <View style={s.pills}>
                    {SPORTS.map((sport) => (
                        <View key={sport.label} style={[s.pill, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                            <Text style={s.pillIcon}>{sport.icon}</Text>
                            <Text style={[s.pillLabel, { color: colors.textSecondary }]}>{sport.label}</Text>
                        </View>
                    ))}
                </View>
            </View>

            <View style={s.bottom}>
                <View style={s.dividerRow}>
                    <View style={[s.dividerLine, { backgroundColor: colors.border }]} />
                    <Text style={[s.dividerText, { color: colors.textSecondary }]}>sign in to continue</Text>
                    <View style={[s.dividerLine, { backgroundColor: colors.border }]} />
                </View>

                <Pressable
                    style={({ pressed }) => [
                        s.googleBtn,
                        { borderColor: colors.border, backgroundColor: pressed ? colors.surfaceSecondary : colors.surface },
                    ]}
                    onPress={handleSignIn}
                    disabled={isLoading}
                    accessibilityLabel="Continue with Google"
                    accessibilityRole="button"
                >
                    {isLoading ? (
                        <ActivityIndicator color={colors.textPrimary} />
                    ) : (
                        <>
                            <Text style={s.googleLogo}>G</Text>
                            <Text style={[s.googleBtnText, { color: colors.textPrimary }]}>Continue with Google</Text>
                        </>
                    )}
                </Pressable>

                <Text style={[s.terms, { color: colors.textSecondary }]}>
                    By continuing you agree to our{' '}
                    <Text style={[s.link, { color: colors.brand }]}>Terms of Service</Text>
                    {' '}and{' '}
                    <Text style={[s.link, { color: colors.brand }]}>Privacy Policy</Text>
                </Text>
            </View>
        </SafeAreaView>
    )
}

const s = StyleSheet.create({
    safe: { flex: 1 },
    hero: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxl },
    logoMark: { width: 64, height: 64, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
    logoEmoji: { fontSize: 32 },
    heading: { fontSize: 26, fontWeight: '500', textAlign: 'center', marginBottom: spacing.sm },
    subheading: { fontSize: 14, textAlign: 'center', lineHeight: 22, maxWidth: 260 },
    pills: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xxl },
    pill: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs + 2, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 0.5 },
    pillIcon: { fontSize: 14 },
    pillLabel: { fontSize: 12, fontWeight: '500' },
    bottom: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
    dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xl },
    dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
    dividerText: { fontSize: 12 },
    googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md + 2, borderRadius: radius.md, borderWidth: 0.5, marginBottom: spacing.lg, minHeight: 50 },
    googleLogo: { fontSize: 16, fontWeight: '700', color: '#4285F4', width: 20, textAlign: 'center' },
    googleBtnText: { fontSize: 15, fontWeight: '500' },
    terms: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
    link: { fontWeight: '500' },
})