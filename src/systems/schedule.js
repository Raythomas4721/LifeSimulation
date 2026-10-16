import { DAILY, FITNESS } from '../data/balance.js';
import { STUDY_PRESETS, SCHEDULE_PRESETS } from '../data/schedule.js';
import { COURSES_BY_ID } from '../data/courses.js';
import { slotIndex } from '../core/calendar.js';
import { overtimePay } from './finance.js';
import { forcedOn, leaveOn } from './statuses.js';
import { workEffects } from './work.js';
import { attendStudy } from './study.js';

// 優先順序：住院 > 病假 > 強制時段 > 行程範本（DESIGN.md §14.3）
export function activityFor(state, weekday, day = state.day) {
  if (leaveOn(state, day)) return 'rest';
  const slot = slotIndex(weekday);
  return forcedOn(state, day, slot)?.activity ?? state.schedule[slot];
}

export function applySlot(state, activity, weekend, multiplier) {
  const fx = slotEffects(activity, weekend);
  const k = weekend ? DAILY.weekendMultiplier : 1;
  state.vitals.energy += fx.energy;
  state.vitals.mood += fx.mood;
  state.job.performance += fx.performance * multiplier;
  if (activity === 'study') attendStudy(state, k);
  if (activity === 'exercise') {
    state.fitness = Math.min(FITNESS.max, state.fitness + FITNESS.perSlot * k);
    state.money -= fx.cost;
    state.period.expenses += fx.cost;
  }
  if (activity === 'overtime') {
    const pay = overtimePay(state, weekend);
    state.money += pay;
    state.period.income += pay;
    state.period.overtimePay += pay;
    state.period.overtimeSlots += 1;
    state.stats.overtimeSlots += 1;
  }
}

// 體能越好，睡覺恢復越多（§6）
export const sleepEffects = state => ({ ...DAILY.sleep, energy: DAILY.sleep.energy + state.fitness * FITNESS.sleepPerPoint });

export function applySleep(state) {
  const fx = sleepEffects(state);
  state.vitals.energy += fx.energy;
  state.vitals.mood += fx.mood;
}

// 每天結算：體能自然下降，體力上限跟著體能變
export function applyFitnessDay(state) {
  state.fitness = Math.max(0, state.fitness - FITNESS.dailyDecay);
  state.vitals.energyMax = Math.round(100 + state.fitness * FITNESS.energyMaxPerPoint);
}

// 一個時段的效果；週末是一整天，效果和花費加倍
export function slotEffects(activity, weekend) {
  const fx = DAILY[activity];
  const k = weekend ? DAILY.weekendMultiplier : 1;
  const cost = activity === 'exercise' ? FITNESS.exerciseCost : 0;
  return { energy: fx.energy * k, mood: fx.mood * k, performance: fx.performance * k, cost: cost * k };
}

// 一鍵行程的內容；「上課」照目前課程每週要的格數排
export function presetSchedule(state, id) {
  if (id === 'study') {
    const course = state.study.course && COURSES_BY_ID[state.study.course.id];
    return course ? [...STUDY_PRESETS[course.slots]] : null;
  }
  const schedule = SCHEDULE_PRESETS.find(p => p.id === id)?.schedule;
  return schedule ? [...schedule] : null;
}

// 這週排了幾次進修（週末算 2 次），和課程要求比較用
export const studySlots = schedule => schedule.reduce((n, id, i) => n + (id === 'study' ? (i >= 5 ? 2 : 1) : 0), 0);

// 畫面用的每週預估：不含上限與體力、心情門檻的影響
export function weeklyForecast(state) {
  const sum = { energy: 0, mood: 0, performance: 0, overtimePay: 0, cost: 0 };
  const sleep = sleepEffects(state);
  for (let i = 0; i < 7; i++) {
    const weekend = i >= 5;
    const activity = state.schedule[i];
    const parts = weekend
      ? [slotEffects(activity, true), sleep]
      : [workEffects(state), slotEffects(activity, false), sleep];
    for (const fx of parts) {
      sum.energy += fx.energy;
      sum.mood += fx.mood;
      sum.performance += fx.performance;
      sum.cost += fx.cost ?? 0;
    }
    if (activity === 'overtime') sum.overtimePay += overtimePay(state, weekend);
  }
  return sum;
}
