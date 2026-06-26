import { Expense } from '../types';

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/**
 * Returns every date within the target month on which this expense occurs,
 * derived from anchor_date + frequency_type + frequency_interval.
 *
 * Monthly expenses return exactly one date (the anchor's day-of-month, clamped
 * to the month's length). Weekly/every-N-weeks expenses may return 4–5 dates.
 * Quarterly/semiannual/annual return one date or [] if the month is off-cycle.
 */
export function getOccurrenceDates(expense: Expense, month: number, year: number): Date[] {
  const { anchor_date, frequency_type, frequency_interval } = expense;
  if (!anchor_date) return [];

  const [ay, am, ad] = anchor_date.split('-').map(Number);
  const anchorDay = new Date(ay, am - 1, ad);
  const firstOfMonth = new Date(year, month - 1, 1);
  const lastOfMonth = new Date(year, month, 0);

  if (anchorDay > lastOfMonth) return [];

  const clampDay = (d: number) => Math.min(d, lastOfMonth.getDate());
  const anchorDayOfMonth = anchorDay.getDate();

  switch (frequency_type) {
    case 'monthly':
      return [new Date(year, month - 1, clampDay(anchorDayOfMonth))];

    case 'bimonthly': {
      const diff = (year - ay) * 12 + (month - 1 - (am - 1));
      if (diff < 0 || diff % 2 !== 0) return [];
      return [new Date(year, month - 1, clampDay(anchorDayOfMonth))];
    }
    case 'quarterly': {
      const diff = (year - ay) * 12 + (month - 1 - (am - 1));
      if (diff < 0 || diff % 3 !== 0) return [];
      return [new Date(year, month - 1, clampDay(anchorDayOfMonth))];
    }
    case 'semiannual': {
      const diff = (year - ay) * 12 + (month - 1 - (am - 1));
      if (diff < 0 || diff % 6 !== 0) return [];
      return [new Date(year, month - 1, clampDay(anchorDayOfMonth))];
    }
    case 'annual': {
      const diff = (year - ay) * 12 + (month - 1 - (am - 1));
      if (diff < 0 || diff % 12 !== 0) return [];
      return [new Date(year, month - 1, clampDay(anchorDayOfMonth))];
    }
    case 'weekly':
    case 'biweekly':
    case 'every_n_weeks': {
      const intervalDays =
        frequency_type === 'weekly' ? 7 :
        frequency_type === 'biweekly' ? 14 :
        (frequency_interval || 1) * 7;

      let current = anchorDay;

      // Jump close to firstOfMonth using integer multiples, then step forward
      if (current < firstOfMonth) {
        const msPerDay = 86400000;
        const daysToFirst = Math.round(
          (firstOfMonth.getTime() - current.getTime()) / msPerDay
        );
        const jumps = Math.floor(daysToFirst / intervalDays);
        current = addDays(anchorDay, jumps * intervalDays);
        while (current < firstOfMonth) {
          current = addDays(current, intervalDays);
        }
      }

      const results: Date[] = [];
      while (
        current.getFullYear() < year ||
        (current.getFullYear() === year && current.getMonth() + 1 <= month)
      ) {
        if (current.getFullYear() === year && current.getMonth() + 1 === month) {
          results.push(new Date(current.getFullYear(), current.getMonth(), current.getDate()));
        }
        current = addDays(current, intervalDays);
      }
      return results;
    }
    default:
      return [];
  }
}
