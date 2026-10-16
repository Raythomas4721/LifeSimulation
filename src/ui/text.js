// 多個畫面共用的文字
import { monthsBetween } from '../core/calendar.js';
import { LADDER } from '../data/jobs.js';
import { MILESTONES } from '../data/milestones.js';
import { SLOT_ACTIVITIES, SLOT_SHORT } from '../data/schedule.js';
import { EVENTS_BY_ID } from '../data/events.js';
import { formatDate, formatMoney, formatMonths, formatSigned } from './format.js';

export const activityOf = id => SLOT_ACTIVITIES.find(a => a.id === id);
export const nextActivity = id => SLOT_ACTIVITIES[(SLOT_ACTIVITIES.findIndex(a => a.id === id) + 1) % SLOT_ACTIVITIES.length].id;
export const milestoneText = id => MILESTONES.find(m => m.id === id).text;

export const jobTitle = state => LADDER.find(l => l.level === state.job.level).title;
export const tenure = state => formatMonths(monthsBetween(state.job.startDay, state.day));
export const totalYears = state => formatMonths(monthsBetween(0, state.day));

const LOG_TEXT = {
  start: () => '第一天上班，成為專員。',
  livingCost: e => `繳了房租和生活費 ${formatMoney(e.amount)}。`,
  interest: e => `存款是負的，被收了利息 ${formatMoney(e.amount)}。`,
  milestone: e => `🎉 ${milestoneText(e.id)}`,
  event: e => `${EVENTS_BY_ID[e.id].title}：${EVENTS_BY_ID[e.id].choices[e.choice].text}`,
  review: e => `${e.year} 年度考核 ${e.grade}。`,
  promotion: e => `🎉 升遷為${e.title}！`,
  declinePromotion: e => `婉拒了升遷為${e.title}。`,
  bonus: e => `年終入帳 ${formatMoney(e.amount)}。`,
  sickLeave: e => `請病假 ${e.days} 天。`,
  collapse: () => '😵 病倒了，請假一週。',
  hospital: () => '🏥 住院了。',
  discharge: () => '出院了。',
};

const STAT_LABELS = { money: '存款', energy: '體力', mood: '心情', performance: '工作表現' };

// 數值變化的條列文字，例如「心情 −3」「存款 −NT$ 60」
export function deltaItems(deltas = {}) {
  return Object.entries(deltas).map(([key, d]) => {
    if (key === 'money') return `${STAT_LABELS.money} ${d > 0 ? '+' : '−'}${formatMoney(Math.abs(d))}`;
    return `${STAT_LABELS[key]} ${formatSigned(d, key === 'performance' ? 1 : 0)}`;
  });
}

// 事件結果的附註：延遲效果、強制時段、病假
export function noteText(note) {
  if (note.kind === 'delayed') return `明天：${deltaItems(note.effects).join('、')}`;
  if (note.kind === 'sickLeave') return `請病假 ${note.days} 天，這幾天在家休息、領半薪`;
  if (note.kind === 'forceSlot') {
    const days = note.slots.map(i => `週${SLOT_SHORT[i]}`).join('、');
    return `到 ${formatDate(note.endDay - 1, { weekday: false })} 為止，${days}晚上要${activityOf(note.activity).label}`;
  }
  return '';
}

export const logText = entry => `${formatDate(entry.day, { weekday: false })}　${LOG_TEXT[entry.kind](entry)}`;
