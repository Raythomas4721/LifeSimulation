// 多個畫面共用的文字
import { monthsBetween } from '../core/calendar.js';
import { LADDER } from '../data/jobs.js';
import { MILESTONES } from '../data/milestones.js';
import { SLOT_ACTIVITIES } from '../data/schedule.js';
import { formatDate, formatMoney, formatMonths } from './format.js';

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
};

export const logText = entry => `${formatDate(entry.day, { weekday: false })}　${LOG_TEXT[entry.kind](entry)}`;
