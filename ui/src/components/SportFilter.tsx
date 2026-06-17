import { Pressable, ScrollView, StyleSheet, Text } from 'react-native'
import { radius, spacing } from '../theme'
import { useTheme } from '../theme/ThemeContext'
import type { Sport } from '../types'

const FILTERS: { label: string; value: Sport | 'ALL' }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Football', value: 'FOOTBALL' },
    { label: 'Badminton', value: 'BADMINTON' },
    { label: 'Cricket', value: 'CRICKET' },
    { label: 'Tennis', value: 'TENNIS' },
    { label: 'Basketball', value: 'BASKETBALL' },
    { label: 'Pickleball', value: 'PICKLEBALL' },
]

interface Props {
    selected: Sport | 'ALL'
    onChange: (sport: Sport | 'ALL') => void
}

export function SportFilter({ selected, onChange }: Props) {
    const { colors } = useTheme()

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.container}
        >
            {FILTERS.map((f) => {
                const active = selected === f.value
                return (
                    <Pressable
                        key={f.value}
                        style={[
                            s.chip,
                            {
                                borderColor: active ? colors.brandDark : colors.border,
                                backgroundColor: active ? colors.brandDark : colors.surface,
                            },
                        ]}
                        onPress={() => onChange(f.value)}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: active }}
                        accessibilityLabel={`Filter by ${f.label}`}
                    >
                        <Text style={[s.chipText, { color: active ? colors.textInverse : colors.textSecondary }]}>
                            {f.label}
                        </Text>
                    </Pressable>
                )
            })}
        </ScrollView>
    )
}

const s = StyleSheet.create({
    container: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
        gap: spacing.sm,
        alignItems: 'center',   // ← fixes the stretching height
    },
    chip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs + 2,
        borderRadius: radius.pill,
        borderWidth: 0.5,
        alignSelf: 'flex-start',  // ← chip only as tall as its content
    },
    chipText: {
        fontSize: 13,
        fontWeight: '500',
    },
})