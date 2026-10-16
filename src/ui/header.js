// 上方狀態列：年齡、日期、速度、季節與年度進度、下一件大事、存款、體力、心情
import { TIME } from '../data/balance.js';
import { seasonOf } from '../data/seasons.js';
import { ageOn, calendarOf, yearProgress } from '../core/calendar.js';
import { dailyWage } from '../systems/finance.js';
import { formatDate, formatMoney, formatNumber } from './format.js';
import { upcoming } from './upcoming.js';

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export function render() {
  return `
    <div class="status-row">
      <span class="status-date"><b data-bind="age"></b> ・ <span data-bind="date"></span></span>
      <div class="speed" data-block="speed"></div>
    </div>
    <div class="yearbar" data-tour="year">
      <div class="yearbar-info"><b data-bind="season"></b><span class="muted" data-bind="next"></span></div>
      <div class="yearbar-track">
        <div class="yearbar-months">
          ${MONTHS.map(m => `<span class="season-${seasonOf(m).id}">${m}</span>`).join('')}
        </div>
        <i class="yearbar-elapsed" data-bar="yearPct"></i>
      </div>
    </div>
    <div class="status-money" data-tour="money">
      <span class="money" data-bind="money"></span>
      <span class="wage" data-bind="wage"></span>
    </div>
    <div data-tour="vitals">
      <div class="meter"><span class="meter-label">體力</span><div class="bar bar-energy"><i data-bar="energyPct"></i></div><b class="meter-value" data-bind="energy"></b></div>
      <div class="meter"><span class="meter-label">心情</span><div class="bar bar-mood"><i data-bar="moodPct"></i></div><b class="meter-value" data-bind="mood"></b></div>
    </div>`;
}

export const binds = {
  age: ({ state }) => `${ageOn(state.day)} 歲`,
  date: ({ state }) => formatDate(state.day, { weekday: false }),
  season: ({ state }) => {
    const s = seasonOf(calendarOf(state.day).month);
    return `${s.icon} ${calendarOf(state.day).year} 年・${s.label}`;
  },
  next: ({ state }) => {
    const n = upcoming(state);
    return `下一件大事：${n.title}（${formatDate(n.day, { weekday: false }).slice(5)}）`;
  },
  yearPct: ({ state, progress }) => (yearProgress(state.day) + progress / 365) * 100,
  // 存款依今天已過的比例內插，數字才會持續跳動
  money: ({ state, progress }) => formatMoney(state.money + dailyWage(state) * progress),
  wage: ({ state }) => `月薪 ${formatNumber(state.job.salary)}`,
  energy: ({ state }) => Math.round(state.vitals.energy),
  energyPct: ({ state }) => (state.vitals.energy / state.vitals.energyMax) * 100,
  mood: ({ state }) => Math.round(state.vitals.mood),
  moodPct: ({ state }) => state.vitals.mood,
};

export const blocks = {
  // 窄螢幕放不下 4 顆速度鍵：一顆暫停／繼續，一顆循環切換倍速
  speed: ({ state }) => {
    const { speed, lastSpeed = 1 } = state.settings;
    const paused = speed === 0;
    const shown = paused ? lastSpeed : speed;
    const next = TIME.speeds.find(s => s > shown) ?? TIME.speeds.find(s => s > 0);
    return `
      <button class="btn btn-speed" data-action="speed" data-value="${paused ? lastSpeed : 0}" aria-pressed="${paused}" aria-label="${paused ? '繼續' : '暫停'}">${paused ? '▶' : '⏸'}</button>
      <button class="btn btn-speed" data-action="speed" data-value="${next}" aria-label="目前速度 ${shown} 倍，點一下切換成 ${next} 倍">×${shown}</button>`;
  },
};
