import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '../theme';
import type { Sport } from '../types';

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
                        style={[s.chip, active && s.chipActive]}
                        onPress={() => onChange(f.value)}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: active }}
                        accessibilityLabel={`Filter by ${f.label}`}
                    >
                        <Text style={[s.chipText, active && s.chipTextActive]}>{f.label}</Text>
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
    },
    chip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs + 2,
        borderRadius: radius.pill,
        borderWidth: 0.5,
        borderColor: colors.gray[200],
        backgroundColor: colors.white,
    },
    chipActive: {
        backgroundColor: colors.purple[800],
        borderColor: colors.purple[800],
    },
    chipText: {
        fontSize: 13,
        fontWeight: '500',
        color: colors.gray[400],
    },
    chipTextActive: {
        color: colors.purple[50],
    },
})