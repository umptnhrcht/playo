// ── Google Places service (backend proxy) ─────────────────────
// We proxy Places calls through the backend so the API key
// never ships in the client bundle.

const MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY!

export interface PlacePrediction {
    placeId: string
    description: string
    mainText: string
    secondaryText: string
}

export interface PlaceDetail {
    placeId: string
    name: string
    address: string
    lat: number
    lng: number
}

// Autocomplete — returns list of place suggestions
export async function autocompletePlaces(
    input: string,
    sessionToken: string
): Promise<PlacePrediction[]> {
    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json')
    url.searchParams.set('input', input)
    url.searchParams.set('key', MAPS_KEY)
    url.searchParams.set('sessiontoken', sessionToken)
    url.searchParams.set('components', 'country:in')   // restrict to India
    url.searchParams.set('language', 'en')
    // Bias toward Bengaluru
    url.searchParams.set('location', '12.9716,77.5946')
    url.searchParams.set('radius', '50000')

    const res = await fetch(url.toString())
    const data = await res.json() as any

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(`Places API error: ${data.status}`)
    }

    return (data.predictions ?? []).map((p: any) => ({
        placeId: p.place_id,
        description: p.description,
        mainText: p.structured_formatting.main_text,
        secondaryText: p.structured_formatting.secondary_text,
    }))
}

// Place detail — returns lat/lng for a placeId
export async function getPlaceDetail(
    placeId: string,
    sessionToken: string
): Promise<PlaceDetail> {
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json')
    url.searchParams.set('place_id', placeId)
    url.searchParams.set('key', MAPS_KEY)
    url.searchParams.set('sessiontoken', sessionToken)
    url.searchParams.set('fields', 'place_id,name,formatted_address,geometry')

    const res = await fetch(url.toString())
    const data = await res.json() as any

    if (data.status !== 'OK') {
        throw new Error(`Place detail error: ${data.status}`)
    }

    const r = data.result
    return {
        placeId: r.place_id,
        name: r.name,
        address: r.formatted_address,
        lat: r.geometry.location.lat,
        lng: r.geometry.location.lng,
    }
}