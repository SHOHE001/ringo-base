const pad = (value: number) => String(value).padStart(2, '0');

/** ローカル時刻の YYYY-MM-DD を作る。 */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** YYYY-MM-DD をローカル時刻の 0 時として読む。不正な値は null。 */
export function parseDateKey(key: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
}

export function addDaysToKey(key: string, days: number): string {
  const date = parseDateKey(key);
  if (!date) return key;
  return toDateKey(addDays(date, days));
}

export function yesterdayKey(key: string): string {
  return addDaysToKey(key, -1);
}

/** from から to までの日数。同じ日なら 0。 */
export function daysBetweenKeys(from: string, to: string): number {
  const fromDate = parseDateKey(from);
  const toDate = parseDateKey(to);
  if (!fromDate || !toDate) return Number.NaN;
  const fromUtc = Date.UTC(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  const toUtc = Date.UTC(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
  return Math.round((toUtc - fromUtc) / 86_400_000);
}

/** 今日を含む直近 count 日を古い順に返す。 */
export function lastNDateKeys(today: string, count: number): string[] {
  const keys: string[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    keys.push(addDaysToKey(today, -offset));
  }
  return keys;
}

export function formatShortDate(key: string): string {
  const date = parseDateKey(key);
  if (!date) return key;
  return `${date.getMonth() + 1}/${date.getDate()}`;
}
