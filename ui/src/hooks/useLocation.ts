import * as Location from 'expo-location'
import { useState } from 'react'

export interface Coords {
    lat: number
    lng: number
}

export function useLocation() {
    const [coords, setCoords] = useState<Coords | null>(null)
    const [isLocating, setIsLocating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function requestLocation(): Promise<Coords | null> {
        setIsLocating(true)
        setError(null)

        try {
            const { status } = await Location.requestForegroundPermissionsAsync()
            if (status !== 'granted') {
                setError('Location permission denied. Enable it in Settings.')
                return null
            }

            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            })

            const result: Coords = {
                lat: loc.coords.latitude,
                lng: loc.coords.longitude,
            }
            setCoords(result)
            return result
        } catch {
            setError('Could not get your location. Please try again.')
            return null
        } finally {
            setIsLocating(false)
        }
    }

    function clearLocation() {
        setCoords(null)
        setError(null)
    }

    return { coords, isLocating, error, requestLocation, clearLocation }
}