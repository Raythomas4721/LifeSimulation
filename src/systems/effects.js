// 套用事件或通知的數值效果；金錢同時記進這段期間的收支（檢討卡片用）
const STATS = {
  money: s => [s, 'money'],
  energy: s => [s.vitals, 'energy'],
  mood: s => [s.vitals, 'mood'],
  performance: s => [s.job, 'performance'],
};

export function applyEffects(state, effects = {}) {
  for (const [key, value] of Object.entries(effects)) {
    if (!STATS[key] || !value) continue;
    const [obj, field] = STATS[key](state);
    obj[field] += value;
    if (key === 'money') {
      if (value > 0) state.period.income += value;
      else state.period.expenses -= value;
    }
  }
  const v = state.vitals;
  v.energy = Math.min(v.energyMax, Math.max(0, v.energy));
  v.mood = Math.min(100, Math.max(0, v.mood));
  state.job.performance = Math.min(100, Math.max(0, state.job.performance));
}

export const snapshot = state => ({
  money: state.money,
  energy: state.vitals.energy,
  mood: state.vitals.mood,
  performance: state.job.performance,
});

export function diff(before, after) {
  const out = {};
  for (const key of Object.keys(before)) {
    const d = after[key] - before[key];
    if (Math.abs(d) > 0.001) out[key] = d;
  }
  return out;
}
