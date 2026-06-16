import { createContext, useContext } from 'react'
import { useColorScheme } from 'react-native'
import { darkColors, lightColors, type ThemeColors } from './index'

interface ThemeContextValue {
    colors: ThemeColors
    isDark: boolean
}

const ThemeContext = createContext<ThemeContextValue>({
    colors: lightColors,
    isDark: false,
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const scheme = useColorScheme()
    const isDark = scheme === 'dark'
    const colors = isDark ? darkColors : lightColors

    return (
        <ThemeContext.Provider value={{ colors, isDark }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme(): ThemeContextValue {
    return useContext(ThemeContext)
}