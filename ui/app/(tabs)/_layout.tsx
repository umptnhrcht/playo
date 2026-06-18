import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useTheme } from '../../src/theme/ThemeContext';

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
    return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{icon}</Text>
}

export default function TabsLayout() {
    const { colors } = useTheme()

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
                tabBarActiveTintColor: colors.brand,
                tabBarInactiveTintColor: colors.textSecondary,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="map"
                options={{
                    title: 'Map',
                    tabBarIcon: ({ focused }) => <TabIcon icon="🗺️" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="my-games"
                options={{
                    title: 'My Games',
                    tabBarIcon: ({ focused }) => <TabIcon icon="📋" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} />,
                }}
            />
        </Tabs>
    )
}