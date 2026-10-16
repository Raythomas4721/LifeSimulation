// 年度回顧的卡片內容（DESIGN.md §5.4），外框由 cards.js 負責
import { BOSS, BOSS_COMMENTS } from '../data/reviews.js';
import { schedulePresets } from './text.js';
import { formatDate, formatMoney, formatSigned } from './format.js';

export function reviewCard(p, state) {
  const r = p.report;
  // 舊存檔裡可能還留著週檢討或月結的卡片
  const title = p.type === 'yearly' ? `${p.year} 年度回顧` : p.type === 'weekly' ? `第 ${p.number} 週結束了` : `${p.month} 月結束了`;
  const comment = BOSS_COMMENTS.find(c => c.when(r)).text;
  const range = `${formatDate(r.startDay, { weekday: false })} ～ ${formatDate(r.endDay, { weekday: false })}`;
  return `
        <h2 id="card-title">📋 ${title}</h2>
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
          ${r.events != null ? `<dt>遇到的事</dt><dd>${r.events} 件</dd>` : ''}
          ${r.collapses ? `<dt>病倒</dt><dd>${r.collapses} 次</dd>` : ''}
          ${r.sickDays ? `<dt>病假</dt><dd>${r.sickDays} 天</dd>` : ''}
        </dl>
        <p class="speech"><b>${BOSS}：</b>「${comment}」</p>
        <h3>明年的每週行程</h3>
        ${presets(state)}`;
}

// 活動有 5 種，逐格調整改到「今天」分頁的時段選單做（§5.4）
function presets(state) {
  return `
    <div class="preset-grid">
      ${schedulePresets(state).map(p => `<button class="btn${p.id === 'keep' ? ' btn-primary' : ''}" data-action="reviewPreset" data-value="${p.id}">${p.label}</button>`).join('')}
    </div>
    <p class="muted">想一天一天調整，關掉後在「今天」分頁點時段就能改。</p>`;
}

export const actions = {
  reviewPreset: ({ value }, ctl) => ctl.resolveReviewPreset(value),
};
