import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useGoogleAuth } from '../../hooks/useGoogleAuth'
import { colors, radius, spacing } from '../../theme'

// Sport pills shown on the login screen
const SPORTS = [
    { label: 'Football', icon: '⚽' },
    { label: 'Badminton', icon: '🏸' },
    { label: 'Cricket', icon: '🏏' },
] as const

export default function LoginScreen() {
    const { signIn, isLoading } = useGoogleAuth()

    async function handleSignIn() {
        try {
            await signIn()
        } catch {
            Alert.alert('Sign-in failed', 'Something went wrong. Please try again.')
        }
    }

    return (
        <SafeAreaView style={s.safe}>
            {/* ── Hero ─────────────────────────────────── */}
            <View style={s.hero}>
                <View style={s.logoMark}>
                    <Text style={s.logoEmoji}>⚽</Text>
                </View>

                <Text style={s.heading}>Play with the city</Text>
                <Text style={s.subheading}>
                    Find games, fill slots, and meet players near you in Bengaluru.
                </Text>

                {/* Sport pills */}
                <View style={s.pills}>
                    {SPORTS.map((sport) => (
                        <View key={sport.label} style={s.pill}>
                            <Text style={s.pillIcon}>{sport.icon}</Text>
                            <Text style={s.pillLabel}>{sport.label}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* ── Bottom ───────────────────────────────── */}
            <View style={s.bottom}>
                <View style={s.dividerRow}>
                    <View style={s.dividerLine} />
                    <Text style={s.dividerText}>sign in to continue</Text>
                    <View style={s.dividerLine} />
                </View>

                <Pressable
                    style={({ pressed }) => [s.googleBtn, pressed && s.googleBtnPressed]}
                    onPress={handleSignIn}
                    disabled={isLoading}
                    accessibilityLabel="Continue with Google"
                    accessibilityRole="button"
                >
                    {isLoading ? (
                        <ActivityIndicator color={colors.gray[800]} />
                    ) : (
                        <>
                            <GoogleLogo />
                            <Text style={s.googleBtnText}>Continue with Google</Text>
                        </>
                    )}
                </Pressable>

                <Text style={s.terms}>
                    By continuing you agree to our{' '}
                    <Text style={s.link}>Terms of Service</Text>
                    {' '}and{' '}
                    <Text style={s.link}>Privacy Policy</Text>
                </Text>
            </View>
        </SafeAreaView>
    )
}

// Inline SVG-equivalent Google logo using coloured text blocks
function GoogleLogo() {
    return (
        <Image
            source={{ uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' }}
            style={s.googleLogo}
            accessibilityLabel="Google logo"
        />
    )
}

const s = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: colors.white,
    },

    // Hero
    hero: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xxl,
    },
    logoMark: {
        width: 64,
        height: 64,
        borderRadius: radius.md,
        backgroundColor: colors.purple[800],
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
    },
    logoEmoji: {
        fontSize: 32,
    },
    heading: {
        fontSize: 26,
        fontWeight: '500',
        color: colors.gray[800],
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    subheading: {
        fontSize: 14,
        color: colors.gray[400],
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: 260,
    },

    // Sport pills
    pills: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.xxl,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingVertical: spacing.xs + 2,
        paddingHorizontal: spacing.md,
        borderRadius: radius.pill,
        borderWidth: 0.5,
        borderColor: colors.gray[200],
        backgroundColor: colors.gray[50],
    },
    pillIcon: {
        fontSize: 14,
    },
    pillLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: colors.gray[400],
    },

    // Bottom section
    bottom: {
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.xxl,
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    dividerLine: {
        flex: 1,
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.gray[200],
    },
    dividerText: {
        fontSize: 12,
        color: colors.gray[400],
    },

    // Google button
    googleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.md + 2,
        borderRadius: radius.md,
        borderWidth: 0.5,
        borderColor: colors.gray[200],
        backgroundColor: colors.white,
        marginBottom: spacing.lg,
        minHeight: 50,
    },
    googleBtnPressed: {
        backgroundColor: colors.gray[50],
    },
    googleLogo: {
        width: 20,
        height: 20,
    },
    googleBtnText: {
        fontSize: 15,
        fontWeight: '500',
        color: colors.gray[800],
    },

    // Terms
    terms: {
        fontSize: 12,
        color: colors.gray[400],
        textAlign: 'center',
        lineHeight: 18,
    },
    link: {
        color: colors.purple[500],
    },
})
