// 每日結算（DESIGN.md §14.3）。線上、離線、除錯跳轉、模擬腳本都只透過這個函式推進
import { calendarOf, isWeekend } from './calendar.js';
import { activityFor, applySlot } from '../systems/schedule.js';
import { applyWorkday, clampVitals, performanceMultiplier } from '../systems/work.js';
import { applyDailyIncome, applyMonthStart } from '../systems/finance.js';
import { checkMilestones } from '../systems/milestones.js';
import { checkReview } from '../systems/review.js';

// rng 從 M2 的事件開始使用
export function advanceDay(state, rng) {
  const cal = calendarOf(state.day);
  const weekend = isWeekend(cal.weekday);
  const multiplier = performanceMultiplier(state);

  // 1. 今天做什麼
  const activity = activityFor(state, cal.weekday);

  // 2. 上班與薪水
  if (!weekend) applyWorkday(state, multiplier);
  applyDailyIncome(state);
  applySlot(state, activity, weekend, multiplier);

  // 3. 數值門檻
  clampVitals(state);

  // 4. 事件：M2

  // 5. 固定日期、里程碑、檢討（檢討會讓 state.pending 有值，呼叫端看到就停止推進）
  if (cal.date === 1) applyMonthStart(state);
  checkMilestones(state);
  checkReview(state);

  state.day += 1;
}
