import { useLocalSearchParams } from 'expo-router'
import { Text, View } from 'react-native'

export default function GameDetailScreen() {
    const { id } = useLocalSearchParams()
    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text>Game {id} — detail screen coming soon</Text>
        </View>
    )
}