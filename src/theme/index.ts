// ─────────────────────────────────────────────
// Fluxua Design System
// Brand identity: Deep Navy + Soft Blue + Teal gradient
// ─────────────────────────────────────────────

export const colors = {
  // Backgrounds
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',

  // Brand
  primary: '#3B82F6',        // Soft Blue — actions
  primaryLight: '#EFF6FF',
  primaryDark: '#2563EB',    // Pressed / hover state
  teal: '#14B8A6',           // Teal Accent — flow identity
  tealLight: '#F0FDFA',
  navy: '#0F172A',           // Deep Navy — trust base

  // Semantic
  success: '#10B981',
  successLight: '#ECFDF5',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',

  // Type tabs
  personal: '#6366F1',
  personalLight: '#EEF2FF',
  business: '#0EA5E9',
  businessLight: '#F0F9FF',

  // Text
  textPrimary: '#0F172A',     // Deep Navy for primary text
  textSecondary: '#64748B',   // Slate — softer than grey
  textDisabled: '#CBD5E1',
  textInverse: '#FFFFFF',

  // Borders & dividers
  border: '#E2E8F0',
  borderFocus: '#3B82F6',
  divider: '#F1F5F9',

  // Overlays
  overlay: 'rgba(15, 23, 42, 0.45)',
} as const;

// Brand gradient: Blue → Teal (the "flow" signature)
export const gradient = {
  brand: ['#3B82F6', '#14B8A6'] as [string, string],
  brandStart: { x: 0, y: 0 },
  brandEnd: { x: 1, y: 0 },
  // Vertical variant for hero elements
  brandVertical: ['#3B82F6', '#14B8A6'] as [string, string],
  brandVerticalStart: { x: 0, y: 0 },
  brandVerticalEnd: { x: 0, y: 1 },
} as const;

export const typography = {
  // Font sizes
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 30,
  xxxl: 38,

  // Font weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

// Slightly larger radius = more modern feel
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

// Softer, more layered shadows
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
} as const;

export const commonStyles = {
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    ...shadows.md,
  },
  screenPadding: {
    paddingHorizontal: spacing.base,
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
} as const;
