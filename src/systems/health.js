// 傷病（DESIGN.md §6.3）：輕症靠 sick_day 事件，這裡處理病假、病倒、住院
import { HEALTH } from '../data/balance.js';
import { addLog } from '../core/state.js';
import { pushCard } from './cards.js';
import { applyEffects, diff, snapshot } from './effects.js';
import { addStatus, leaveOn } from './statuses.js';

export function startSickLeave(state, from, days) {
  addStatus(state, { type: 'sickLeave', startDay: from, endDay: from + days });
  addLog(state, { kind: 'sickLeave', days });
}

// from 是開始請假的那天；同一年病倒到第 3 次就改成住院
export function collapse(state, from) {
  if (leaveOn(state, from)) return;
  state.health.collapses += 1;
  state.stats.collapses += 1;
  if (state.health.collapses >= HEALTH.hospitalAfter) return hospitalize(state, from);
  const before = snapshot(state);
  applyEffects(state, { money: -HEALTH.collapseMedical, mood: HEALTH.collapseMood });
  addStatus(state, {
    type: 'sickLeave',
    startDay: from,
    endDay: from + HEALTH.collapseLeaveDays,
    restoreEnergy: HEALTH.collapseRestoreEnergy,
  });
  addLog(state, { kind: 'collapse' });
  pushCard(state, { kind: 'notice', id: 'collapse', deltas: diff(before, snapshot(state)) });
}

// 同一年病倒 3 次，或重症事件直接住院
export function hospitalize(state, from) {
  if (leaveOn(state, from)?.type === 'hospital') return;
  const before = snapshot(state);
  applyEffects(state, {
    money: -HEALTH.hospitalMedical,
    mood: HEALTH.hospitalMood,
    performance: HEALTH.hospitalPerformance,
  });
  addStatus(state, { type: 'hospital', startDay: from, endDay: from + HEALTH.hospitalDays });
  state.stats.hospitalStays += 1;
  addLog(state, { kind: 'hospital' });
  pushCard(state, { kind: 'notice', id: 'hospital', deltas: diff(before, snapshot(state)) });
}

// 當天結算後：體力見底就病倒，明天開始請假
export function checkCollapse(state) {
  if (state.vitals.energy <= 0) collapse(state, state.day + 1);
}

export function onStatusEnded(state, status) {
  if (status.restoreEnergy) state.vitals.energy = Math.max(state.vitals.energy, status.restoreEnergy);
  if (status.type === 'hospital') {
    state.vitals.energy = state.vitals.energyMax;
    state.health.collapses = 0;
    addLog(state, { kind: 'discharge' });
    pushCard(state, { kind: 'notice', id: 'discharge' });
  }
}

// 病假那天的薪水比例：每年前 30 天半薪，之後無薪
export function sickPayRate(state) {
  state.health.sickDays += 1;
  return state.health.sickDays <= HEALTH.sickPayDays ? HEALTH.sickPayRate : 0;
}

export function resetHealthYear(state) {
  state.health.collapses = 0;
  state.health.sickDays = 0;
}
