import { DAILY } from '../data/balance.js';
import { slotIndex } from '../core/calendar.js';
import { overtimePay } from './finance.js';
import { forcedOn, leaveOn } from './statuses.js';
import { workEffects } from './work.js';

// 優先順序：住院 > 病假 > 強制時段 > 行程範本（DESIGN.md §14.3）
export function activityFor(state, weekday, day = state.day) {
  if (leaveOn(state, day)) return 'rest';
  const slot = slotIndex(weekday);
  return forcedOn(state, day, slot)?.activity ?? state.schedule[slot];
}

export function applySlot(state, activity, weekend, multiplier) {
  const fx = slotEffects(activity, weekend);
  state.vitals.energy += fx.energy;
  state.vitals.mood += fx.mood;
  state.job.performance += fx.performance * multiplier;
  if (activity === 'overtime') {
    const pay = overtimePay(state, weekend);
    state.money += pay;
    state.period.income += pay;
    state.period.overtimePay += pay;
    state.period.overtimeSlots += 1;
    state.stats.overtimeSlots += 1;
  }
}

export function applySleep(state) {
  state.vitals.energy += DAILY.sleep.energy;
  state.vitals.mood += DAILY.sleep.mood;
}

// 一個時段的效果；週末是一整天，效果加倍
export function slotEffects(activity, weekend) {
  const fx = DAILY[activity];
  const k = weekend ? DAILY.weekendMultiplier : 1;
  return { energy: fx.energy * k, mood: fx.mood * k, performance: fx.performance * k };
}

// 畫面用的每週預估：不含上限與體力、心情門檻的影響
export function weeklyForecast(state) {
  const sum = { energy: 0, mood: 0, performance: 0, overtimePay: 0 };
  for (let i = 0; i < 7; i++) {
    const weekend = i >= 5;
    const activity = state.schedule[i];
    const parts = weekend
      ? [slotEffects(activity, true), DAILY.sleep]
      : [workEffects(state), slotEffects(activity, false), DAILY.sleep];
    for (const fx of parts) {
      sum.energy += fx.energy;
      sum.mood += fx.mood;
      sum.performance += fx.performance;
    }
    if (activity === 'overtime') sum.overtimePay += overtimePay(state, weekend);
  }
  return sum;
}
