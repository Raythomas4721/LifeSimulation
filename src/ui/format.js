import { calendarOf } from '../core/calendar.js';

const WEEKDAYS = '日一二三四五六';
const number = new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 0 });
const pad = n => String(n).padStart(2, '0');

export const formatNumber = n => number.format(Math.round(n));

export function formatMoney(n) {
  const r = Math.round(n);
  return r < 0 ? `NT$ −${number.format(-r)}` : `NT$ ${number.format(r)}`;
}

export function formatSigned(n, digits = 0) {
  const v = Number(n.toFixed(digits));
  return v > 0 ? `+${v}` : v < 0 ? `−${-v}` : '±0';
}

export function formatDate(day, { weekday = true } = {}) {
  const c = calendarOf(day);
  const text = `${c.year}/${pad(c.month)}/${pad(c.date)}`;
  return weekday ? `${text}（${WEEKDAYS[c.weekday]}）` : text;
}

export function formatMonths(months) {
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (!y) return `${m} 個月`;
  return m ? `${y} 年 ${m} 個月` : `${y} 年`;
}

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = s => String(s).replace(/[&<>"']/g, c => ESCAPES[c]);
