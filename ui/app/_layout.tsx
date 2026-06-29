import { Stack, useRouter, useSegments } from 'expo-router'
import { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Dialog } from '../src/components/Dialog'
import { useAuthStore } from '../src/store/authStore'
import { ThemeProvider } from '../src/theme/ThemeContext'
import { useDialogState } from '../src/utils/alert'

// ── DialogHost — renders the Dialog on web only ───────────────
function DialogHost() {
  const { visible, title, message, buttons, dismiss } = useDialogState()
  if (Platform.OS !== 'web') return null
  return (
    <Dialog
      visible={visible}
      title={title}
      message={message}
      buttons={buttons}
      onDismiss={dismiss}
    />
  )
}

// ── Root layout ───────────────────────────────────────────────
export default function RootLayout() {
  const { user, hydrate } = useAuthStore()
  const router = useRouter()
  const segments = useSegments()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    hydrate().finally(() => setHydrated(true))
  }, [])

  useEffect(() => {
    if (!hydrated) return
    const inAuthGroup = (segments[0] as string) === '(auth)'
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)')
    }
  }, [hydrated, user, segments])

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }} />
        <DialogHost />
      </ThemeProvider>
    </SafeAreaProvider>
  )
}