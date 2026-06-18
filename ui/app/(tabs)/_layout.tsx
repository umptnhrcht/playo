// import { useTheme } from '../../src/theme/ThemeContext';

import { StyleSheet, Text, View } from 'react-native';


const s = StyleSheet.create({ container: { flex: 1, alignItems: 'center', justifyContent: 'center' } })

export default function TabsLayout() {
    // const { colors } = useTheme()

    return (
            <View >
                <Text>Home — game listing coming in Phase 2</Text>
            </View>
        )

    // return (
    //     <Tabs
    //         screenOptions={{
    //             headerShown: false,
    //             tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
    //             tabBarActiveTintColor: colors.brand,
    //             tabBarInactiveTintColor: colors.textSecondary,
    //         }}
    //     >
    //         <Tabs.Screen
    //             name="index"
    //             options={{ title: 'Home', tabBarLabel: 'Home', tabBarIcon: ({ color }) => <TabIcon icon="🏠" color={colors.textPrimary} /> }}
    //         />
    //         <Tabs.Screen
    //             name="index"
    //             options={{ title: 'Map', tabBarLabel: 'Map', tabBarIcon: ({ color }) => <TabIcon icon="🗺️" color={colors.textPrimary} /> }}
    //         />
    //         <Tabs.Screen
    //             name="index"
    //             options={{ title: 'My Games', tabBarLabel: 'My Games', tabBarIcon: ({ color }) => <TabIcon icon="📋" color={colors.textPrimary} /> }}
    //         />
    //         <Tabs.Screen
    //             name="index"
    //             options={{ title: 'Profile', tabBarLabel: 'Profile', tabBarIcon: ({ color }) => <TabIcon icon="👤" color={colors.textPrimary} /> }}
    //         />
    //     </Tabs>
    // )
}

function TabIcon({ icon, color }: { icon: string; color: string }) {
    const { Text } = require('react-native')
    return <Text style={{ fontSize: 20, opacity: color === '#888780' ? 0.5 : 1 }}>{icon}</Text>
}