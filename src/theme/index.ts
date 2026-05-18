// ─────────────────────────────────────────────
// Fluxua Design System — Current
// Aesthetic: energy-flow fintech / blue→teal
// Philosophy: money is energy that flows with purpose or drains if unmanaged
// ─────────────────────────────────────────────

// ── Font families ──────────────────────────────────────────────────────────
export const fonts = {
  display: 'Geist',           // Hero numerals — heaviest available Geist weight
  body: 'Geist',              // Clean modern sans — body text, UI labels
  mono: 'GeistMono',          // Monospaced — amounts, codes, data
} as const;

// ── Light palette — cool blue-slate canvas ────────────────────────────────
export const colors = {
  // ── Backgrounds ──
  background: '#F4F7FA',        // cool blue-white — app canvas
  surface: '#EDF2F7',           // cool card surface
  surfaceAlt: '#E4ECF5',        // slightly deeper — tracks, icon bgs
  surfaceRaised: '#FFFFFF',     // pure white — elevated elements, inputs
  surfaceElevated: '#E4ECF5',   // alias for track/bar backgrounds

  // ── Brand ── (electric blue primary, deep teal accent)
  primary: '#2563EB',           // electric blue — primary actions, links
  primaryLight: 'rgba(37,99,235,0.08)',
  primaryDark: '#1D4ED8',
  teal: '#0D9488',              // deep teal — flow indicators, success
  tealLight: 'rgba(13,148,136,0.10)',
  tealDark: '#0F766E',
  navy: '#0F172A',              // deep blue-black — hero surfaces
  navyMid: '#1E293B',           // mid slate — sub-elements

  // ── Semantic ──
  success: '#0D9488',
  successLight: 'rgba(13,148,136,0.10)',
  successDark: '#0F766E',
  danger: '#DC2626',
  dangerLight: 'rgba(220,38,38,0.10)',
  warning: '#D97706',
  warningLight: 'rgba(217,119,6,0.10)',

  // ── Type tabs ──
  personal: '#2563EB',          // blue = personal
  personalLight: 'rgba(37,99,235,0.08)',
  business: '#0D9488',          // teal = business
  businessLight: 'rgba(13,148,136,0.10)',

  // ── Text hierarchy ──
  textPrimary: '#0F172A',       // deep blue-black — max contrast
  textSecondary: '#475569',     // slate mid — second level
  textTertiary: '#94A3B8',      // slate light — metadata, labels
  textDisabled: '#CBD5E1',      // slate very light — disabled
  textInverse: '#F8FAFC',       // on dark surfaces

  // ── Borders & dividers ──
  border: '#CBD5E1',
  borderFocus: '#2563EB',
  divider: '#E2E8F0',

  // ── Overlays ──
  overlay: 'rgba(15,23,42,0.45)',
  overlayLight: 'rgba(15,23,42,0.20)',

  // ── Accent aliases ──
  accent: '#2563EB',
  accentMuted: '#60A5FA',       // lighter blue — secondary highlights

  // ── Energy flow tokens (new) ──
  flowStart: '#2563EB',         // gradient origin — blue
  flowEnd: '#0D9488',           // gradient terminus — teal
  charged: '#0D9488',           // fully settled = teal
  flowing: '#2563EB',           // active, on track = blue
  thinning: '#60A5FA',          // due soon, waning = lighter blue
  draining: '#78716C',          // overdue, depleted = desaturated stone
} as const;

// ── Dark palette — deep blue-slate obsidian ───────────────────────────────
export const darkColors = {
  // ── Backgrounds ──
  background: '#090E1A',        // deep blue-black — app canvas
  surface: '#0F1629',           // dark blue card surface
  surfaceAlt: '#161F38',        // slightly lighter dark blue
  surfaceRaised: '#1E2D4A',     // raised elements, dropdowns
  surfaceElevated: '#161F38',   // track/bar backgrounds

  // ── Brand (brightened for dark) ──
  primary: '#60A5FA',           // blue brightened
  primaryLight: 'rgba(96,165,250,0.15)',
  primaryDark: '#3B82F6',
  teal: '#2DD4BF',              // teal brightened
  tealLight: 'rgba(45,212,191,0.15)',
  tealDark: '#14B8A6',
  navy: '#1E293B',              // dark hero surfaces
  navyMid: '#0F172A',

  // ── Semantic ──
  success: '#2DD4BF',
  successLight: 'rgba(45,212,191,0.15)',
  successDark: '#14B8A6',
  danger: '#F87171',
  dangerLight: 'rgba(248,113,113,0.15)',
  warning: '#FBBF24',
  warningLight: 'rgba(251,191,36,0.15)',

  // ── Type tabs ──
  personal: '#60A5FA',          // blue brightened
  personalLight: 'rgba(96,165,250,0.15)',
  business: '#2DD4BF',          // teal brightened
  businessLight: 'rgba(45,212,191,0.15)',

  // ── Text hierarchy ──
  textPrimary: '#F1F5F9',       // cool near-white — max contrast
  textSecondary: '#94A3B8',     // slate mid-light (WCAG AA)
  textTertiary: '#475569',      // slate dim — metadata
  textDisabled: '#334155',      // darkest disabled
  textInverse: '#F1F5F9',       // on dark surfaces

  // ── Borders & dividers ──
  border: '#1E293B',
  borderFocus: '#60A5FA',
  divider: '#161F38',

  // ── Overlays ──
  overlay: 'rgba(0,0,0,0.65)',
  overlayLight: 'rgba(0,0,0,0.35)',

  // ── Accent aliases ──
  accent: '#60A5FA',
  accentMuted: '#3B82F6',       // slightly deeper blue

  // ── Energy flow tokens (new, brightened for dark) ──
  flowStart: '#3B82F6',         // blue
  flowEnd: '#2DD4BF',           // teal
  charged: '#2DD4BF',           // fully settled = bright teal
  flowing: '#60A5FA',           // active = blue
  thinning: '#93C5FD',          // waning = lighter blue
  draining: '#A8A29E',          // depleted = warm stone (desaturated)
} as const;

// ── Brand gradient: blue → teal ───────────────────────────────────────────
export const gradient = {
  brand: ['#2563EB', '#0D9488'] as [string, string],
  brandStart: { x: 0, y: 0 },
  brandEnd: { x: 1, y: 0 },
  brandVertical: ['#2563EB', '#0D9488'] as [string, string],
  brandVerticalStart: { x: 0, y: 0 },
  brandVerticalEnd: { x: 0, y: 1 },
  // Auth screen background gradient
  authBg: ['#F4F7FA', '#EDF2F7'] as [string, string],
  authBgStart: { x: 0, y: 0 },
  authBgEnd: { x: 1, y: 1 },
  authBgDark: ['#090E1A', '#0F1629'] as [string, string],
  // Dark-mode brand gradient
  brandDark: ['#3B82F6', '#2DD4BF'] as [string, string],
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
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 4,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  hero: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.24,
    shadowRadius: 40,
    elevation: 14,
  },
} as const;

// ── Common styles ─────────────────────────────────────────────────────────
export const commonStyles = {
  card: {
    backgroundColor: '#EDF2F7',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#0F172A',
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
