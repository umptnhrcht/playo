import * as Google from 'expo-auth-session/providers/google'
import * as WebBrowser from 'expo-web-browser'
import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'

WebBrowser.maybeCompleteAuthSession()

export function useGoogleAuth() {
    const { signIn, signInWithAccessToken, isLoading } = useAuthStore();

    const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID,
        scopes: ['openid', 'profile', 'email'],
    })

    useEffect(() => {
        if (response?.type !== 'success') return

        const idToken = response.authentication?.idToken
        const accessToken = response.authentication?.accessToken

        if (idToken) {
            signIn(idToken)
        } else if (accessToken) {
            signInWithAccessToken(accessToken)
        }
    }, [response])

    return {
        signIn: () => promptAsync(),
        isLoading: isLoading || !request,
    }
}