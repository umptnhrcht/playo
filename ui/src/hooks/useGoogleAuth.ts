import * as Google from 'expo-auth-session/providers/google'
import * as WebBrowser from 'expo-web-browser'
import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'

// Required for the auth redirect to close the browser on Android
WebBrowser.maybeCompleteAuthSession()

export function useGoogleAuth() {
    const { signIn, isLoading } = useAuthStore()

    const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID,
    })

    useEffect(() => {
        if (response?.type !== 'success') return
        const idToken = response.authentication?.idToken
        if (idToken) signIn(idToken)
    }, [response])

    return {
        signIn: () => promptAsync(),
        isLoading: isLoading || !request,
    }
}
