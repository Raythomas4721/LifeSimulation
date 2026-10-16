// 持續狀態（DESIGN.md §14.3）：病假、住院、強制時段、延遲效果
// startDay ≤ 遊戲日 < endDay 期間有效；delayed 只在 day 那天生效一次
import { applyEffects } from './effects.js';

export function addStatus(state, status) {
  state.statuses.push(status);
}

const activeOn = (s, day) => s.startDay <= day && day < s.endDay;

// 住院優先於病假
export const leaveOn = (state, day) =>
  state.statuses.find(s => s.type === 'hospital' && activeOn(s, day)) ??
  state.statuses.find(s => s.type === 'sickLeave' && activeOn(s, day)) ??
  null;

export const forcedOn = (state, day, slot) =>
  state.statuses.find(s => s.type === 'forceSlot' && activeOn(s, day) && (!s.slots || s.slots.includes(slot))) ?? null;

// 當天結算後呼叫：套用今天到期的延遲效果，移除明天起不再有效的狀態；回傳剛結束的狀態
export function processStatuses(state) {
  const day = state.day;
  for (const s of state.statuses) {
    if (s.type === 'delayed' && s.day === day) applyEffects(state, s.effects);
  }
  const ended = state.statuses.filter(s => (s.type === 'delayed' ? s.day <= day : s.endDay <= day + 1));
  state.statuses = state.statuses.filter(s => !ended.includes(s));
  return ended;
}
