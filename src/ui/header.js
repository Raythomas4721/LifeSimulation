// 上方狀態列：年齡、日期、速度、時鐘與今天的時間軸、存款、體力、心情
import { TIME } from '../data/balance.js';
import { ageOn } from '../core/calendar.js';
import { dailyWage } from '../systems/finance.js';
import { partsOf, timeOf } from './daytime.js';
import { formatDate, formatMoney, formatNumber } from './format.js';

export function render() {
  return `
    <div class="status-row">
      <span class="status-date"><b data-bind="age"></b> ・ <span data-bind="date"></span></span>
      <div class="speed" data-block="speed"></div>
    </div>
    <div class="daybar" data-tour="clock">
      <div class="daybar-info"><b class="daybar-clock" data-bind="clock"></b><span data-bind="doing"></span></div>
      <div class="daybar-track">
        <div class="daybar-parts" data-block="dayparts"></div>
        <i class="daybar-elapsed" data-bar="dayPct"></i>
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
  date: ({ state }) => formatDate(state.day),
  // 存款依今天已過的比例內插，數字才會持續跳動
  money: ({ state, progress }) => formatMoney(state.money + dailyWage(state) * progress),
  wage: ({ state }) => `↑ ${formatNumber(dailyWage(state))}/日`,
  clock: ({ state, progress }) => {
    const t = timeOf(state, progress);
    return `${t.icon} ${t.clock}`;
  },
  doing: ({ state, progress }) => timeOf(state, progress).part.label,
  dayPct: ({ progress }) => progress * 100,
  energy: ({ state }) => Math.round(state.vitals.energy),
  energyPct: ({ state }) => (state.vitals.energy / state.vitals.energyMax) * 100,
  mood: ({ state }) => Math.round(state.vitals.mood),
  moodPct: ({ state }) => state.vitals.mood,
};

export const blocks = {
  // 今天的時間軸：06:00 到隔天 06:00，每段寬度照時數；已經過去的部分由 dayPct 蓋上一層
  dayparts: ({ state }) =>
    partsOf(state)
      .map(p => {
        const width = ((p.to - p.from) / 24) * 100;
        const cls = `daybar-part part-${p.activity ?? p.kind}`;
        return `<span class="${cls}" style="width:${width}%" title="${p.from % 24}:00 ${p.label}">${p.short}</span>`;
      })
      .join(''),

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
