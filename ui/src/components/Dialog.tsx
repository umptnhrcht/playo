import { useEffect } from 'react'
import {
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import { radius, spacing } from '../theme'
import { useTheme } from '../theme/ThemeContext'

export interface DialogButton {
    text: string
    style?: 'default' | 'cancel' | 'destructive'
    onPress?: () => void
}

interface DialogProps {
    visible: boolean
    title: string
    message?: string
    buttons: DialogButton[]
    onDismiss: () => void
}

// ── Web-only dialog overlay ───────────────────────────────────
// Only rendered on web — native uses Alert.alert
export function Dialog({ visible, title, message, buttons, onDismiss }: DialogProps) {
    const { colors } = useTheme()

    // Close on Escape key
    useEffect(() => {
        if (!visible || Platform.OS !== 'web') return
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                const cancelBtn = buttons.find((b) => b.style === 'cancel')
                cancelBtn?.onPress?.()
                onDismiss()
            }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [visible, buttons, onDismiss])

    if (!visible) return null

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onDismiss}
        >
            {/* Backdrop */}
            <Pressable
                style={[s.backdrop]}
                onPress={() => {
                    const cancelBtn = buttons.find((b) => b.style === 'cancel')
                    cancelBtn?.onPress?.()
                    onDismiss()
                }}
                accessibilityLabel="Dismiss dialog"
            >
                {/* Dialog box — stop propagation so tapping inside doesn't dismiss */}
                <Pressable
                    style={[s.dialog, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={(e) => e.stopPropagation?.()}
                >
                    <Text style={[s.title, { color: colors.textPrimary }]}>{title}</Text>
                    {message && (
                        <Text style={[s.message, { color: colors.textSecondary }]}>{message}</Text>
                    )}

                    {/* Buttons */}
                    <View style={[s.btnRow, { borderTopColor: colors.border }]}>
                        {buttons.map((btn, i) => {
                            const isDestructive = btn.style === 'destructive'
                            const isCancel = btn.style === 'cancel'
                            const color = isDestructive
                                ? colors.danger
                                : isCancel
                                    ? colors.textSecondary
                                    : colors.brand

                            return (
                                <Pressable
                                    key={i}
                                    style={({ pressed }) => [
                                        s.btn,
                                        i < buttons.length - 1 && { borderRightWidth: 0.5, borderRightColor: colors.border },
                                        pressed && { backgroundColor: colors.surfaceSecondary },
                                    ]}
                                    onPress={() => {
                                        btn.onPress?.()
                                        onDismiss()
                                    }}
                                    accessibilityRole="button"
                                    accessibilityLabel={btn.text}
                                >
                                    <Text style={[
                                        s.btnText,
                                        { color },
                                        isCancel && { fontWeight: '400' },
                                        isDestructive && { fontWeight: '600' },
                                    ]}>
                                        {btn.text}
                                    </Text>
                                </Pressable>
                            )
                        })}
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    )
}

const s = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
    },
    dialog: {
        width: '100%',
        maxWidth: 400,
        borderRadius: radius.lg,
        borderWidth: 0.5,
        overflow: 'hidden',
    },
    title: {
        fontSize: 17,
        fontWeight: '600',
        textAlign: 'center',
        paddingTop: spacing.xl,
        paddingHorizontal: spacing.xl,
    },
    message: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        paddingTop: spacing.sm,
        paddingBottom: spacing.lg,
        paddingHorizontal: spacing.xl,
    },
    btnRow: {
        flexDirection: 'row',
        borderTopWidth: 0.5,
    },
    btn: {
        flex: 1,
        paddingVertical: spacing.md + 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnText: {
        fontSize: 16,
        fontWeight: '500',
    },
})