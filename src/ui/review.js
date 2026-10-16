// 週日檢討與月結的卡片（DESIGN.md §5.4）：從下方滑出，選完行程才繼續
import { BOSS, BOSS_COMMENTS } from '../data/reviews.js';
import { SCHEDULE_PRESETS, SLOT_SHORT } from '../data/schedule.js';
import { formatDate, formatMoney, formatSigned } from './format.js';
import { activityOf, nextActivity } from './text.js';

let draft = null; // 「自己排」時暫存的行程

export const binds = {};

export const blocks = {
  review: ({ state }) => {
    const p = state.pending;
    if (!p) {
      draft = null;
      return '';
    }
    const r = p.report;
    const title = p.type === 'weekly' ? `第 ${p.number} 週結束了` : `${p.month} 月結束了`;
    const comment = BOSS_COMMENTS.find(c => c.when(r)).text;
    const range = `${formatDate(r.startDay, { weekday: false })} ～ ${formatDate(r.endDay, { weekday: false })}`;
    return `
      <div class="sheet-backdrop">
        <section class="sheet card" role="dialog" aria-modal="true" aria-labelledby="review-title">
          <h2 id="review-title">📋 ${title}</h2>
          <p class="muted">${range}</p>
          <dl class="kv">
            <dt>收入</dt><dd>${formatMoney(r.income)}</dd>
            ${r.overtimePay ? `<dt>　其中加班費</dt><dd>${formatMoney(r.overtimePay)}</dd>` : ''}
            <dt>支出</dt><dd>${formatMoney(r.expenses)}</dd>
            <dt>存款</dt><dd>${formatMoney(r.moneyStart)} → ${formatMoney(r.moneyEnd)}</dd>
            <dt>體力</dt><dd>${Math.round(r.energyStart)} → ${Math.round(r.energyEnd)}</dd>
            <dt>心情</dt><dd>${Math.round(r.moodStart)} → ${Math.round(r.moodEnd)}</dd>
            <dt>工作表現</dt><dd>${formatSigned(r.perfGain, 1)}</dd>
            <dt>加班</dt><dd>${r.overtimeSlots} 次</dd>
          </dl>
          <p class="speech"><b>${BOSS}：</b>「${comment}」</p>
          <h3>接下來怎麼安排？</h3>
          ${draft ? editor(draft) : presets()}
        </section>
      </div>`;
  },
};

function presets() {
  return `
    <div class="preset-grid">
      ${SCHEDULE_PRESETS.map(p => `<button class="btn${p.id === 'keep' ? ' btn-primary' : ''}" data-action="reviewPreset" data-value="${p.id}">${p.label}</button>`).join('')}
    </div>
    <button class="btn btn-block" data-action="reviewCustom">自己排…</button>`;
}

function editor(schedule) {
  const chips = schedule
    .map((id, i) => {
      const a = activityOf(id);
      return `<button class="chip" data-action="reviewToggle" data-index="${i}" aria-label="週${SLOT_SHORT[i]}：${a.label}，點一下切換"><small>${SLOT_SHORT[i]}</small>${a.emoji}</button>`;
    })
    .join('');
  return `
    <p class="muted">點一下切換休息或加班。</p>
    <div class="week">${chips}</div>
    <div class="preset-grid">
      <button class="btn" data-action="reviewBack">返回</button>
      <button class="btn btn-primary" data-action="reviewConfirm">照這樣安排</button>
    </div>`;
}

export const actions = {
  reviewPreset: ({ value }, ctl) => {
    const preset = SCHEDULE_PRESETS.find(p => p.id === value);
    ctl.resolveReview(preset.schedule ?? null);
  },
  reviewCustom: (_, ctl) => {
    draft = [...ctl.state.schedule];
  },
  reviewToggle: ({ index }) => {
    draft[index] = nextActivity(draft[index]);
  },
  reviewBack: () => {
    draft = null;
  },
  reviewConfirm: (_, ctl) => {
    const schedule = draft;
    draft = null;
    ctl.resolveReview(schedule);
  },
};
