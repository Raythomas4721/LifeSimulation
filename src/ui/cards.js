// 從下方滑出的卡片：檢討與月結、事件、通知。state.pending 有值時顯示，時間暫停
import { EVENTS_BY_ID } from '../data/events.js';
import { NOTICES } from '../data/notices.js';
import { REVIEW } from '../data/balance.js';
import { workEffects } from '../systems/work.js';
import { esc, formatMoney, formatSigned } from './format.js';
import { deltaItems, noteText } from './text.js';
import * as review from './review.js';

export const binds = {};

export const blocks = {
  card: ({ state }) => {
    const p = state.pending;
    if (p?.kind !== 'review') review.resetDraft();
    if (!p) return '';
    const inner = p.kind === 'review' ? review.reviewCard(p) : p.kind === 'event' ? eventCard(p) : noticeCard(p, state);
    // data-card 讓每張新卡片的 HTML 都不同，滑出動畫才會重播
    return `
      <div class="sheet-backdrop">
        <section class="sheet card" role="dialog" aria-modal="true" aria-labelledby="card-title" data-card="${p.kind}-${p.id ?? p.number}-${p.step ?? ''}">
          ${inner}
        </section>
      </div>`;
  },
};

function eventCard(p) {
  const e = EVENTS_BY_ID[p.id];
  if (p.step === 'choose') {
    return `
      <h2 id="card-title">${esc(e.title)}</h2>
      <p class="speech">${esc(e.text)}</p>
      <div class="card-choices">
        ${e.choices.map((c, i) => `<button class="btn btn-block" data-action="eventChoose" data-index="${i}">${esc(c.text)}</button>`).join('')}
      </div>`;
  }
  return `
    <h2 id="card-title">${esc(e.title)}</h2>
    <p class="muted">你選了：${esc(e.choices[p.choice].text)}</p>
    ${p.text ? `<p class="speech">${esc(p.text)}</p>` : ''}
    ${changes(p.deltas, p.notes)}
    <button class="btn btn-block btn-primary" data-action="cardClose">好</button>`;
}

function noticeCard(p, state) {
  const n = NOTICES[p.id];
  const data = p.data ?? {};
  const lines = n.lines(data).filter(Boolean);
  const salary = p.salary && p.salary.to !== p.salary.from ? `<li>月薪 ${formatMoney(p.salary.from)} → ${formatMoney(p.salary.to)}</li>` : '';
  const actions = n.actions?.(data);
  const buttons = actions
    ? actions
        .map((a, i) => {
          const hint = actionHint(a.id, state);
          return `<button class="btn btn-block choice-btn${i === 0 ? ' btn-primary' : ''}" data-action="noticeAction" data-value="${a.id}">${a.label}${hint ? `<small>${hint}</small>` : ''}</button>`;
        })
        .join('')
    : '<button class="btn btn-block btn-primary" data-action="cardClose">好</button>';
  return `
    <h2 id="card-title">${n.title(p.data ?? {})}</h2>
    <div class="speech">${lines.map(l => `<p>${l}</p>`).join('')}</div>
    ${salary || p.deltas ? `<ul class="changes">${salary}${deltaItems(p.deltas).map(t => `<li>${t}</li>`).join('')}</ul>` : ''}
    ${buttons}`;
}

// 升遷抉擇的效果說明，照目前月薪與職級算
function actionHint(id, state) {
  if (id === 'acceptPromotion') {
    const salary = Math.round((state.job.salary * (1 + REVIEW.promotionRaise)) / REVIEW.salaryRound) * REVIEW.salaryRound;
    const now = workEffects(state).energy;
    const next = workEffects(state, state.job.level + 1).energy;
    return `月薪 ${formatMoney(state.job.salary)} → ${formatMoney(salary)}，但平日上班體力 ${formatSigned(now)} → ${formatSigned(next)}`;
  }
  if (id === 'declinePromotion') return `維持現職，心情 +${REVIEW.declineMood}；明年考核還能再升`;
  return '';
}

function changes(deltas, notes = []) {
  const items = [...deltaItems(deltas), ...notes.map(noteText)];
  return items.length ? `<ul class="changes">${items.map(t => `<li>${t}</li>`).join('')}</ul>` : '<p class="muted">沒有什麼變化。</p>';
}

export const actions = {
  ...review.actions,
  eventChoose: ({ index }, ctl) => ctl.chooseEvent(Number(index)),
  cardClose: (_, ctl) => ctl.closeCard(),
  noticeAction: ({ value }, ctl) => {
    if (value === 'restart') {
      if (confirm('確定要重新開始人生嗎？目前的存檔會被刪掉。')) ctl.restart();
      return;
    }
    ctl.noticeAction(value);
  },
};
