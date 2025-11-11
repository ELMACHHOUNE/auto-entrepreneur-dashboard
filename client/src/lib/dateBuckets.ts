export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export type Month = (typeof MONTHS)[number];
export type QuarterKey = 'T1' | 'T2' | 'T3' | 'T4';

export function monthToQuarterByName(month: Month): QuarterKey {
  const idx = MONTHS.indexOf(month);
  if (idx < 3) return 'T1';
  if (idx < 6) return 'T2';
  if (idx < 9) return 'T3';
  return 'T4';
}
