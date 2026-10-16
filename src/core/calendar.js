// 遊戲日（state.day，開局後第幾天）與日期、星期、年齡的換算
import { START } from '../data/balance.js';

const DAY_MS = 86_400_000;
const [START_YEAR, START_MONTH, START_DATE] = START.date;
const START_UTC = Date.UTC(START_YEAR, START_MONTH - 1, START_DATE);

export function calendarOf(day) {
  const d = new Date(START_UTC + day * DAY_MS);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    date: d.getUTCDate(),
    weekday: d.getUTCDay(), // 0 = 週日
  };
}

export const isWeekend = weekday => weekday === 0 || weekday === 6;

// 每週行程的索引：週一 = 0 … 週日 = 6
export const slotIndex = weekday => (weekday + 6) % 7;

// 生日就是開局日（7/1）
export function ageOn(day) {
  const c = calendarOf(day);
  const birthdayPassed = c.month > START_MONTH || (c.month === START_MONTH && c.date >= START_DATE);
  return START.age + (c.year - START_YEAR) - (birthdayPassed ? 0 : 1);
}

export function monthsBetween(fromDay, toDay) {
  const a = calendarOf(fromDay);
  const b = calendarOf(toDay);
  return (b.year - a.year) * 12 + (b.month - a.month) - (b.date < a.date ? 1 : 0);
}

export function daysUntil(fromDay, match) {
  let n = 1;
  while (!match(calendarOf(fromDay + n))) n++;
  return n;
}
