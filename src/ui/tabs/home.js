// 「今天」分頁：主畫面就是操作的地方（DESIGN.md §13）
// 一天只有 0.4 秒，所以不做「今晚要做什麼」，直接調整每週行程
import { DAILY, THRESHOLDS } from '../../data/balance.js';
import { SCHEDULE_PRESETS, SLOT_SHORT } from '../../data/schedule.js';
import { THOUGHTS } from '../../data/thoughts.js';
import { seasonOf } from '../../data/seasons.js';
import { calendarOf } from '../../core/calendar.js';
import { overtimePay } from '../../systems/finance.js';
import { slotEffects, weeklyForecast } from '../../systems/schedule.js';
import { leaveOn } from '../../systems/statuses.js';
import { esc, formatDate, formatNumber, formatSigned } from '../format.js';
import { activityOf, logText, milestoneText } from '../text.js';

const MILESTONE_SHOW_DAYS = 14; // 里程碑台詞顯示幾天（約 5 秒）
const THOUGHT_DAYS = 10; // 每幾天換一句台詞
let poke = 0; // 點主角換台詞

export function render() {
  return `
    <div data-block="scene"></div>
    <section class="card card-tight" data-tour="week">
      <h2>下班後的時間怎麼用？</h2>
      <div class="preset-row" data-block="presets"></div>
      <div class="week" data-block="week"></div>
      <p class="note" data-bind="weekNote"></p>
      <ul class="legend">
        <li data-bind="restLegend"></li>
        <li data-bind="overtimeLegend"></li>
        <li data-bind="sleepLegend"></li>
      </ul>
      <p class="forecast" data-bind="forecast"></p>
    </section>
    <div data-block="warnings"></div>
    <section class="card">
      <h2>最近發生的事</h2>
      <ul class="log" data-block="log"></ul>
    </section>`;
}

const forcedNow = state => state.statuses.find(s => s.type === 'forceSlot' && s.startDay <= state.day && state.day < s.endDay);
const fxText = fx => `體力 ${formatSigned(fx.energy)}、心情 ${formatSigned(fx.mood)}`;

export const binds = {
  // 請假或被指派加班時，實際做的事和行程不同，要講清楚
  weekNote: ({ state }) => {
    const until = s => formatDate(s.endDay - 1, { weekday: false });
    const leave = leaveOn(state, state.day);
    if (leave?.type === 'hospital') return `🏥 住院中，到 ${until(leave)} 都不能工作。`;
    if (leave) return `🛌 請病假中，到 ${until(leave)} 在家休息。`;
    const forced = forcedNow(state);
    if (forced) return `⚠️ 被指派${activityOf(forced.activity).label}到 ${until(forced)}，這段期間照指派的來。`;
    return '';
  },
  restLegend: () => `🛋️ 休息：${fxText(slotEffects('rest', false))}`,
  overtimeLegend: ({ state }) => `💻 加班：${fxText(slotEffects('overtime', false))}、表現↑、加班費 +${formatNumber(overtimePay(state, false))}（週末加倍）`,
  sleepLegend: () => `💤 每晚睡覺體力 ${formatSigned(DAILY.sleep.energy)}；上班一天體力 ${formatSigned(DAILY.work.energy)} 起跳`,
  forecast: ({ state }) => {
    const f = weeklyForecast(state);
    return `每週預估：體力 ${formatSigned(f.energy)}・心情 ${formatSigned(f.mood)}・加班費 +${formatNumber(f.overtimePay)}`;
  },
};

export const blocks = {
  scene: ({ state }) => {
    const s = sceneOf(state);
    const thought = thoughtOf(state, s);
    return `
      <div class="scene sky-${s.sky}">
        <span class="scene-sky" aria-hidden="true">${s.skyIcon}</span>
        <span class="scene-place" aria-hidden="true">${s.place}</span>
        <span class="scene-bubble${thought.milestone ? ' is-milestone' : ''}">${esc(thought.text)}</span>
        <button class="scene-player" data-action="poke" aria-label="和主角說話">🙂${s.status ? `<span class="scene-status">${s.status}</span>` : ''}</button>
        <span class="scene-label">${s.label}</span>
      </div>`;
  },

  presets: ({ state }) =>
    SCHEDULE_PRESETS.filter(p => p.schedule)
      .map(p => {
        const on = p.schedule.every((id, i) => state.schedule[i] === id);
        return `<button class="btn" data-action="preset" data-value="${p.id}" aria-pressed="${on}">${p.label}</button>`;
      })
      .join(''),

  // 「今天」的標示由 app.js 依 data-slot 切換 class，換日時不用重畫按鈕
  week: ({ state }) =>
    state.schedule
      .map((id, i) => {
        const a = activityOf(id);
        return `<button class="chip" data-action="toggleSlot" data-index="${i}" data-slot="${i}" aria-label="週${SLOT_SHORT[i]}：${a.label}，點一下切換"><small>${SLOT_SHORT[i]}</small>${a.emoji}</button>`;
      })
      .join(''),

  warnings: ({ state }) => {
    const { energy, mood } = state.vitals;
    const items = [];
    if (energy <= 0) items.push('體力已經見底，再這樣下去身體會出問題。');
    else if (energy < THRESHOLDS.low) items.push('體力不足：工作表現累積減半。');
    if (mood < THRESHOLDS.low) items.push('心情很差：工作表現累積減半。');
    if (state.money < 0) items.push('存款是負的：每月 1 日會加收利息（年利率 15%）。');
    if (!items.length) return '';
    return `<section class="card card-warn"><h2>注意</h2><ul>${items.map(t => `<li>${t}</li>`).join('')}</ul></section>`;
  },

  log: ({ state }) => state.log.slice(0, 8).map(e => `<li>${logText(e)}</li>`).join(''),
};

export const actions = {
  poke: () => {
    poke++;
  },
};

// M4 換成點陣圖；這裡先用 emoji 表示，背景顏色跟著季節變
function sceneOf(state) {
  const season = seasonOf(calendarOf(state.day).month);
  const leave = leaveOn(state, state.day);
  const forced = forcedNow(state);
  const [place, kind, doing] =
    leave?.type === 'hospital' ? ['🏥', 'hospital', '住院中']
    : leave ? ['🛌', 'sick', '請病假在家休息']
    : forced ? ['💻', 'work', '被指派加班中']
    : ['🏢', 'work', '努力上班中'];
  const overtimeDays = state.schedule.filter(id => id === 'overtime').length;
  return {
    place,
    kind,
    sky: season.id,
    skyIcon: season.icon,
    label: `${season.label}天・${doing}`,
    status: statusIcon(state),
    season: season.id,
    overtimeHeavy: Boolean(forced) || overtimeDays >= 3,
  };
}

function statusIcon(state) {
  const { energy, mood } = state.vitals;
  if (energy < THRESHOLDS.low) return '💦';
  if (mood < THRESHOLDS.low) return '🌧️';
  if (mood >= THRESHOLDS.happy) return '🎵';
  return '';
}

// 剛達成的里程碑優先；警訊台詞其次；其他符合的台詞每隔幾天輪一句
function thoughtOf(state, scene) {
  const latest = state.log.find(e => e.kind === 'milestone');
  if (poke === 0 && latest && state.day - latest.day <= MILESTONE_SHOW_DAYS) {
    return { text: `${milestoneText(latest.id)}🎉`, milestone: true };
  }
  const matched = THOUGHTS.filter(t => t.when(state, scene));
  const urgent = matched.find(t => t.urgent);
  const linesOf = t => (typeof t.lines === 'function' ? t.lines(scene) : t.lines);
  const lines = urgent ? linesOf(urgent) : matched.flatMap(linesOf);
  return { text: lines.length ? lines[(Math.floor(state.day / THOUGHT_DAYS) + poke) % lines.length] : '…' };
}
