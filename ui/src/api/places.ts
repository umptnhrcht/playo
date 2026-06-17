import { apiClient } from './client'

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

export async function fetchPlacePredictions(
    input: string,
    sessionToken: string
): Promise<PlacePrediction[]> {
    const { data } = await apiClient.get<{ predictions: PlacePrediction[] }>(
        '/places/autocomplete',
        { params: { input, sessionToken } }
    )
    return data.predictions
}

export async function fetchPlaceDetail(
    placeId: string,
    sessionToken: string
): Promise<PlaceDetail> {
    const { data } = await apiClient.get<{ place: PlaceDetail }>(
        '/places/detail',
        { params: { placeId, sessionToken } }
    )
    return data.place
}