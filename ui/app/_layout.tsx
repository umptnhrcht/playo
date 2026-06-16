import { Stack, useRouter, useSegments } from 'expo-router'
import { useEffect, useState } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useAuthStore } from '../src/store/authStore'
import { ThemeProvider } from '../src/theme/ThemeContext'

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
      </ThemeProvider>
    </SafeAreaProvider>
  )
}