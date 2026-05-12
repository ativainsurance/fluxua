// ─────────────────────────────────────────────
// Design System — Clean & Minimal
// ─────────────────────────────────────────────

export const colors = {
  // Backgrounds
  background: '#F8F9FB',
  surface: '#FFFFFF',
  surfaceAlt: '#F2F4F7',

  // Brand
  primary: '#2563EB',       // Blue — main action color
  primaryLight: '#EFF6FF',  // Light blue tint
  primaryDark: '#1D4ED8',

  // Semantic
  success: '#10B981',       // Green — paid
  successLight: '#ECFDF5',
  danger: '#EF4444',        // Red — unpaid / overdue
  dangerLight: '#FEF2F2',
  warning: '#F59E0B',       // Amber — due soon
  warningLight: '#FFFBEB',

  // Type tabs
  personal: '#6366F1',      // Indigo
  personalLight: '#EEF2FF',
  business: '#0EA5E9',      // Sky blue
  businessLight: '#F0F9FF',

  // Text
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textDisabled: '#D1D5DB',
  textInverse: '#FFFFFF',

  // Borders & dividers
  border: '#E5E7EB',
  borderFocus: '#2563EB',
  divider: '#F3F4F6',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.4)',
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

  // Font weights (as string for StyleSheet)
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

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;

// Common reusable style objects
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
};
