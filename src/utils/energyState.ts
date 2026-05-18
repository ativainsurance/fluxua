import { useTheme } from '../contexts/ThemeContext';

// ─────────────────────────────────────────────────────────────────────────────
// energyState — single source of truth for status/ratio → visual energy state
//
// Two doorways, one output shape:
//   energyState({ status: 'paid' | 'overdue' | 'due-soon' | 'upcoming' | 'waived' })
//   energyState({ ratio: number })  // 0–1 coverage
//
// Ratio thresholds: >=0.9 → charged, >=0.6 → flowing, >=0.3 → thinning, <0.3 → draining
// ─────────────────────────────────────────────────────────────────────────────

export type EnergyLevel = 'charged' | 'flowing' | 'thinning' | 'draining';

export type BillStatus = 'paid' | 'overdue' | 'due-soon' | 'upcoming' | 'waived';

export interface EnergyResult {
  state: EnergyLevel;
  color: string;
  bg: string;
  /** i18n key for the status label — only set for status inputs */
  labelKey?: string;
  /** Ionicons icon name — only set for status inputs */
  icon?: string;
}

type EnergyInput =
  | { status: BillStatus; ratio?: never }
  | { ratio: number; status?: never };

// ── Status metadata (icon + label key only — color comes from theme) ──────
const STATUS_META: Record<BillStatus, { icon: string; labelKey: string; level: EnergyLevel }> = {
  paid:      { icon: 'checkmark-circle',       labelKey: 'status.completed', level: 'charged'  },
  waived:    { icon: 'checkmark-circle',       labelKey: 'status.waived',    level: 'charged'  },
  upcoming:  { icon: 'time-outline',           labelKey: 'status.upcoming',  level: 'flowing'  },
  'due-soon':{ icon: 'alert-circle-outline',   labelKey: 'status.dueSoon',   level: 'thinning' },
  overdue:   { icon: 'close-circle-outline',   labelKey: 'status.overdue',   level: 'draining' },
};

function ratioToLevel(ratio: number): EnergyLevel {
  if (ratio >= 0.9) return 'charged';
  if (ratio >= 0.6) return 'flowing';
  if (ratio >= 0.3) return 'thinning';
  return 'draining';
}

// ── Pure function — call from non-component contexts with explicit colors ──
export function resolveEnergyState(
  input: EnergyInput,
  colors: Record<string, string>,
): EnergyResult {
  const level =
    input.status !== undefined
      ? STATUS_META[input.status].level
      : ratioToLevel(input.ratio as number);

  const color = colors[level] as string;
  const bg = `${color}18`; // ~10% alpha swatch for background chips

  if (input.status !== undefined) {
    const meta = STATUS_META[input.status];
    return { state: level, color, bg, labelKey: meta.labelKey, icon: meta.icon };
  }
  return { state: level, color, bg };
}

// ── Hook — for components that need live theme ────────────────────────────
export function useEnergyState() {
  const { colors } = useTheme();
  return (input: EnergyInput): EnergyResult => resolveEnergyState(input, colors as unknown as Record<string, string>);
}
