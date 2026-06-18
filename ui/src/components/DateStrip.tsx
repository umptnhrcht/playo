import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { radius, spacing } from '../theme';
import { useTheme } from '../theme/ThemeContext';

// Generate next 14 days from today
function generateDays(count = 14): { date: Date; key: string; dayLabel: string; dateLabel: string; isToday: boolean }[] {
    const days = []
    const now = new Date()

    for (let i = 0; i < count; i++) {
        const date = new Date(now)
        date.setDate(now.getDate() + i)
        date.setHours(0, 0, 0, 0)

        const key = date.toISOString().split('T')[0]  // YYYY-MM-DD
        const dayLabel = i === 0 ? 'Today' : i === 1 ? 'Tmrw' : date.toLocaleDateString('en-IN', { weekday: 'short' })
        const dateLabel = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

        days.push({ date, key, dayLabel, dateLabel, isToday: i === 0 })
    }

    return days
}

const DAYS = generateDays()

interface Props {
    selected: string | undefined   // YYYY-MM-DD or undefined = all dates
    onChange: (date: string | undefined) => void
}

export function DateStrip({ selected, onChange }: Props) {
    const { colors } = useTheme()

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.container}
        >
            {/* "All" chip */}
            <Pressable
                style={[
                    s.chip,
                    {
                        backgroundColor: !selected ? colors.brandDark : colors.surface,
                        borderColor: !selected ? colors.brandDark : colors.border,
                    },
                ]}
                onPress={() => onChange(undefined)}
                accessibilityRole="radio"
                accessibilityState={{ checked: !selected }}
                accessibilityLabel="All dates"
            >
                <Text style={[s.chipDay, { color: !selected ? colors.textInverse : colors.textSecondary }]}>
                    All
                </Text>
                <Text style={[s.chipDate, { color: !selected ? colors.textInverse : colors.textSecondary }]}>
                    dates
                </Text>
            </Pressable>

            {DAYS.map((d) => {
                const active = selected === d.key
                return (
                    <Pressable
                        key={d.key}
                        style={[
                            s.chip,
                            {
                                backgroundColor: active ? colors.brandDark : colors.surface,
                                borderColor: active ? colors.brandDark : d.isToday ? colors.brand : colors.border,
                            },
                        ]}
                        onPress={() => onChange(active ? undefined : d.key)}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: active }}
                        accessibilityLabel={d.dayLabel + ' ' + d.dateLabel}
                    >
                        <Text style={[
                            s.chipDay,
                            {
                                color: active ? colors.textInverse : d.isToday ? colors.brand : colors.textSecondary,
                                fontWeight: d.isToday ? '600' : '500',
                            },
                        ]}>
                            {d.dayLabel}
                        </Text>
                        <Text style={[
                            s.chipDate,
                            { color: active ? colors.textInverse : colors.textSecondary },
                        ]}>
                            {d.dateLabel}
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
        paddingBottom: spacing.md,
        gap: spacing.sm,
        alignItems: 'center',
    },
    chip: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.md,
        borderWidth: 0.5,
        minWidth: 56,
        alignSelf: 'flex-start',
    },
    chipDay: {
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 2,
    },
    chipDate: {
        fontSize: 11,
    },
})