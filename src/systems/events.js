// 事件系統（DESIGN.md §10）：每天開始時擲骰，跳出事件卡片；玩家選擇後顯示結果
import { EVENTS } from '../data/balance.js';
import { EVENT_LIST, EVENTS_BY_ID } from '../data/events.js';
import { calendarOf, dayOfDate, isWeekend } from '../core/calendar.js';
import { addLog } from '../core/state.js';
import { pushCard } from './cards.js';
import { applyEffects, diff, snapshot } from './effects.js';
import { addStatus } from './statuses.js';
import { collapse, hospitalize, startSickLeave } from './health.js';

export function eventCalendar(day) {
  const c = calendarOf(day);
  return { ...c, weekend: isWeekend(c.weekday) };
}

const cooledDown = (state, e) => {
  const last = state.events.last[e.id];
  return last == null || state.day - last >= (e.cooldownDays ?? EVENTS.cooldownDays);
};

const weightOf = (e, state, c) => (typeof e.weight === 'function' ? e.weight(state, c) : e.weight ?? EVENTS.weight);

// 劇情與節日（有 on 的事件）最早可以出現的日子，不考慮間隔；沒有就回傳 null（§10.2）
// - on.day：開局後第幾天的劇情，只出現一次；被間隔擋住就往後延，一定會出現
// - on.month + on.date：每年的節日，可以延後 holidayWindowDays 天，再排不進去就跳過那一年
// due 是原本該出現的日子，同一天有好幾件時先處理原本比較早的
// from 是最早能出現的日子（預告用：扣掉事件間隔後才可能出現）
export function scheduledDay(e, state, from = state.day) {
  const seen = (state.events.counts[e.id] ?? 0) > 0;
  if (e.on.day != null) return seen ? null : { day: Math.max(e.on.day, from), due: e.on.day };
  if (e.once && seen) return null;
  const { year } = calendarOf(state.day);
  const last = state.events.last[e.id] ?? -Infinity;
  for (const y of [year, year + 1, year + 2]) {
    const start = dayOfDate(y, e.on.month, e.on.date);
    if (start < 0) continue; // 開局前的節日不算
    if (from > start + EVENTS.holidayWindowDays || last >= start) continue;
    if (start - last < EVENTS.holidayCooldownDays) continue; // 節日隔一年再出現，降低重複感
    const day = Math.max(start, from);
    if (e.condition && !e.condition({ ...state, day }, eventCalendar(day))) continue;
    return { day, due: start, holiday: true };
  }
  return null;
}

// 依可以出現的日子排序；同一天有好幾件時，新人劇情優先（和第一年的時間點綁在一起），節日其次
function scheduledList(state, from) {
  return EVENT_LIST.filter(e => e.on)
    .map(e => ({ event: e, ...scheduledDay(e, state, from) }))
    .filter(x => x.day != null)
    .sort((a, b) => a.day - b.day || Number(Boolean(a.holiday)) - Number(Boolean(b.holiday)) || a.due - b.due);
}

export const nextScheduled = (state, from = state.day) => scheduledList(state, from)[0] ?? null;

// 在新的一天開始時呼叫。兩個事件至少隔 minGapDays 天；劇情與節日優先，
// 隨機事件只拿來填長空檔，快到劇情或節日時會讓位
export function rollEvent(state, rng) {
  if (state.day - (state.events.lastDay ?? -Infinity) < EVENTS.minGapDays) return;
  const next = nextScheduled(state);
  if (next && next.day <= state.day) return triggerEvent(state, next.event.id);
  if (state.pending) return;
  if (next && next.day - state.day < EVENTS.minGapDays) return;
  if (rng.next() >= EVENTS.dailyChance) return;
  const c = eventCalendar(state.day);
  const pool = EVENT_LIST.filter(e => !e.followUp && !e.on && cooledDown(state, e) && (!e.condition || e.condition(state, c)));
  if (!pool.length) return;
  const weights = pool.map(e => weightOf(e, state, c));
  let r = rng.next() * weights.reduce((a, b) => a + b, 0);
  const picked = pool.find((e, i) => (r -= weights[i]) < 0) ?? pool[pool.length - 1];
  triggerEvent(state, picked.id);
}

export function triggerEvent(state, id) {
  state.events.lastDay = state.day;
  state.events.last[id] = state.day;
  state.events.counts[id] = (state.events.counts[id] ?? 0) + 1;
  if (state.period) state.period.events = (state.period.events ?? 0) + 1;
  pushCard(state, { kind: 'event', id, step: 'choose' });
}

export const defaultChoice = id => Math.max(0, EVENTS_BY_ID[id].choices.findIndex(c => c.default));

// chance.p 可以是函式，例如外語越好越容易成功
export const chanceOf = (choice, state) => (typeof choice.chance.p === 'function' ? choice.chance.p(state) : choice.chance.p);

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
  let illness = null;
  // effects 可以是函式，依目前狀態決定數值（例如學費補助是學費的一半）
  const apply = fx => {
    const effects = typeof fx === 'function' ? fx(state) : fx;
    if (!effects) return;
    applyEffects(state, effects);
    if (effects.illness) illness = effects.illness;
  };

  apply(choice.effects);
  if (choice.chance) {
    if (rng.next() < chanceOf(choice, state)) {
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
    const endDay = state.day + (f.days ?? f.weeks * 7);
    addStatus(state, { type: 'forceSlot', startDay: state.day, endDay, activity: f.activity, slots: f.slots, source: event.id });
    notes.push({ kind: 'forceSlot', endDay, ...f });
  }
  if (choice.crisis) Object.assign(state.crisis, choice.crisis); // 例如被約談後進入績效改善計畫
  if (choice.sickLeave) {
    startSickLeave(state, state.day, choice.sickLeave);
    notes.push({ kind: 'sickLeave', days: choice.sickLeave });
  }

  Object.assign(card, { step: 'result', choice: index, text, deltas: diff(before, snapshot(state)), notes });
  addLog(state, { kind: 'event', id: event.id, choice: index });
  if (illness === 'collapse') collapse(state, state.day);
  if (illness === 'hospital') hospitalize(state, state.day);
  if (followUp) triggerEvent(state, followUp);
}
