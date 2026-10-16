// 把「今天過了多少」換成畫面上的時刻、時段與天色
import { DAY_START_HOUR, LEAVE_PARTS, SKY, SLOT_PARTS, WEEKDAY_PARTS, WEEKEND_PARTS } from '../data/dayparts.js';
import { calendarOf, isWeekend } from '../core/calendar.js';
import { activityFor } from '../systems/schedule.js';
import { leaveOn } from '../systems/statuses.js';

const pad = n => String(n).padStart(2, '0');

// 今天的時段清單（含每段長度）；請假或住院一整天，其他依行程（含強制加班）決定休息或加班
export function partsOf(state) {
  const c = calendarOf(state.day);
  const weekend = isWeekend(c.weekday);
  const leave = leaveOn(state, state.day);
  if (leave) {
    return [{ from: DAY_START_HOUR, to: DAY_START_HOUR + 24, activity: null, ...LEAVE_PARTS[leave.type] }];
  }
  const activity = activityFor(state, c.weekday);
  const raw = weekend ? WEEKEND_PARTS : WEEKDAY_PARTS;
  return raw.map((p, i) => {
    const to = raw[i + 1]?.from ?? DAY_START_HOUR + 24;
    const slot = p.kind === 'slot' ? SLOT_PARTS[activity] : null;
    return {
      ...p,
      to,
      activity: slot ? activity : null,
      label: slot ? slot[weekend ? 'weekend' : 'weekday'] : p.label,
      short: slot ? slot.short : p.short,
      place: slot ? slot.place : p.place,
    };
  });
}

export function timeOf(state, progress) {
  const hours = DAY_START_HOUR + progress * 24; // 6 ～ 30
  const part = partsOf(state).find(p => hours >= p.from && hours < p.to);
  const hour = Math.floor(hours) % 24;
  const minute = Math.floor(((hours % 1) * 60) / 10) * 10;
  const sky = [...SKY].reverse().find(s => hour >= s.from) ?? SKY[SKY.length - 1];
  return {
    clock: `${pad(hour)}:${pad(minute)}`,
    part,
    sky: sky.sky,
    icon: sky.icon,
    weekend: isWeekend(calendarOf(state.day).weekday),
  };
}
