import { useCallback, useRef, useState } from 'react'
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native'
import type { PlaceDetail, PlacePrediction } from '../api/places'
import { fetchPlaceDetail, fetchPlacePredictions } from '../api/places'
import { radius, spacing } from '../theme'
import { useTheme } from '../theme/ThemeContext'

// Generate a UUID v4 for Places session token
function uuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
    })
}

interface Props {
    value: string
    onChange: (venue: string) => void
    onSelect: (detail: PlaceDetail) => void
    error?: string
}

export function VenuePicker({ value, onChange, onSelect, error }: Props) {
    const { colors } = useTheme()
    const sessionToken = useRef(uuid())
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const [predictions, setPredictions] = useState<PlacePrediction[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [showList, setShowList] = useState(false)

    const search = useCallback((text: string) => {
        onChange(text)
        if (debounceRef.current) clearTimeout(debounceRef.current)

        if (text.length < 2) {
            setPredictions([])
            setShowList(false)
            return
        }

        debounceRef.current = setTimeout(async () => {
            setIsLoading(true)
            try {
                const results = await fetchPlacePredictions(text, sessionToken.current)
                setPredictions(results)
                setShowList(results.length > 0)
            } catch {
                setPredictions([])
            } finally {
                setIsLoading(false)
            }
        }, 350)
    }, [onChange])

    async function handleSelect(prediction: PlacePrediction) {
        setIsLoading(true)
        setShowList(false)
        setPredictions([])

        try {
            const detail = await fetchPlaceDetail(prediction.placeId, sessionToken.current)
            onChange(prediction.mainText)
            onSelect(detail)
            // Reset session token — Google bills per session
            sessionToken.current = uuid()
        } catch {
            onChange(prediction.description)
        } finally {
            setIsLoading(false)
        }
    }

    const inputStyle = [
        s.input,
        {
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : colors.border,
            color: colors.textPrimary,
        },
    ]

    return (
        <View>
            <View style={s.inputRow}>
                <TextInput
                    style={[inputStyle, { flex: 1 }]}
                    placeholder="Search for a venue or sports facility"
                    placeholderTextColor={colors.textSecondary}
                    value={value}
                    onChangeText={search}
                    returnKeyType="search"
                    autoCorrect={false}
                />
                {isLoading && (
                    <ActivityIndicator
                        style={s.spinner}
                        color={colors.brand}
                        size="small"
                    />
                )}
            </View>

            {error && (
                <Text style={[s.errorText, { color: colors.danger }]}>{error}</Text>
            )}

            {/* Predictions dropdown */}
            {showList && (
                <View style={[s.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <FlatList
                        data={predictions}
                        keyExtractor={(p) => p.placeId}
                        keyboardShouldPersistTaps="handled"
                        scrollEnabled={false}
                        renderItem={({ item, index }) => (
                            <Pressable
                                style={[
                                    s.prediction,
                                    {
                                        borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
                                        borderTopColor: colors.border,
                                    },
                                ]}
                                onPress={() => handleSelect(item)}
                            >
                                <Text style={[s.predictionMain, { color: colors.textPrimary }]} numberOfLines={1}>
                                    {item.mainText}
                                </Text>
                                <Text style={[s.predictionSub, { color: colors.textSecondary }]} numberOfLines={1}>
                                    {item.secondaryText}
                                </Text>
                            </Pressable>
                        )}
                    />
                </View>
            )}
        </View>
    )
}

const s = StyleSheet.create({
    inputRow: { flexDirection: 'row', alignItems: 'center' },
    input: { borderWidth: 0.5, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 15, flex: 1 },
    spinner: { position: 'absolute', right: spacing.md },
    errorText: { fontSize: 12, marginTop: spacing.xs },
    dropdown: { borderWidth: 0.5, borderRadius: radius.md, marginTop: spacing.xs, overflow: 'hidden' },
    prediction: { paddingHorizontal: spacing.md, paddingVertical: spacing.md },
    predictionMain: { fontSize: 14, fontWeight: '500', marginBottom: 2 },
    predictionSub: { fontSize: 12 },
})