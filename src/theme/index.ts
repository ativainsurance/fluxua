// ─────────────────────────────────────────────
// Fluxua Design System — Phase 02
// Brand identity: Deep Navy + Soft Blue + Teal gradient
// Philosophy: Depth > Decoration. Calm Intelligence.
// ─────────────────────────────────────────────

export const colors = {
  // ── Backgrounds (layered surface system) ──
  background: '#EEF2F8',       // app bg — creates contrast against white cards
  surface: '#FFFFFF',           // standard card surface
  surfaceAlt: '#F1F5F9',       // subtle alt surface (icon bgs, tracks, dividers)
  surfaceRaised: '#F8FAFC',    // slightly off-white — secondary panels within cards

  // ── Brand ──
  primary: '#3B82F6',          // Soft Blue — actions, links
  primaryLight: '#EFF6FF',
  primaryDark: '#2563EB',      // pressed / hover
  teal: '#14B8A6',             // Teal Accent — Fluxua "flow" signature
  tealLight: '#F0FDFA',
  tealDark: '#0D9488',
  navy: '#0F172A',             // Deep Navy — hero surfaces, trust base
  navyMid: '#1E293B',          // mid-navy — hero stats, sub-elements

  // ── Semantic ──
  success: '#10B981',
  successLight: '#ECFDF5',
  successDark: '#059669',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',

  // ── Type tabs ──
  personal: '#6366F1',
  personalLight: '#EEF2FF',
  business: '#0EA5E9',
  businessLight: '#F0F9FF',

  // ── Text hierarchy ──
  textPrimary: '#0F172A',      // deep navy — maximum contrast
  textSecondary: '#64748B',    // slate — second level
  textTertiary: '#94A3B8',     // lighter — metadata, labels
  textDisabled: '#CBD5E1',
  textInverse: '#FFFFFF',

  // ── Borders & dividers ──
  border: '#E2E8F0',
  borderFocus: '#3B82F6',
  divider: '#F1F5F9',

  // ── Overlays ──
  overlay: 'rgba(15, 23, 42, 0.45)',
  overlayLight: 'rgba(15, 23, 42, 0.20)',
} as const;

// Brand gradient: Blue → Teal (the "flow" signature)
export const gradient = {
  brand: ['#3B82F6', '#14B8A6'] as [string, string],
  brandStart: { x: 0, y: 0 },
  brandEnd: { x: 1, y: 0 },
  brandVertical: ['#3B82F6', '#14B8A6'] as [string, string],
  brandVerticalStart: { x: 0, y: 0 },
  brandVerticalEnd: { x: 0, y: 1 },
} as const;

export const typography = {
  // ── Font sizes ──
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 30,
  xxxl: 38,
  display: 48,     // hero financial numbers
  hero: 56,        // maximum display (future)

  // ── Font weights ──
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
} as const;

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

export const radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,          // standard card — unified across all cards
  xxl: 28,         // hero cards, large featured containers
  full: 999,
} as const;

// ── Unified shadow system — 3 structural + 2 semantic ──
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
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 3,
  },
  hero: {
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.28,
    shadowRadius: 40,
    elevation: 14,
  },
} as const;

export const commonStyles = {
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 3,
  },
  screenPadding: {
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
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
