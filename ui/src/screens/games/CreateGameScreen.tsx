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
import type { PlaceDetail } from '../../api/places'
import { VenuePicker } from '../../components/VenuePicker'
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

const SKILL_LEVELS = [
    { label: 'All levels', value: 'ALL' },
    { label: 'Beginner', value: 'BEGINNER' },
    { label: 'Intermediate', value: 'INTERMEDIATE' },
    { label: 'Pro', value: 'PRO' },
]

const SLOT_OPTIONS = [2, 4, 6, 8, 10, 12, 16, 20]

const BENGALURU_AREAS = [
    'Indiranagar', 'Koramangala', 'Whitefield', 'HSR Layout',
    'Jayanagar', 'Malleshwaram', 'Hebbal', 'Electronic City',
    'Banashankari', 'BTM Layout', 'Yelahanka', 'Marathahalli',
]

// ── Helper components ─────────────────────────────────────────
function Field({ label, children, colors }: { label: string; children: React.ReactNode; colors: any }) {
    return (
        <View style={s.field}>
            <Text style={[s.label, { color: colors.textSecondary }]}>{label}</Text>
            {children}
        </View>
    )
}

// ── Main screen ───────────────────────────────────────────────
export default function CreateGameScreen() {
    const router = useRouter()
    const { colors } = useTheme()

    // Form state
    const [title, setTitle] = useState('')
    const [sport, setSport] = useState<Sport | null>(null)
    const [venue, setVenue] = useState('')
    const [placeDetail, setPlaceDetail] = useState<PlaceDetail | null>(null)
    const [areaTags, setAreaTags] = useState<string[]>([])
    const [date, setDate] = useState('')
    const [time, setTime] = useState('')
    const [maxSlots, setMaxSlots] = useState(10)
    const [skillLevel, setSkillLevel] = useState('ALL')
    const [description, setDescription] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // ── Venue selection from Places ─────────────────────────────
    function handleVenueSelect(detail: PlaceDetail) {
        setPlaceDetail(detail)
        setVenue(detail.name)
    }

    // ── Area tag toggle ─────────────────────────────────────────
    function toggleAreaTag(tag: string) {
        setAreaTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag].slice(0, 3)
        )
    }

    // ── Validation ──────────────────────────────────────────────
    function validate(): string | null {
        if (!title.trim()) return 'Please enter a game title'
        if (!sport) return 'Please select a sport'
        if (!venue.trim()) return 'Please enter a venue'
        if (!date) return 'Please enter a date (YYYY-MM-DD)'
        if (!time) return 'Please enter a time (HH:MM)'
        const dt = new Date(`${date}T${time}:00`)
        if (isNaN(dt.getTime())) return 'Invalid date or time'
        if (dt <= new Date()) return 'Scheduled time must be in the future'
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
                lat: placeDetail?.lat,
                lng: placeDetail?.lng,
                placeId: placeDetail?.placeId,
                areaTags,
                scheduledAt,
                maxSlots,
                skillLevel,
                description: description.trim() || undefined,
            })

            Alert.alert('Game created! 🎉', `"${game.title}" is live.`, [
                { text: 'View game', onPress: () => router.replace({ pathname: '/game/[id]', params: { id: game.id } }) },
                { text: 'Go home', onPress: () => router.replace('/(tabs)') },
            ])
        } catch (err: any) {
            const msg = err?.response?.data?.message ?? 'Something went wrong. Please try again.'
            Alert.alert('Error', msg)
        } finally {
            setIsSubmitting(false)
        }
    }

    const inputStyle = [
        s.input,
        { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary },
    ]

    return (
        <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
            {/* Header */}
            <View style={[s.header, { borderBottomColor: colors.border }]}>
                <Pressable onPress={() => router.back()} accessibilityRole="button">
                    <Text style={[s.backBtn, { color: colors.brand }]}>← Back</Text>
                </Pressable>
                <Text style={[s.headerTitle, { color: colors.textPrimary }]}>Create game</Text>
                <View style={{ width: 60 }} />
            </View>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView
                    contentContainerStyle={s.scroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Title */}
                    <Field label="GAME TITLE" colors={colors}>
                        <TextInput
                            style={inputStyle}
                            placeholder="e.g. Evening 5-a-side at Kanteerava"
                            placeholderTextColor={colors.textSecondary}
                            value={title}
                            onChangeText={setTitle}
                            maxLength={100}
                            returnKeyType="next"
                        />
                    </Field>

                    {/* Sport */}
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

                    {/* Venue — Places autocomplete */}
                    <Field label="VENUE" colors={colors}>
                        <VenuePicker
                            value={venue}
                            onChange={(v) => { setVenue(v); if (!v) setPlaceDetail(null) }}
                            onSelect={handleVenueSelect}
                        />
                        {placeDetail && (
                            <View style={[s.placeConfirmed, { backgroundColor: colors.brandLight }]}>
                                <Text style={[s.placeConfirmedText, { color: colors.brand }]}>
                                    📍 {placeDetail.address}
                                </Text>
                            </View>
                        )}
                        {venue && !placeDetail && (
                            <Text style={[s.placeHint, { color: colors.textSecondary }]}>
                                ⚠️ Select from suggestions to enable radius search
                            </Text>
                        )}
                    </Field>

                    {/* Area tags */}
                    <Field label="AREA TAGS (pick up to 3)" colors={colors}>
                        <View style={s.areaGrid}>
                            {BENGALURU_AREAS.map((area) => {
                                const active = areaTags.includes(area)
                                return (
                                    <Pressable
                                        key={area}
                                        style={[
                                            s.areaChip,
                                            {
                                                backgroundColor: active ? colors.brandLight : colors.surface,
                                                borderColor: active ? colors.brand : colors.border,
                                            },
                                        ]}
                                        onPress={() => toggleAreaTag(area)}
                                    >
                                        <Text style={[s.areaChipText, { color: active ? colors.brand : colors.textSecondary }]}>
                                            {area}
                                        </Text>
                                    </Pressable>
                                )
                            })}
                        </View>
                    </Field>

                    {/* Date & Time */}
                    <View style={s.row}>
                        <View style={{ flex: 1 }}>
                            <Field label="DATE" colors={colors}>
                                <TextInput
                                    style={inputStyle}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor={colors.textSecondary}
                                    value={date}
                                    onChangeText={setDate}
                                    keyboardType="numeric"
                                    maxLength={10}
                                />
                            </Field>
                        </View>
                        <View style={{ width: spacing.md }} />
                        <View style={{ flex: 1 }}>
                            <Field label="TIME" colors={colors}>
                                <TextInput
                                    style={inputStyle}
                                    placeholder="HH:MM"
                                    placeholderTextColor={colors.textSecondary}
                                    value={time}
                                    onChangeText={setTime}
                                    keyboardType="numeric"
                                    maxLength={5}
                                />
                            </Field>
                        </View>
                    </View>

                    {/* Max slots */}
                    <Field label="MAX PLAYERS" colors={colors}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.slotsRow}>
                            {SLOT_OPTIONS.map((n) => {
                                const active = maxSlots === n
                                return (
                                    <Pressable
                                        key={n}
                                        style={[s.slotChip, { backgroundColor: active ? colors.brand : colors.surface, borderColor: active ? colors.brand : colors.border }]}
                                        onPress={() => setMaxSlots(n)}
                                    >
                                        <Text style={[s.slotChipText, { color: active ? '#fff' : colors.textSecondary }]}>{n}</Text>
                                    </Pressable>
                                )
                            })}
                        </ScrollView>
                    </Field>

                    {/* Skill level */}
                    <Field label="SKILL LEVEL" colors={colors}>
                        <View style={s.skillRow}>
                            {SKILL_LEVELS.map((sk) => {
                                const active = skillLevel === sk.value
                                return (
                                    <Pressable
                                        key={sk.value}
                                        style={[
                                            s.skillChip,
                                            {
                                                backgroundColor: active ? colors.brand : colors.surface,
                                                borderColor: active ? colors.brand : colors.border,
                                                flex: 1,
                                            },
                                        ]}
                                        onPress={() => setSkillLevel(sk.value)}
                                    >
                                        <Text style={[s.skillChipText, { color: active ? '#fff' : colors.textSecondary }]}>
                                            {sk.label}
                                        </Text>
                                    </Pressable>
                                )
                            })}
                        </View>
                    </Field>

                    {/* Description */}
                    <Field label="DESCRIPTION (OPTIONAL)" colors={colors}>
                        <TextInput
                            style={[inputStyle, s.textarea]}
                            placeholder="Skill level, what to bring, parking info…"
                            placeholderTextColor={colors.textSecondary}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={4}
                            maxLength={500}
                            textAlignVertical="top"
                        />
                        <Text style={[s.charCount, { color: colors.textSecondary }]}>{description.length + "/500"}</Text>
                    </Field>

                    {/* Submit */}
                    <Pressable
                        style={[s.submitBtn, { backgroundColor: isSubmitting ? colors.brandDark : colors.brand }]}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                        accessibilityRole="button"
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
    sportChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: 0.5 },
    sportIcon: { fontSize: 15 },
    sportLabel: { fontSize: 13, fontWeight: '500' },

    placeConfirmed: { marginTop: spacing.sm, padding: spacing.sm, borderRadius: radius.sm },
    placeConfirmedText: { fontSize: 12 },
    placeHint: { fontSize: 12, marginTop: spacing.xs },

    areaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    areaChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, borderRadius: radius.pill, borderWidth: 0.5 },
    areaChipText: { fontSize: 13, fontWeight: '500' },

    slotsRow: { gap: spacing.sm, paddingVertical: 2 },
    slotChip: { width: 44, height: 44, borderRadius: radius.sm, borderWidth: 0.5, alignItems: 'center', justifyContent: 'center' },
    slotChipText: { fontSize: 14, fontWeight: '500' },

    skillRow: { flexDirection: 'row', gap: spacing.sm },
    skillChip: { paddingVertical: spacing.sm, borderRadius: radius.sm, borderWidth: 0.5, alignItems: 'center' },
    skillChipText: { fontSize: 12, fontWeight: '500' },

    submitBtn: { borderRadius: radius.md, paddingVertical: spacing.lg, alignItems: 'center', marginTop: spacing.sm },
    submitBtnText: { fontSize: 16, fontWeight: '500', color: '#fff' },
})