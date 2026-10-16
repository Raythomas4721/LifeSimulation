// 事件系統（DESIGN.md §10）：每天開始時擲骰，跳出事件卡片；玩家選擇後顯示結果
import { EVENTS } from '../data/balance.js';
import { EVENT_LIST, EVENTS_BY_ID } from '../data/events.js';
import { calendarOf, isWeekend } from '../core/calendar.js';
import { addLog } from '../core/state.js';
import { pushCard } from './cards.js';
import { applyEffects, diff, snapshot } from './effects.js';
import { addStatus } from './statuses.js';
import { collapse, startSickLeave } from './health.js';

export function eventCalendar(day) {
  const c = calendarOf(day);
  return { ...c, weekend: isWeekend(c.weekday) };
}

const cooledDown = (state, e) => {
  const last = state.events.last[e.id];
  return last == null || state.day - last >= (e.cooldownDays ?? EVENTS.cooldownDays);
};

const weightOf = (e, state, c) => (typeof e.weight === 'function' ? e.weight(state, c) : e.weight ?? EVENTS.weight);

// 在新的一天開始時呼叫；已經有卡片在等時不再疊事件
export function rollEvent(state, rng) {
  if (state.pending || rng.next() >= EVENTS.dailyChance) return;
  const c = eventCalendar(state.day);
  const pool = EVENT_LIST.filter(e => !e.followUp && cooledDown(state, e) && (!e.condition || e.condition(state, c)));
  if (!pool.length) return;
  const weights = pool.map(e => weightOf(e, state, c));
  let r = rng.next() * weights.reduce((a, b) => a + b, 0);
  const picked = pool.find((e, i) => (r -= weights[i]) < 0) ?? pool[pool.length - 1];
  triggerEvent(state, picked.id);
}

export function triggerEvent(state, id) {
  state.events.last[id] = state.day;
  state.events.counts[id] = (state.events.counts[id] ?? 0) + 1;
  pushCard(state, { kind: 'event', id, step: 'choose' });
}

export const defaultChoice = id => Math.max(0, EVENTS_BY_ID[id].choices.findIndex(c => c.default));

// 套用選項的效果，卡片換成「結果」畫面；後續事件與病倒通知排進佇列
export function chooseEvent(state, rng, index) {
  const card = state.pending;
  if (card?.kind !== 'event' || card.step !== 'choose') return;
  const event = EVENTS_BY_ID[card.id];
  const choice = event.choices[index];
  if (!choice) return;

  const before = snapshot(state);
  let text = choice.result ?? '';
  let followUp = null;
  let collapsed = false;
  const apply = fx => {
    if (!fx) return;
    applyEffects(state, fx);
    if (fx.illness === 'collapse') collapsed = true;
  };

  apply(choice.effects);
  if (choice.chance) {
    if (rng.next() < choice.chance.p) {
      apply(choice.chance.effects);
      text = choice.chance.result ?? text;
      followUp = choice.chance.then ?? null;
    } else {
      apply(choice.chance.otherwise);
      text = choice.chance.otherwiseResult ?? text;
    }
  }

  // 事件卡片在一天開始時出現，所以「明天」是 day + 1、強制時段從今天晚上算起
  const notes = [];
  if (choice.delayed) {
    addStatus(state, { type: 'delayed', day: state.day + choice.delayed.days, effects: choice.delayed.effects });
    notes.push({ kind: 'delayed', ...choice.delayed });
  }
  if (choice.forceSlots) {
    const f = choice.forceSlots;
    addStatus(state, { type: 'forceSlot', startDay: state.day, endDay: state.day + f.weeks * 7, activity: f.activity, slots: f.slots, source: event.id });
    notes.push({ kind: 'forceSlot', endDay: state.day + f.weeks * 7, ...f });
  }
  if (choice.sickLeave) {
    startSickLeave(state, state.day, choice.sickLeave);
    notes.push({ kind: 'sickLeave', days: choice.sickLeave });
  }

  Object.assign(card, { step: 'result', choice: index, text, deltas: diff(before, snapshot(state)), notes });
  addLog(state, { kind: 'event', id: event.id, choice: index });
  if (collapsed) collapse(state, state.day);
  if (followUp) triggerEvent(state, followUp);
}
