import { WeeklyBreakdown } from '../types';

/**
 * Returns month name from month number (1-12)
 */
export const getMonthName = (month: number): string => {
  const months = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December',
  ];
  return months[month - 1] ?? '';
};

/**
 * Returns short month name (Jan, Feb, etc.)
 */
export const getShortMonthName = (month: number): string =>
  getMonthName(month).slice(0, 3);

/**
 * Returns current month and year
 */
export const getCurrentMonthYear = (): { month: number; year: number } => {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
};

/**
 * Returns the number of days in a given month/year
 */
export const getDaysInMonth = (month: number, year: number): number =>
  new Date(year, month, 0).getDate();

/**
 * Returns ordinal suffix for a day number (1st, 2nd, 3rd, etc.)
 */
export const getDayOrdinal = (day: number): string => {
  const suffix = ['th', 'st', 'nd', 'rd'];
  const v = day % 100;
  return day + (suffix[(v - 20) % 10] ?? suffix[v] ?? suffix[0]);
};

/**
 * Formats a due_day as a readable string
 * e.g., due_day=15 → "Due on the 15th"
 */
export const formatDueDay = (dueDay: number): string =>
  `Due on the ${getDayOrdinal(dueDay)}`;

/**
 * Checks if a bill is overdue this month.
 * It's overdue if the due_day has passed and it's not paid.
 */
export const isOverdue = (dueDay: number, isPaid: boolean): boolean => {
  if (isPaid) return false;
  const today = new Date();
  return today.getDate() > dueDay;
};

/**
 * Checks if a bill is due within the next 3 days.
 */
export const isDueSoon = (dueDay: number, isPaid: boolean): boolean => {
  if (isPaid) return false;
  const today = new Date();
  const currentDay = today.getDate();
  return dueDay >= currentDay && dueDay <= currentDay + 3;
};

/**
 * Returns the status of a bill for display purposes.
 */
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
 * Splits a monthly amount into weekly breakdown chunks.
 *
 * Concept: If you have a $1,200/month bill due on the 28th,
 * this tells you to save $300/week so the money is ready.
 *
 * @param amount - Total monthly amount
 * @param month  - Month number (1-12)
 * @param year   - Year
 * @param monthName - Short month name for labels
 */
export const getWeeklyBreakdown = (
  amount: number,
  month: number,
  year: number,
  monthName?: string
): WeeklyBreakdown[] => {
  const daysInMonth = getDaysInMonth(month, year);
  const label = monthName ?? getShortMonthName(month);
  const weeks: WeeklyBreakdown[] = [];

  let day = 1;
  let weekNum = 1;

  while (day <= daysInMonth) {
    const startDay = day;
    const endDay = Math.min(day + 6, daysInMonth);
    const daysInWeek = endDay - startDay + 1;
    const weeklyAmount = (amount / daysInMonth) * daysInWeek;

    weeks.push({
      week: weekNum,
      startDay,
      endDay,
      amount: weeklyAmount,
      label: `Week ${weekNum} · ${label} ${startDay}–${endDay}`,
    });

    day = endDay + 1;
    weekNum++;
  }

  return weeks;
};

/**
 * Formats a currency amount as a string.
 * e.g., 1200 → "$1,200.00"
 */
export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);

/**
 * Returns the 0-based index of the week that contains `day` in a given month.
 * Returns -1 if the month/year is not the current calendar month.
 * Pass day=0 to use today's date.
 */
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

/**
 * Returns previous/next month from a given month+year
 */
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
