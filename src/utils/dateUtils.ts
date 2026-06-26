import { useSettings } from '../contexts/SettingsContext';
import { WeeklyBreakdown } from '../types';

// ─────────────────────────────────────────────
// Ordinal day helper
// ─────────────────────────────────────────────

const formatOrdinalDay = (day: number, language: string): string => {
  if (language === 'en') {
    if (day >= 11 && day <= 13) return `${day}th`;
    switch (day % 10) {
      case 1: return `${day}st`;
      case 2: return `${day}nd`;
      case 3: return `${day}rd`;
      default: return `${day}th`;
    }
  }
  if (language === 'pt') return `${day}º`;
  if (language === 'es') return `${day}°`;
  return String(day);
};

// ─────────────────────────────────────────────
// Pure (non-hook) date formatters — for utility code outside components
// ─────────────────────────────────────────────

export const formatMonthYearRaw = (date: Date, locale: string): string =>
  new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(date);

export const formatMonthNameRaw = (date: Date, locale: string): string =>
  new Intl.DateTimeFormat(locale, { month: 'long' }).format(date);

export const formatDateRangeRaw = (start: Date, end: Date, locale: string): string => {
  const fmt = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' });
  return 'formatRange' in fmt
    ? (fmt as any).formatRange(start, end)
    : `${fmt.format(start)}–${fmt.format(end)}`;
};

export const formatDayMonthRaw = (date: Date, locale: string): string =>
  new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }).format(date);

export const formatOrdinalDayRaw = (day: number, locale: string): string =>
  formatOrdinalDay(day, locale);

// ─────────────────────────────────────────────
// useFormatDate hook — locale-aware date formatters for components
// ─────────────────────────────────────────────

export const useFormatDate = () => {
  const { language } = useSettings();
  return {
    /** "maio de 2026" / "May 2026" / "mayo de 2026" */
    monthYear: (date: Date) =>
      new Intl.DateTimeFormat(language, { month: 'long', year: 'numeric' }).format(date),

    /** "maio" / "May" / "mayo" — long month name only */
    monthName: (date: Date) =>
      new Intl.DateTimeFormat(language, { month: 'long' }).format(date),

    /** "mai" / "May" / "may" — short month name */
    shortMonth: (date: Date) =>
      new Intl.DateTimeFormat(language, { month: 'short' }).format(date),

    /** "6 de jul." / "Jul 6" / "6 de jul." — compact month+day for occurrence labels */
    shortDate: (date: Date) =>
      new Intl.DateTimeFormat(language, { month: 'short', day: 'numeric' }).format(date),

    /** "15–21 de mai" / "May 15–21" / "15–21 de may" */
    dateRange: (start: Date, end: Date) => {
      const fmt = new Intl.DateTimeFormat(language, { month: 'short', day: 'numeric' });
      return 'formatRange' in fmt
        ? (fmt as any).formatRange(start, end)
        : `${fmt.format(start)}–${fmt.format(end)}`;
    },

    /** "20 de maio" / "May 20" / "20 de mayo" */
    dayMonth: (date: Date) =>
      new Intl.DateTimeFormat(language, { day: 'numeric', month: 'long' }).format(date),

    /** "seg" / "Mon" / "lun" */
    weekdayShort: (date: Date) =>
      new Intl.DateTimeFormat(language, { weekday: 'short' }).format(date),

    /** "1º" / "1st" / "1°" */
    ordinalDay: (day: number) => formatOrdinalDay(day, language),
  };
};

// ─────────────────────────────────────────────
// Pure utilities (no locale dependency)
// ─────────────────────────────────────────────

export const getCurrentMonthYear = (): { month: number; year: number } => {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
};

export const getDaysInMonth = (month: number, year: number): number =>
  new Date(year, month, 0).getDate();

export const isOverdue = (dueDay: number, isPaid: boolean): boolean => {
  if (isPaid) return false;
  return new Date().getDate() > dueDay;
};

export const isDueSoon = (dueDay: number, isPaid: boolean): boolean => {
  if (isPaid) return false;
  const currentDay = new Date().getDate();
  return dueDay >= currentDay && dueDay <= currentDay + 3;
};

export const getBillStatus = (
  dueDay: number,
  isPaid: boolean
): 'paid' | 'overdue' | 'due-soon' | 'upcoming' => {
  if (isPaid) return 'paid';
  if (isOverdue(dueDay, isPaid)) return 'overdue';
  if (isDueSoon(dueDay, isPaid)) return 'due-soon';
  return 'upcoming';
};

/**
 * Splits a monthly amount into weekly chunks.
 * Returns raw data — callers format date labels using useFormatDate().
 */
export const getWeeklyBreakdown = (
  amount: number,
  month: number,
  year: number
): WeeklyBreakdown[] => {
  const daysInMonth = getDaysInMonth(month, year);
  const monthIndex = month - 1;
  const weeks: WeeklyBreakdown[] = [];
  let day = 1;
  let weekNum = 1;

  while (day <= daysInMonth) {
    const startDay = day;
    const endDay = Math.min(day + 6, daysInMonth);
    const daysInWeek = endDay - startDay + 1;
    const weeklyAmount = (amount / daysInMonth) * daysInWeek;

    weeks.push({ week: weekNum, startDay, endDay, amount: weeklyAmount, monthIndex, year });

    day = endDay + 1;
    weekNum++;
  }

  return weeks;
};

// ─────────────────────────────────────────────
// Currency formatters
// ─────────────────────────────────────────────

export const formatCurrencyRaw = (
  amount: number,
  currency: string,
  locale: string,
  compact = false
): string => {
  if (compact) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const useFormatCurrency = (): ((amount: number, compact?: boolean) => string) => {
  const { currency, language } = useSettings();
  return (amount: number, compact = false) =>
    formatCurrencyRaw(amount, currency, language, compact);
};

// ─────────────────────────────────────────────
// Week / month navigation utilities
// ─────────────────────────────────────────────

export const getCurrentWeekIndex = (month: number, year: number, day?: number): number => {
  const today = new Date();
  const targetDay = day ?? today.getDate();
  const isCurrentMonth = today.getMonth() + 1 === month && today.getFullYear() === year;
  if (!isCurrentMonth && day === undefined) return -1;

  const daysInMonth = getDaysInMonth(month, year);
  let d = 1;
  let idx = 0;
  while (d <= daysInMonth) {
    const endDay = Math.min(d + 6, daysInMonth);
    if (targetDay >= d && targetDay <= endDay) return idx;
    d = endDay + 1;
    idx++;
  }
  return 0;
};

export const navigateMonth = (
  month: number,
  year: number,
  direction: 'prev' | 'next'
): { month: number; year: number } => {
  if (direction === 'next') {
    return month === 12
      ? { month: 1, year: year + 1 }
      : { month: month + 1, year };
  } else {
    return month === 1
      ? { month: 12, year: year - 1 }
      : { month: month - 1, year };
  }
};
