import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { createGame } from '../../api/games'
import { radius, spacing } from '../../theme'
import { useTheme } from '../../theme/ThemeContext'
import type { Sport } from '../../types'

// ── Constants ─────────────────────────────────────────────────
const SPORTS: { label: string; value: Sport; icon: string }[] = [
    { label: 'Football', value: 'FOOTBALL', icon: '⚽' },
    { label: 'Badminton', value: 'BADMINTON', icon: '🏸' },
    { label: 'Cricket', value: 'CRICKET', icon: '🏏' },
    { label: 'Tennis', value: 'TENNIS', icon: '🎾' },
    { label: 'Basketball', value: 'BASKETBALL', icon: '🏀' },
    { label: 'Pickleball', value: 'PICKLEBALL', icon: '🏓' },
    { label: 'Other', value: 'OTHER', icon: '🏅' },
]

const SLOT_OPTIONS = [2, 4, 6, 8, 10, 12, 16, 20]

// ── Sub-components ────────────────────────────────────────────
function Label({ text, colors }: { text: string; colors: any }) {
    return <Text style={[s.label, { color: colors.textSecondary }]}>{text}</Text>
}

function Field({
    label,
    children,
    colors,
}: {
    label: string
    children: React.ReactNode
    colors: any
}) {
    return (
        <View style={s.field}>
            <Label text={label} colors={colors} />
            {children}
        </View>
    )
}

// ── Main screen ───────────────────────────────────────────────
export default function CreateGameScreen() {
    const router = useRouter()
    const { colors } = useTheme()

    const [title, setTitle] = useState('')
    const [sport, setSport] = useState<Sport | null>(null)
    const [venue, setVenue] = useState('')
    const [date, setDate] = useState('')         // YYYY-MM-DD
    const [time, setTime] = useState('')         // HH:MM
    const [maxSlots, setMaxSlots] = useState<number>(10)
    const [description, setDescription] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // ── Validation ──────────────────────────────────────────────
    function validate(): string | null {
        if (!title.trim()) return 'Please enter a game title'
        if (!sport) return 'Please select a sport'
        if (!venue.trim()) return 'Please enter a venue'
        if (!date) return 'Please enter a date (YYYY-MM-DD)'
        if (!time) return 'Please enter a time (HH:MM)'

        const iso = new Date(`${date}T${time}:00`)
        if (isNaN(iso.getTime())) return 'Invalid date or time'
        if (iso <= new Date()) return 'Scheduled time must be in the future'

        return null
    }

    // ── Submit ──────────────────────────────────────────────────
    async function handleSubmit() {
        const error = validate()
        if (error) { Alert.alert('Validation error', error); return }

        setIsSubmitting(true)
        try {
            const scheduledAt = new Date(`${date}T${time}:00`).toISOString()
            const { game } = await createGame({
                title: title.trim(),
                sport: sport!,
                venue: venue.trim(),
                scheduledAt,
                maxSlots,
                description: description.trim() || undefined,
            })
            Alert.alert('Game created!', `"${game.title}" is live.`, [
                { text: 'View', onPress: () => router.replace({ pathname: '/game/[id]', params: { id: game.id } }) },
                { text: 'Home', onPress: () => router.replace('/(tabs)') },
            ])
        } catch (err: any) {
            const msg = err?.response?.data?.message ?? 'Something went wrong. Please try again.'
            Alert.alert('Error', msg)
        } finally {
            setIsSubmitting(false)
        }
    }

    const inputStyle = [s.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]
    const placeholderColor = colors.textSecondary

    return (
        <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
            {/* ── Header ───────────────────────────────────────── */}
            <View style={[s.header, { borderBottomColor: colors.border }]}>
                <Pressable onPress={() => router.back()} accessibilityLabel="Go back" accessibilityRole="button">
                    <Text style={[s.backBtn, { color: colors.brand }]}>← Back</Text>
                </Pressable>
                <Text style={[s.headerTitle, { color: colors.textPrimary }]}>Create game</Text>
                <View style={{ width: 60 }} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={s.scroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── Title ────────────────────────────────────── */}
                    <Field label="GAME TITLE" colors={colors}>
                        <TextInput
                            style={inputStyle}
                            placeholder="e.g. Evening 5-a-side at Kanteerava"
                            placeholderTextColor={placeholderColor}
                            value={title}
                            onChangeText={setTitle}
                            maxLength={100}
                            returnKeyType="next"
                        />
                    </Field>

                    {/* ── Sport ────────────────────────────────────── */}
                    <Field label="SPORT" colors={colors}>
                        <View style={s.sportGrid}>
                            {SPORTS.map((sp) => {
                                const active = sport === sp.value
                                return (
                                    <Pressable
                                        key={sp.value}
                                        style={[
                                            s.sportChip,
                                            {
                                                backgroundColor: active ? colors.brandLight : colors.surface,
                                                borderColor: active ? colors.brand : colors.border,
                                            },
                                        ]}
                                        onPress={() => setSport(sp.value)}
                                        accessibilityRole="radio"
                                        accessibilityState={{ checked: active }}
                                    >
                                        <Text style={s.sportIcon}>{sp.icon}</Text>
                                        <Text style={[s.sportLabel, { color: active ? colors.brand : colors.textSecondary }]}>
                                            {sp.label}
                                        </Text>
                                    </Pressable>
                                )
                            })}
                        </View>
                    </Field>

                    {/* ── Venue ────────────────────────────────────── */}
                    <Field label="VENUE" colors={colors}>
                        <TextInput
                            style={inputStyle}
                            placeholder="e.g. Kanteerava Stadium, Cubbon Park"
                            placeholderTextColor={placeholderColor}
                            value={venue}
                            onChangeText={setVenue}
                            maxLength={200}
                            returnKeyType="next"
                        />
                    </Field>

                    {/* ── Date & Time ──────────────────────────────── */}
                    <View style={s.row}>
                        <View style={{ flex: 1 }}>
                            <Field label="DATE" colors={colors}>
                                <TextInput
                                    style={inputStyle}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor={placeholderColor}
                                    value={date}
                                    onChangeText={setDate}
                                    keyboardType="numeric"
                                    maxLength={10}
                                    returnKeyType="next"
                                />
                            </Field>
                        </View>
                        <View style={{ width: spacing.md }} />
                        <View style={{ flex: 1 }}>
                            <Field label="TIME" colors={colors}>
                                <TextInput
                                    style={inputStyle}
                                    placeholder="HH:MM"
                                    placeholderTextColor={placeholderColor}
                                    value={time}
                                    onChangeText={setTime}
                                    keyboardType="numeric"
                                    maxLength={5}
                                    returnKeyType="next"
                                />
                            </Field>
                        </View>
                    </View>

                    {/* ── Max slots ────────────────────────────────── */}
                    <Field label="MAX PLAYERS" colors={colors}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={s.slotsRow}
                        >
                            {SLOT_OPTIONS.map((n) => {
                                const active = maxSlots === n
                                return (
                                    <Pressable
                                        key={n}
                                        style={[
                                            s.slotChip,
                                            {
                                                backgroundColor: active ? colors.brand : colors.surface,
                                                borderColor: active ? colors.brand : colors.border,
                                            },
                                        ]}
                                        onPress={() => setMaxSlots(n)}
                                    >
                                        <Text style={[s.slotChipText, { color: active ? '#fff' : colors.textSecondary }]}>
                                            {n}
                                        </Text>
                                    </Pressable>
                                )
                            })}
                        </ScrollView>
                    </Field>

                    {/* ── Description ──────────────────────────────── */}
                    <Field label="DESCRIPTION (OPTIONAL)" colors={colors}>
                        <TextInput
                            style={[inputStyle, s.textarea]}
                            placeholder="Any details — skill level, what to bring, parking info…"
                            placeholderTextColor={placeholderColor}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={4}
                            maxLength={500}
                            textAlignVertical="top"
                        />
                        <Text style={[s.charCount, { color: colors.textSecondary }]}>
                            {description.length}/500
                        </Text>
                    </Field>

                    {/* ── Submit ───────────────────────────────────── */}
                    <Pressable
                        style={[
                            s.submitBtn,
                            { backgroundColor: isSubmitting ? colors.brandDark : colors.brand },
                        ]}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                        accessibilityRole="button"
                        accessibilityLabel="Create game"
                    >
                        {isSubmitting
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={s.submitBtnText}>Create game</Text>
                        }
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

const s = StyleSheet.create({
    safe: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 0.5 },
    backBtn: { fontSize: 15, width: 60 },
    headerTitle: { fontSize: 16, fontWeight: '500' },

    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },

    field: { marginBottom: spacing.lg },
    label: { fontSize: 11, fontWeight: '500', letterSpacing: 0.8, marginBottom: spacing.sm },
    input: { borderWidth: 0.5, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 15 },
    textarea: { minHeight: 100, paddingTop: spacing.md },
    charCount: { fontSize: 11, textAlign: 'right', marginTop: spacing.xs },

    row: { flexDirection: 'row' },

    sportGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    sportChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: 0.5, marginBottom: 2 },
    sportIcon: { fontSize: 15 },
    sportLabel: { fontSize: 13, fontWeight: '500' },

    slotsRow: { gap: spacing.sm, paddingVertical: 2 },
    slotChip: { width: 44, height: 44, borderRadius: radius.sm, borderWidth: 0.5, alignItems: 'center', justifyContent: 'center' },
    slotChipText: { fontSize: 14, fontWeight: '500' },

    submitBtn: { borderRadius: radius.md, paddingVertical: spacing.lg, alignItems: 'center', marginTop: spacing.sm },
    submitBtnText: { fontSize: 16, fontWeight: '500', color: '#fff' },
})