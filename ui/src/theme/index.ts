// ── Primitive palette ─────────────────────────────────────────
export const palette = {
    purple50: '#EEEDFE',
    purple200: '#AFA9EC',
    purple500: '#534AB7',
    purple800: '#3C3489',
    purple900: '#26215C',

    teal50: '#E1F5EE',
    teal600: '#0F6E56',
    teal800: '#085041',

    amber50: '#FAEEDA',
    amber600: '#854F0B',
    amber800: '#633806',

    red50: '#FCEBEB',
    red800: '#791F1F',

    green50: '#EAF3DE',
    green800: '#27500A',

    neutral0: '#FFFFFF',
    neutral50: '#F8F8F7',
    neutral100: '#F1EFE8',
    neutral200: '#B4B2A9',
    neutral400: '#888780',
    neutral800: '#444441',
    neutral900: '#1A1A1A',
    neutral950: '#0F0F0F',

    danger: '#E24B4A',
}

// ── Light theme ───────────────────────────────────────────────
export const lightColors = {
    // Backgrounds
    background: palette.neutral50,
    surface: palette.neutral0,
    surfaceSecondary: palette.neutral100,

    // Borders
    border: palette.neutral200,
    borderStrong: palette.neutral400,

    // Text
    textPrimary: palette.neutral800,
    textSecondary: palette.neutral400,
    textInverse: palette.neutral0,

    // Brand
    brand: palette.purple500,
    brandDark: palette.purple800,
    brandLight: palette.purple50,

    // States
    danger: palette.danger,
    success: palette.green800,

    // Sport badge backgrounds (same in both themes)
    sportFootballBg: palette.purple50,
    sportFootballFg: palette.purple500,
    sportBadmintonBg: palette.teal50,
    sportBadmintonFg: palette.teal600,
    sportCricketBg: palette.amber50,
    sportCricketFg: palette.amber600,

    // Slot badges
    slotOpenBg: palette.green50,
    slotOpenFg: palette.green800,
    slotFewBg: palette.amber50,
    slotFewFg: palette.amber800,
    slotFullBg: palette.red50,
    slotFullFg: palette.red800,
}

// ── Dark theme ────────────────────────────────────────────────
export const darkColors: typeof lightColors = {
    background: palette.neutral950,
    surface: palette.neutral900,
    surfaceSecondary: '#242424',

    border: '#2A2A2A',
    borderStrong: '#3A3A3A',

    textPrimary: '#F1F1F1',
    textSecondary: '#888780',
    textInverse: palette.neutral800,

    brand: palette.purple500,
    brandDark: palette.purple200,
    brandLight: '#1E1B3A',

    danger: '#F87171',
    success: '#4ADE80',

    sportFootballBg: '#1E1B3A',
    sportFootballFg: palette.purple200,
    sportBadmintonBg: '#0D2420',
    sportBadmintonFg: '#4ADE80',
    sportCricketBg: '#2A1D0A',
    sportCricketFg: '#FBB040',

    slotOpenBg: '#1A2E0A',
    slotOpenFg: '#86EFAC',
    slotFewBg: '#2A1D0A',
    slotFewFg: '#FBB040',
    slotFullBg: '#2A0A0A',
    slotFullFg: '#F87171',
}

// ── Spacing / radius / typography (theme-agnostic) ────────────
export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
}

export const radius = {
    sm: 8,
    md: 12,
    lg: 16,
    pill: 999,
}

export const font = {
    regular: '400' as const,
    medium: '500' as const,
}

export type ThemeColors = typeof lightColors