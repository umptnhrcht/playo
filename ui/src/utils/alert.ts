import { Alert, Platform } from 'react-native'

export interface AlertButton {
    text: string
    style?: 'default' | 'cancel' | 'destructive'
    onPress?: () => void
}

/**
 * Platform-agnostic alert.
 * - Web:    uses window.alert / window.confirm
 * - Native: uses React Native Alert.alert
 */
export const AppAlert = {
    /**
     * Show a simple message alert.
     */
    alert(title: string, message?: string, onDismiss?: () => void) {
        if (Platform.OS === 'web') {
            window.alert(message ? `${title}\n\n${message}` : title)
            onDismiss?.()
        } else {
            Alert.alert(title, message, [{ text: 'OK', onPress: onDismiss }])
        }
    },

    /**
     * Show a confirm dialog. Returns a Promise<boolean>.
     * - Web:    window.confirm → resolves immediately
     * - Native: Alert with Cancel/Confirm buttons → resolves on tap
     */
    confirm(
        title: string,
        message?: string,
        options?: {
            confirmText?: string
            cancelText?: string
            destructive?: boolean
        }
    ): Promise<boolean> {
        const confirmText = options?.confirmText ?? 'Confirm'
        const cancelText = options?.cancelText ?? 'Cancel'

        if (Platform.OS === 'web') {
            const result = window.confirm(message ? `${title}\n\n${message}` : title)
            return Promise.resolve(result)
        }

        return new Promise((resolve) => {
            Alert.alert(title, message, [
                {
                    text: cancelText,
                    style: 'cancel',
                    onPress: () => resolve(false),
                },
                {
                    text: confirmText,
                    style: options?.destructive ? 'destructive' : 'default',
                    onPress: () => resolve(true),
                },
            ])
        })
    },

    /**
     * Show an action sheet style prompt with multiple options.
     * - Web:    falls back to window.confirm for destructive actions
     * - Native: Alert with multiple buttons
     */
    prompt(title: string, message?: string, buttons: AlertButton[] = []) {
        if (Platform.OS === 'web') {
            // On web, simulate with sequential confirms for destructive buttons
            const destructive = buttons.find((b) => b.style === 'destructive')
            const cancel = buttons.find((b) => b.style === 'cancel')

            if (destructive) {
                const confirmed = window.confirm(
                    message ? `${title}\n\n${message}` : title
                )
                if (confirmed) destructive.onPress?.()
                else cancel?.onPress?.()
            } else {
                window.alert(message ? `${title}\n\n${message}` : title)
                buttons.find((b) => b.style !== 'cancel')?.onPress?.()
            }
        } else {
            Alert.alert(title, message, buttons)
        }
    },
}