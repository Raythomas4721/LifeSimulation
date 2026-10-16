// 套用事件或通知的數值效果；金錢同時記進這段期間的收支（檢討卡片用）
import { FITNESS, SKILLS } from '../data/balance.js';

// [物件, 欄位, 上限]；技能與體能從 v0.2 起可以出現在事件效果裡
const STATS = {
  money: s => [s, 'money', Infinity],
  energy: s => [s.vitals, 'energy', s.vitals.energyMax],
  mood: s => [s.vitals, 'mood', 100],
  performance: s => [s.job, 'performance', 100],
  professional: s => [s.skills, 'professional', SKILLS.max],
  management: s => [s.skills, 'management', SKILLS.max],
  language: s => [s.skills, 'language', SKILLS.max],
  programming: s => [s.skills, 'programming', SKILLS.max],
  fitness: s => [s, 'fitness', FITNESS.max],
};

export function applyEffects(state, effects = {}) {
  for (const [key, value] of Object.entries(effects)) {
    if (!STATS[key] || !value) continue;
    const [obj, field, max] = STATS[key](state);
    obj[field] = key === 'money' ? obj[field] + value : Math.min(max, Math.max(0, obj[field] + value));
    if (key === 'money') {
      if (value > 0) state.period.income += value;
      else state.period.expenses -= value;
    }
  }
}

const read = (state, key) => {
  const [obj, field] = STATS[key](state);
  return obj[field];
};

export const snapshot = state => Object.fromEntries(Object.keys(STATS).map(key => [key, read(state, key)]));

export function diff(before, after) {
  const out = {};
  for (const key of Object.keys(before)) {
    const d = after[key] - before[key];
    if (Math.abs(d) > 0.001) out[key] = d;
  }
  return out;
}
