// ─────────────────────────────────────────────
// Fluxua Design System — Editorial Finance
// Aesthetic: Mercury Bank × high-end print magazine
// Philosophy: Warm, restrained, premium, confidence-inspiring
// ─────────────────────────────────────────────

// ── Font families ──────────────────────────────────────────────────────────
export const fonts = {
  display: 'Fraunces',       // Editorial serif — headlines, hero numbers
  body: 'Geist',             // Clean modern sans — body text, UI labels
  mono: 'GeistMono',         // Monospaced — amounts, codes, data
} as const;

// ── Light palette — warm parchment editorial ──────────────────────────────
export const colors = {
  // ── Backgrounds (warm paper layers) ──
  background: '#FAFAF7',       // warm off-white — app canvas
  surface: '#F2EFE9',          // warm parchment — standard card surface
  surfaceAlt: '#EDE9E0',       // slightly deeper warm — tracks, icon bgs
  surfaceRaised: '#FFFFFF',    // pure white — elevated elements, inputs

  // ── Brand ── (amber accent, muted sage, warm charcoal)
  primary: '#9C7142',          // amber — primary actions, links
  primaryLight: 'rgba(156,113,66,0.10)',
  primaryDark: '#7A5730',
  teal: '#5A8260',             // sage green — flow/progress indicators
  tealLight: 'rgba(90,130,96,0.12)',
  tealDark: '#3D6347',
  navy: '#1A1A18',             // warm charcoal — hero surfaces
  navyMid: '#2A2A26',          // mid charcoal — sub-elements

  // ── Semantic ──
  success: '#5A8260',
  successLight: 'rgba(90,130,96,0.12)',
  successDark: '#3D6347',
  danger: '#8E4530',
  dangerLight: 'rgba(142,69,48,0.12)',
  warning: '#A85F40',
  warningLight: 'rgba(168,95,64,0.12)',

  // ── Type tabs ──
  personal: '#9C7142',         // amber = personal
  personalLight: 'rgba(156,113,66,0.10)',
  business: '#5C6E7A',         // muted blue-gray = business
  businessLight: 'rgba(92,110,122,0.10)',

  // ── Text hierarchy ──
  textPrimary: '#1A1A18',      // warm charcoal — max contrast
  textSecondary: '#6B655D',    // warm mid-tone — second level
  textTertiary: '#9C968D',     // warm muted — metadata, labels
  textDisabled: '#C4BDB5',     // warm light — disabled
  textInverse: '#FAFAF7',      // on dark surfaces

  // ── Borders & dividers ──
  border: '#E5E1D8',
  borderFocus: '#9C7142',
  divider: '#EDE9E0',

  // ── Overlays ──
  overlay: 'rgba(26,26,24,0.45)',
  overlayLight: 'rgba(26,26,24,0.20)',

  // ── Editorial extras ──
  accent: '#9C7142',           // alias for primary
  accentMuted: '#C9A77A',      // lighter amber — secondary highlights
} as const;

// ── Dark palette — warm obsidian editorial ────────────────────────────────
export const darkColors = {
  // ── Backgrounds ──
  background: '#0E0E0C',       // near-black warm — app canvas
  surface: '#16161A',          // deep warm card surface
  surfaceAlt: '#1E1E22',       // slightly lighter — tracks, icon bgs
  surfaceRaised: '#26262A',    // raised elements, dropdowns

  // ── Brand (warm amber brightened for dark) ──
  primary: '#D4A574',
  primaryLight: 'rgba(212,165,116,0.15)',
  primaryDark: '#A8824E',
  teal: '#7FA582',             // sage brightened for dark
  tealLight: 'rgba(127,165,130,0.15)',
  tealDark: '#5C8063',
  navy: '#2A2A26',             // warm dark surface for hero cards
  navyMid: '#1A1A18',

  // ── Semantic (muted, warm for dark bg) ──
  success: '#7FA582',
  successLight: 'rgba(127,165,130,0.15)',
  successDark: '#5C8063',
  danger: '#B85C3F',
  dangerLight: 'rgba(184,92,63,0.15)',
  warning: '#C97B5A',
  warningLight: 'rgba(201,123,90,0.15)',

  // ── Type tabs ──
  personal: '#D4A574',
  personalLight: 'rgba(212,165,116,0.15)',
  business: '#7A9BB5',
  businessLight: 'rgba(122,155,181,0.15)',

  // ── Text hierarchy ──
  textPrimary: '#F4F1EA',      // warm near-white — max contrast on dark
  textSecondary: '#8C8378',    // warm mid — second level
  textTertiary: '#5C544C',     // warm dim — metadata
  textDisabled: '#3C3630',     // warm darkest — disabled
  textInverse: '#1A1A18',      // on light surfaces

  // ── Borders & dividers ──
  border: '#2A2A26',
  borderFocus: '#D4A574',
  divider: '#1E1E22',

  // ── Overlays ──
  overlay: 'rgba(0,0,0,0.65)',
  overlayLight: 'rgba(0,0,0,0.35)',

  // ── Editorial extras ──
  accent: '#D4A574',
  accentMuted: '#8A6F4C',
} as const;

// ── Brand gradient: warm amber → golden ──────────────────────────────────
export const gradient = {
  brand: ['#9C7142', '#C29055'] as [string, string],
  brandStart: { x: 0, y: 0 },
  brandEnd: { x: 1, y: 0 },
  brandVertical: ['#9C7142', '#C29055'] as [string, string],
  brandVerticalStart: { x: 0, y: 0 },
  brandVerticalEnd: { x: 0, y: 1 },
  // Auth screen background gradient
  authBg: ['#FAFAF7', '#F2EFE9'] as [string, string],
  authBgStart: { x: 0, y: 0 },
  authBgEnd: { x: 1, y: 1 },
  authBgDark: ['#0E0E0C', '#16161A'] as [string, string],
} as const;

// ── Typography ────────────────────────────────────────────────────────────
export const typography = {
  // Font sizes (px)
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 30,
  xxxl: 38,
  display: 48,
  hero: 56,

  // Font weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
} as const;

// ── Spacing ───────────────────────────────────────────────────────────────
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

// ── Border radius ─────────────────────────────────────────────────────────
export const radius = {
  xs: 6,
  sm: 8,
  md: 10,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 999,
} as const;

// ── Shadow system ─────────────────────────────────────────────────────────
export const shadows = {
  sm: {
    shadowColor: '#1A1A18',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  md: {
    shadowColor: '#1A1A18',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  lg: {
    shadowColor: '#1A1A18',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 4,
  },
  card: {
    shadowColor: '#1A1A18',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  hero: {
    shadowColor: '#1A1A18',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.24,
    shadowRadius: 40,
    elevation: 14,
  },
} as const;

// ── Common styles ─────────────────────────────────────────────────────────
export const commonStyles = {
  card: {
    backgroundColor: '#F2EFE9',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#1A1A18',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  screenPadding: { paddingHorizontal: 16 },
  row: { flexDirection: 'row' as const, alignItems: 'center' as const },
  spaceBetween: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
} as const;

// ── Type helpers ──────────────────────────────────────────────────────────
export type ColorScheme = typeof colors;
export const getColors = (isDark: boolean): ColorScheme =>
  isDark ? (darkColors as unknown as ColorScheme) : colors;
