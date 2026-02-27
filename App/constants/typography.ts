// ============================================================
// Typography system — Inter font scale
// Usage: import { FONTS, TEXT } from '../constants/typography';
//
// fontFamily: FONTS.bold         → Inter 700
// ...style: TEXT.heading1        → pre-composed text style
// ============================================================

export const FONTS = {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
    extrabold: 'Inter_800ExtraBold',
};

// Pre-composed text styles — use these as spread styles
// Example: <Text style={TEXT.heading1}>Title</Text>
export const TEXT = {
    display: {
        fontFamily: 'Inter_800ExtraBold',
        fontSize: 32,
        letterSpacing: -0.8,
    },
    heading1: {
        fontFamily: 'Inter_700Bold',
        fontSize: 24,
        letterSpacing: -0.4,
    },
    heading2: {
        fontFamily: 'Inter_700Bold',
        fontSize: 20,
        letterSpacing: -0.3,
    },
    heading3: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 17,
        letterSpacing: -0.2,
    },
    body: {
        fontFamily: 'Inter_400Regular',
        fontSize: 15,
        letterSpacing: 0,
    },
    bodyMedium: {
        fontFamily: 'Inter_500Medium',
        fontSize: 15,
        letterSpacing: 0,
    },
    label: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 13,
        letterSpacing: 0.1,
    },
    caption: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        letterSpacing: 0.2,
    },
    button: {
        fontFamily: 'Inter_700Bold',
        fontSize: 15,
        letterSpacing: 0.2,
    },
    tab: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 11,
        letterSpacing: 0.1,
    },
};
