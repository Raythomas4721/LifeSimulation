import { DAILY, REVIEW, THRESHOLDS } from '../data/balance.js';

export function performanceMultiplier(state) {
  const { energy, mood } = state.vitals;
  let m = 1;
  if (energy < THRESHOLDS.low) m *= THRESHOLDS.lowPenalty;
  if (mood < THRESHOLDS.low) m *= THRESHOLDS.lowPenalty;
  return m;
}

// 平日上班的效果；職級越高越累（DESIGN.md §7.2）
export function workEffects(state, level = state.job.level) {
  return { ...DAILY.work, energy: DAILY.work.energy + (level - 1) * REVIEW.levelWorkEnergy };
}

export function applyWorkday(state, multiplier) {
  const fx = workEffects(state);
  state.vitals.energy += fx.energy;
  state.vitals.mood += fx.mood;
  state.job.performance += fx.performance * multiplier;
  state.stats.workDays += 1;
  state.period.workDays += 1;
}

export function clampVitals(state) {
  const v = state.vitals;
  v.energy = clamp(v.energy, 0, v.energyMax);
  v.mood = clamp(v.mood, 0, 100);
  state.job.performance = clamp(state.job.performance, 0, 100);
}

export const gradeFor = performance => REVIEW.grades.find(g => performance >= g.min).grade;

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
