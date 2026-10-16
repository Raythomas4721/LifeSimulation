// 每日結算（DESIGN.md §14.3）。線上、離線、除錯跳轉、模擬腳本都只透過這個函式推進
// 結算會讓 state.pending 有值（檢討、事件、通知），呼叫端看到就停止推進
import { calendarOf, isWeekend } from './calendar.js';
import { activityFor, applyFitnessDay, applySleep, applySlot } from '../systems/schedule.js';
import { applyWorkday, clampVitals, performanceMultiplier } from '../systems/work.js';
import { applyDailyIncome, applyMonthStart } from '../systems/finance.js';
import { leaveOn, processStatuses } from '../systems/statuses.js';
import { checkCollapse, onStatusEnded, resetHealthYear, sickPayRate } from '../systems/health.js';
import { annualReview } from '../systems/annual.js';
import { rollEvent } from '../systems/events.js';
import { checkMilestones } from '../systems/milestones.js';
import { checkReview } from '../systems/review.js';
import { checkCourse } from '../systems/study.js';

export function advanceDay(state, rng) {
  const cal = calendarOf(state.day);
  const weekend = isWeekend(cal.weekday);
  const onLeave = Boolean(leaveOn(state, state.day));
  const multiplier = performanceMultiplier(state);
  if (cal.month === 1 && cal.date === 1) resetHealthYear(state);

  // 1. 今天做什麼（住院 > 病假 > 強制時段 > 行程範本）
  const activity = activityFor(state, cal.weekday);

  // 2. 上班與薪水、晚上的時段、睡覺
  if (!weekend && !onLeave) applyWorkday(state, multiplier);
  applyDailyIncome(state, onLeave && !weekend ? sickPayRate(state) : 1);
  applySlot(state, activity, weekend, multiplier);
  applySleep(state);
  applyFitnessDay(state);

  // 3. 數值門檻、持續狀態、傷病
  clampVitals(state);
  for (const ended of processStatuses(state)) onStatusEnded(state, ended);
  clampVitals(state);
  checkCollapse(state);

  // 4. 固定日期：1/1 考核與年終、每月 1 日繳生活費、12/31 年度回顧；課程結業
  if (cal.month === 1 && cal.date === 1) annualReview(state, rng);
  if (cal.date === 1) applyMonthStart(state);
  checkCourse(state);
  checkMilestones(state);
  checkReview(state);

  state.day += 1;

  // 5. 事件在新的一天開始時（06:00）擲骰，條件也照新的一天判斷
  rollEvent(state, rng);
}
