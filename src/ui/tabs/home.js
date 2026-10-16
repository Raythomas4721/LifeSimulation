// 「今天」分頁：主畫面就是操作的地方（DESIGN.md §13）
import { DAILY, THRESHOLDS } from '../../data/balance.js';
import { SLOT_SHORT } from '../../data/schedule.js';
import { THOUGHTS } from '../../data/thoughts.js';
import { calendarOf, isWeekend, slotIndex } from '../../core/calendar.js';
import { overtimePay } from '../../systems/finance.js';
import { slotEffects, weeklyForecast } from '../../systems/schedule.js';
import { forcedOn, leaveOn } from '../../systems/statuses.js';
import { esc, formatDate, formatNumber, formatSigned } from '../format.js';
import { activityOf, logText, milestoneText } from '../text.js';
import { timeOf } from '../daytime.js';

const MILESTONE_SHOW_DAYS = 2;
let poke = 0; // 點主角換台詞

export function render() {
  return `
    <div data-block="scene"></div>
    <section class="card" data-tour="tonight">
      <h2 data-bind="tonightTitle"></h2>
      <div class="choices">
        <button class="btn choice" data-action="tonight" data-value="rest" data-pressed="tonightRest">
          <span class="choice-main">🛋️ 休息</span>
          <small data-bind="restFx"></small>
        </button>
        <button class="btn choice" data-action="tonight" data-value="overtime" data-pressed="tonightOvertime">
          <span class="choice-main">💻 加班</span>
          <small data-bind="overtimePayFx"></small>
          <small data-bind="overtimeFx"></small>
        </button>
      </div>
      <p class="note" data-bind="tonightNote"></p>
      <p class="muted" data-bind="sleepNote"></p>
      <p class="muted">會記在每週行程裡，之後每週的這一天都照這樣過。</p>
    </section>
    <section class="card card-tight" data-tour="week">
      <h2>每週行程</h2>
      <div class="week" data-block="week"></div>
      <p class="muted" data-bind="forecast"></p>
    </section>
    <div data-block="warnings"></div>
    <section class="card">
      <h2>最近發生的事</h2>
      <ul class="log" data-block="log"></ul>
    </section>`;
}

const today = state => {
  const c = calendarOf(state.day);
  return { weekend: isWeekend(c.weekday), slot: slotIndex(c.weekday), activity: state.schedule[slotIndex(c.weekday)] };
};

const fxText = fx => `體力 ${formatSigned(fx.energy)} ・ 心情 ${formatSigned(fx.mood)}`;

export const binds = {
  tonightTitle: ({ state }) => {
    const t = today(state);
    return t.weekend ? `今天（週${SLOT_SHORT[t.slot]}）要做什麼？` : '今晚要做什麼？';
  },
  // 請假或被指派加班時，今天實際做的事和行程不同，要講清楚
  tonightNote: ({ state }) => {
    const leave = leaveOn(state, state.day);
    const until = s => formatDate(s.endDay - 1, { weekday: false });
    if (leave?.type === 'hospital') return `🏥 住院中，到 ${until(leave)} 都不能工作。`;
    if (leave) return `🛌 請病假中，到 ${until(leave)} 在家休息。`;
    const forced = forcedOn(state, state.day, today(state).slot);
    if (forced) return `⚠️ 今晚被指派${activityOf(forced.activity).label}（到 ${until(forced)}），行程的選擇之後才生效。`;
    return '';
  },
  sleepNote: () => `💤 不管選哪個，每晚睡覺體力 ${formatSigned(DAILY.sleep.energy)}；上班一天體力 ${formatSigned(DAILY.work.energy)} 起跳。`,
  tonightRest: ({ state }) => today(state).activity === 'rest',
  tonightOvertime: ({ state }) => today(state).activity === 'overtime',
  restFx: ({ state }) => fxText(slotEffects('rest', today(state).weekend)),
  overtimePayFx: ({ state }) => `加班費 +${formatNumber(overtimePay(state, today(state).weekend))}`,
  overtimeFx: ({ state }) => fxText(slotEffects('overtime', today(state).weekend)),
  forecast: ({ state }) => {
    const f = weeklyForecast(state);
    return `每週預估：體力 ${formatSigned(f.energy)} ・ 心情 ${formatSigned(f.mood)} ・ 加班費 +${formatNumber(f.overtimePay)}`;
  },
};

export const blocks = {
  scene: ({ state, progress }) => {
    const s = sceneOf(state, progress);
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

// M4 換成點陣圖；這裡先用 emoji 表示場景，背景顏色跟著天色變
function sceneOf(state, progress) {
  const t = timeOf(state, progress);
  return {
    place: t.part.place,
    sky: t.sky,
    skyIcon: t.icon,
    label: t.part.label,
    status: statusIcon(state),
    kind: t.part.kind,
    weekend: t.weekend,
    overtimeNow: t.part.activity === 'overtime',
  };
}

function statusIcon(state) {
  const { energy, mood } = state.vitals;
  if (energy < THRESHOLDS.low) return '💦';
  if (mood < THRESHOLDS.low) return '🌧️';
  if (mood >= THRESHOLDS.happy) return '🎵';
  return '';
}

// 剛達成的里程碑優先；警訊台詞其次；其他符合的台詞每天輪一句
function thoughtOf(state, scene) {
  const latest = state.log[0];
  if (poke === 0 && latest?.kind === 'milestone' && state.day - latest.day <= MILESTONE_SHOW_DAYS) {
    return { text: `${milestoneText(latest.id)}🎉`, milestone: true };
  }
  const matched = THOUGHTS.filter(t => t.when(state, scene));
  const urgent = matched.find(t => t.urgent);
  const linesOf = t => (typeof t.lines === 'function' ? t.lines(scene) : t.lines);
  const lines = urgent ? linesOf(urgent) : matched.flatMap(linesOf);
  return { text: lines.length ? lines[(state.day + poke) % lines.length] : '…' };
}
