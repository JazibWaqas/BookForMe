// ============================================================
// BookForMe — "Stealth Athletic" Design System
// Refined: deeper surfaces, owned green, amber accent for CTAs
// ============================================================

export const COLORS = {
  // ── Brand Green ──────────────────────────────────────────
  // Teal-shifted jade: feels owned, not default Tailwind green
  primary: '#00D084',
  primaryDark: '#00A366',
  primaryGlow: 'rgba(0, 208, 132, 0.15)',
  primaryText: '#00D084',

  // ── Amber Accent (prices, "Book Now", urgency) ────────────
  accent: '#FF9F0A',
  accentDark: '#CC7D08',
  accentGlow: 'rgba(255, 159, 10, 0.15)',

  // ── Background & Surface Layers ───────────────────────────
  // 3-tier system: base → surface → raised
  // Each step is visually distinct — no more flat muddy look
  background: '#0B0F1A',         // Blue-tinted dark (not void-black)
  backgroundAlt: '#0E1220',      // Alt sections / pull-to-refresh zone
  surface: '#151C2B',            // Cards, inputs, modals
  surfaceRaised: '#1C2438',      // Raised cards, active states, popovers
  surfaceHighlight: '#232D45',   // Hover / pressed / selected states

  // ── Text Hierarchy ────────────────────────────────────────
  text: '#F0F4FF',               // Primary text (slightly blue-white = crisper)
  textSecondary: '#B8C4D8',      // Secondary labels, subtitles
  textMuted: '#636E85',          // Placeholders, timestamps, hints
  textDark: '#08090F',           // Text on bright (green/amber) bg

  // ── Semantic ──────────────────────────────────────────────
  success: '#00D084',
  warning: '#FF9F0A',
  error: '#FF453A',              // Softer iOS-style red

  // ── Borders ───────────────────────────────────────────────
  // Near-invisible — elevation signals, not grid lines
  border: 'rgba(255, 255, 255, 0.07)',
  borderStrong: 'rgba(255, 255, 255, 0.13)',
  borderFocus: 'rgba(0, 208, 132, 0.5)',  // Input focus ring

  // ── Utility ───────────────────────────────────────────────
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.75)',
  overlayLight: 'rgba(0, 0, 0, 0.45)',

  // ── Backward-compat aliases (map old tokens → new system) ─
  // These ensure no existing screen files break
  backgroundLight: '#0E1220',    // was backgroundLight → backgroundAlt
  card: '#151C2B',               // was card → surface
  cardLight: '#1C2438',          // was cardLight → surfaceRaised
  surfaceLight: '#1C2438',       // was surfaceLight → surfaceRaised
  secondary: '#3B82F6',          // kept — used in social components
  secondaryDark: '#2563EB',      // kept — used in social components
};

export const GRADIENTS = {
  primary: ['#00D084', '#00A366'] as const,
  primarySoft: ['rgba(0,208,132,0.18)', 'rgba(0,208,132,0.0)'] as const,
  accent: ['#FF9F0A', '#CC7D08'] as const,

  // Hero image overlay — bottom of venue/sport images
  heroOverlay: ['transparent', 'rgba(8,9,15,0.97)'] as const,
  heroOverlayMid: ['rgba(8,9,15,0.0)', 'rgba(8,9,15,0.6)', 'rgba(8,9,15,0.97)'] as const,

  // Surface gradients
  surface: ['#13181F', '#1A2030'] as const,
  tabBar: ['#0D1018', '#08090F'] as const,
  dark: ['#08090F', '#0D1018'] as const,

  // Sport category card backgrounds (unique per sport)
  padel: ['#0D1F12', '#08090F'] as const,   // Forest green tint
  futsal: ['#0D1018', '#0A0D1F'] as const,   // Navy tint
  cricket: ['#1F1508', '#08090F'] as const,   // Amber tint
  pickleball: ['#081A1F', '#08090F'] as const,   // Teal tint
};

// ── Shadows ───────────────────────────────────────────────────
// Consistent elevation across the app
export const SHADOWS = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  raised: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  primaryGlow: {
    shadowColor: '#00D084',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  accentGlow: {
    shadowColor: '#FF9F0A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  tabBar: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 14,
  },
};

// ── Spacing Tokens ────────────────────────────────────────────
// Use these instead of hardcoded padding/margin values
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,    // ← Main horizontal page padding — use this everywhere
  xxl: 24,
  section: 28,
  screen: 20, // Alias for horizontal screen padding
};

// ── Border Radius Tokens ─────────────────────────────────────
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,   // ← Standard card radius
  xl: 20,
  pill: 100,
};
