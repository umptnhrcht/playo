import { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from 'react-native'
import { radius, spacing } from '../theme'
import { useTheme } from '../theme/ThemeContext'
import type { GamesFilter, SkillLevel, Sport } from '../types'

const SPORTS: { label: string; value: Sport | 'ALL' }[] = [
    { label: 'All sports', value: 'ALL' },
    { label: 'Football', value: 'FOOTBALL' },
    { label: 'Badminton', value: 'BADMINTON' },
    { label: 'Cricket', value: 'CRICKET' },
    { label: 'Tennis', value: 'TENNIS' },
    { label: 'Basketball', value: 'BASKETBALL' },
    { label: 'Pickleball', value: 'PICKLEBALL' },
    { label: 'Other', value: 'OTHER' },
]

const SKILL_LEVELS: { label: string; value: SkillLevel | 'ALL'; sub: string }[] = [
    { label: 'All levels', value: 'ALL', sub: 'Everyone welcome' },
    { label: 'Beginner', value: 'BEGINNER', sub: 'Learning the game' },
    { label: 'Intermediate', value: 'INTERMEDIATE', sub: 'Plays regularly' },
    { label: 'Pro', value: 'PRO', sub: 'Competitive level' },
]

const RADIUS_OPTIONS = [2, 5, 10, 20, 50]

const BENGALURU_AREAS = [
    'Indiranagar', 'Koramangala', 'Whitefield', 'HSR Layout',
    'Jayanagar', 'Malleshwaram', 'Hebbal', 'Electronic City',
    'Banashankari', 'BTM Layout', 'Yelahanka', 'Marathahalli',
]

interface Props {
    visible: boolean
    filter: GamesFilter
    isLocating: boolean
    onApply: (filter: GamesFilter) => void
    onClose: () => void
    // Returns coords so the sheet can update its draft immediately
    onNearMe: () => Promise<{ lat: number; lng: number } | null>
}

export function FilterSheet({ visible, filter, isLocating, onApply, onClose, onNearMe }: Props) {
    const { colors } = useTheme()
    const [draft, setDraft] = useState<GamesFilter>(filter)

    // Sync draft when sheet opens
    useEffect(() => {
        if (visible) setDraft(filter)
    }, [visible])

    // Also sync when external filter changes (e.g. coords landed from quick toggle)
    useEffect(() => {
        setDraft((prev) => ({ ...prev, lat: filter.lat, lng: filter.lng, radius: filter.radius }))
    }, [filter.lat, filter.lng])

    async function handleNearMeToggle(on: boolean) {
        if (!on) {
            setDraft((p) => ({ ...p, lat: undefined, lng: undefined, radius: undefined }))
            return
        }
        const coords = await onNearMe()
        if (coords) {
            setDraft((p) => ({ ...p, lat: coords.lat, lng: coords.lng, radius: p.radius ?? 10 }))
        }
    }

    function toggleAreaTag(tag: string) {
        setDraft((prev) => {
            const tags = prev.areaTags ?? []
            return {
                ...prev,
                areaTags: tags.includes(tag)
                    ? tags.filter((t) => t !== tag)
                    : [...tags, tag].slice(0, 3),
            }
        })
    }

    function clearAll() {
        setDraft({})
    }

    const hasNearMe = draft.lat !== undefined && draft.lng !== undefined

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={[s.sheet, { backgroundColor: colors.background }]}>

                {/* Header */}
                <View style={[s.sheetHeader, { borderBottomColor: colors.border }]}>
                    <Pressable onPress={clearAll} accessibilityRole="button">
                        <Text style={[s.clearBtn, { color: colors.danger }]}>Clear all</Text>
                    </Pressable>
                    <Text style={[s.sheetTitle, { color: colors.textPrimary }]}>Filters</Text>
                    <Pressable onPress={onClose} accessibilityRole="button">
                        <Text style={[s.doneBtn, { color: colors.brand }]}>Done</Text>
                    </Pressable>
                </View>

                <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

                    {/* ── Location ─────────────────────────────────────── */}
                    <View style={s.section}>
                        <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Location</Text>

                        <View style={[s.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <View style={s.rowLeft}>
                                <Text style={[s.rowTitle, { color: colors.textPrimary }]}>Near me</Text>
                                <Text style={[s.rowSub, { color: colors.textSecondary }]}>
                                    {hasNearMe
                                        ? 'Within ' + (draft.radius ?? 10) + 'km of your location'
                                        : 'Use your current location'}
                                </Text>
                            </View>
                            {isLocating
                                ? <ActivityIndicator color={colors.brand} />
                                : <Switch
                                    value={hasNearMe}
                                    onValueChange={handleNearMeToggle}
                                    trackColor={{ true: colors.brand, false: colors.border }}
                                    thumbColor={colors.surface}
                                />
                            }
                        </View>

                        {/* Radius — only when near me is on */}
                        {hasNearMe && (
                            <View>
                                <Text style={[s.subLabel, { color: colors.textSecondary }]}>Radius</Text>
                                <View style={s.chipGrid}>
                                    {RADIUS_OPTIONS.map((km) => {
                                        const active = (draft.radius ?? 10) === km
                                        return (
                                            <Pressable
                                                key={km}
                                                style={[
                                                    s.chip,
                                                    {
                                                        backgroundColor: active ? colors.brand : colors.surface,
                                                        borderColor: active ? colors.brand : colors.border,
                                                    },
                                                ]}
                                                onPress={() => setDraft((p) => ({ ...p, radius: km }))}
                                            >
                                                <Text style={[s.chipText, { color: active ? '#fff' : colors.textSecondary }]}>
                                                    {km + 'km'}
                                                </Text>
                                            </Pressable>
                                        )
                                    })}
                                </View>
                            </View>
                        )}
                    </View>

                    {/* ── Area tags ─────────────────────────────────────── */}
                    <View style={s.section}>
                        <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Area</Text>
                        <Text style={[s.sectionSub, { color: colors.textSecondary }]}>Pick up to 3 areas</Text>
                        <View style={s.chipGrid}>
                            {BENGALURU_AREAS.map((area) => {
                                const active = (draft.areaTags ?? []).includes(area)
                                return (
                                    <Pressable
                                        key={area}
                                        style={[
                                            s.chip,
                                            {
                                                backgroundColor: active ? colors.brandLight : colors.surface,
                                                borderColor: active ? colors.brand : colors.border,
                                            },
                                        ]}
                                        onPress={() => toggleAreaTag(area)}
                                    >
                                        <Text style={[s.chipText, { color: active ? colors.brand : colors.textSecondary }]}>
                                            {area}
                                        </Text>
                                    </Pressable>
                                )
                            })}
                        </View>
                    </View>

                    {/* ── Sport ────────────────────────────────────────── */}
                    <View style={s.section}>
                        <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Sport</Text>
                        <View style={s.chipGrid}>
                            {SPORTS.map((sp) => {
                                const active = (draft.sport ?? 'ALL') === sp.value
                                return (
                                    <Pressable
                                        key={sp.value}
                                        style={[
                                            s.chip,
                                            {
                                                backgroundColor: active ? colors.brandLight : colors.surface,
                                                borderColor: active ? colors.brand : colors.border,
                                            },
                                        ]}
                                        onPress={() => setDraft((p) => ({ ...p, sport: sp.value }))}
                                    >
                                        <Text style={[s.chipText, { color: active ? colors.brand : colors.textSecondary }]}>
                                            {sp.label}
                                        </Text>
                                    </Pressable>
                                )
                            })}
                        </View>
                    </View>

                    {/* ── Skill level ───────────────────────────────────── */}
                    <View style={s.section}>
                        <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Skill level</Text>
                        <View style={s.skillList}>
                            {SKILL_LEVELS.map((sk) => {
                                const active = (draft.skillLevel ?? 'ALL') === sk.value
                                return (
                                    <Pressable
                                        key={sk.value}
                                        style={[
                                            s.skillRow,
                                            {
                                                backgroundColor: active ? colors.brandLight : colors.surface,
                                                borderColor: active ? colors.brand : colors.border,
                                            },
                                        ]}
                                        onPress={() => setDraft((p) => ({ ...p, skillLevel: sk.value }))}
                                    >
                                        <View style={s.skillText}>
                                            <Text style={[s.skillLabel, { color: active ? colors.brand : colors.textPrimary }]}>
                                                {sk.label}
                                            </Text>
                                            <Text style={[s.skillSub, { color: colors.textSecondary }]}>{sk.sub}</Text>
                                        </View>
                                        {active && <Text style={{ color: colors.brand }}>✓</Text>}
                                    </Pressable>
                                )
                            })}
                        </View>
                    </View>

                </ScrollView>

                {/* Apply */}
                <View style={[s.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
                    <Pressable
                        style={[s.applyBtn, { backgroundColor: colors.brand }]}
                        onPress={() => { onApply(draft); onClose() }}
                        accessibilityRole="button"
                    >
                        <Text style={s.applyBtnText}>Apply filters</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    )
}

const s = StyleSheet.create({
    sheet: { flex: 1 },
    sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 0.5 },
    clearBtn: { fontSize: 14, width: 70 },
    sheetTitle: { fontSize: 16, fontWeight: '500' },
    doneBtn: { fontSize: 14, width: 70, textAlign: 'right' },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },

    section: { marginBottom: spacing.xl },
    sectionTitle: { fontSize: 15, fontWeight: '500', marginBottom: spacing.xs },
    sectionSub: { fontSize: 12, marginBottom: spacing.md },
    subLabel: { fontSize: 12, fontWeight: '500', marginTop: spacing.md, marginBottom: spacing.sm },

    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderRadius: radius.md, borderWidth: 0.5, marginBottom: spacing.md },
    rowLeft: { flex: 1, marginRight: spacing.md },
    rowTitle: { fontSize: 15, fontWeight: '500', marginBottom: 2 },
    rowSub: { fontSize: 12 },

    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, borderRadius: radius.pill, borderWidth: 0.5 },
    chipText: { fontSize: 13, fontWeight: '500' },

    skillList: { gap: spacing.sm },
    skillRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderRadius: radius.md, borderWidth: 0.5 },
    skillText: { flex: 1 },
    skillLabel: { fontSize: 14, fontWeight: '500', marginBottom: 2 },
    skillSub: { fontSize: 12 },

    footer: { padding: spacing.lg, borderTopWidth: 0.5 },
    applyBtn: { borderRadius: radius.md, paddingVertical: spacing.md + 2, alignItems: 'center' },
    applyBtnText: { fontSize: 15, fontWeight: '500', color: '#fff' },
})