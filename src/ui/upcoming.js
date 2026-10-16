// 「下一件大事」：最近的劇情、節日或年度回顧，讓等待的時候有東西可以期待
// 事件之間至少要隔 minGapDays 天，所以顯示的是扣掉間隔後「預計」最早的日子
import { EVENTS } from '../data/balance.js';
import { calendarOf, dayOfDate } from '../core/calendar.js';
import { nextScheduled } from '../systems/events.js';

export function upcoming(state) {
  const { year } = calendarOf(state.day);
  let best = { day: dayOfDate(year + 1, 1, 1), title: '年度回顧' };
  const from = Math.max(state.day, (state.events.lastDay ?? -Infinity) + EVENTS.minGapDays);
  const next = nextScheduled(state, from);
  if (next && next.day < best.day) best = { day: next.day, title: next.event.title };
  return best;
}
