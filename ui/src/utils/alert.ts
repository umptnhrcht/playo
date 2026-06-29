import { Alert, Platform } from 'react-native'
import type { DialogButton } from '../components/Dialog'

// ── Internal dialog state ─────────────────────────────────────
// Stored in a simple pub/sub so AppAlert can trigger the
// DialogHost (rendered in _layout.tsx) without prop drilling.

type DialogState = {
    visible: boolean
    title: string
    message?: string
    buttons: DialogButton[]
}

type Listener = (state: DialogState) => void

let _listener: Listener | null = null
let _state: DialogState = { visible: false, title: '', buttons: [] }

function publish(state: DialogState) {
    _state = state
    _listener?.(state)
}

/** Register the DialogHost listener — called once in _layout.tsx */
export function registerDialogListener(fn: Listener) {
    _listener = fn
    // Replay current state in case dialog was triggered before host mounted
    fn(_state)
}

function showDialog(title: string, message?: string, buttons: DialogButton[] = []) {
    publish({ visible: true, title, message, buttons })
}

function dismiss() {
    publish({ visible: false, title: '', buttons: [] })
}

// ── Public API ────────────────────────────────────────────────
export const AppAlert = {
    /**
     * Simple message alert.
     */
    alert(title: string, message?: string, onDismiss?: () => void) {
        if (Platform.OS === 'web') {
            showDialog(title, message, [
                { text: 'OK', style: 'default', onPress: onDismiss },
            ])
        } else {
            Alert.alert(title, message, [{ text: 'OK', onPress: onDismiss }])
        }
    },

    /**
     * Confirm dialog — returns Promise<boolean>.
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
            return new Promise((resolve) => {
                showDialog(title, message, [
                    { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
                    { text: confirmText, style: options?.destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
                ])
            })
        }

        return new Promise((resolve) => {
            Alert.alert(title, message, [
                { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
                { text: confirmText, style: options?.destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
            ])
        })
    },

    /**
     * Multi-button prompt.
     */
    prompt(title: string, message?: string, buttons: DialogButton[] = []) {
        if (Platform.OS === 'web') {
            showDialog(title, message, buttons)
        } else {
            Alert.alert(title, message, buttons)
        }
    },
}

// ── DialogHost state hook ─────────────────────────────────────
// Used by DialogHost in _layout.tsx
import { useEffect, useState } from 'react'

export function useDialogState() {
    const [state, setState] = useState<DialogState>(_state)

    useEffect(() => {
        registerDialogListener(setState)
        return () => { _listener = null }
    }, [])

    return { ...state, dismiss }
}