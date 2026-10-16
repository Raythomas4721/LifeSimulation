import { LADDER } from '../../data/jobs.js';
import { monthsBetween } from '../../core/calendar.js';
import { gradeFor } from '../../systems/work.js';
import { formatMoney, formatMonths, formatNumber } from '../format.js';
import { jobTitle, tenure, totalYears } from '../text.js';

export function render() {
  return `
    <section class="card">
      <h2>目前職位</h2>
      <dl class="kv">
        <dt>職位</dt><dd data-bind="jobTitle"></dd>
        <dt>月薪</dt><dd data-bind="salary"></dd>
        <dt>本職年資</dt><dd data-bind="tenure"></dd>
        <dt>目前職級待了</dt><dd data-bind="levelTenure"></dd>
        <dt>總年資</dt><dd data-bind="totalYears"></dd>
        <dt>加班累計</dt><dd data-bind="overtime"></dd>
        <dt>今年病倒</dt><dd data-bind="collapses"></dd>
      </dl>
    </section>
    <section class="card">
      <h2>工作表現</h2>
      <div class="meter"><div class="bar bar-perf"><i data-bar="performancePct"></i></div><b class="meter-value" data-bind="performance"></b></div>
      <p data-bind="gradeHint"></p>
      <p class="muted">每年 1/1 依工作表現考核：A ≥ 80、B ≥ 60、C ≥ 40，其餘為 D。考核後表現打五折，重新累積。</p>
    </section>
    <section class="card">
      <h2>考核紀錄</h2>
      <ul class="log" data-block="reviews"></ul>
    </section>
    <section class="card">
      <h2>職位階梯</h2>
      <ol class="ladder" data-block="ladder"></ol>
      <p class="muted">升遷年資從升上目前職級那天算起。</p>
    </section>`;
}

export const binds = {
  jobTitle: ({ state }) => jobTitle(state),
  salary: ({ state }) => formatMoney(state.job.salary),
  tenure: ({ state }) => tenure(state),
  levelTenure: ({ state }) => formatMonths(monthsBetween(state.job.levelStartDay, state.day)),
  totalYears: ({ state }) => totalYears(state),
  overtime: ({ state }) => `${formatNumber(state.stats.overtimeSlots)} 個時段`,
  collapses: ({ state }) => `${state.health.collapses} 次（3 次會住院）`,
  performance: ({ state }) => Math.floor(state.job.performance),
  performancePct: ({ state }) => state.job.performance,
  gradeHint: ({ state }) => `照目前的表現，考核約落在 ${gradeFor(state.job.performance)}。`,
};

export const blocks = {
  reviews: ({ state }) =>
    state.job.reviews.length
      ? [...state.job.reviews]
          .reverse()
          .slice(0, 6)
          .map(r => `<li>${r.year} 年：<b>${r.grade}</b>${r.trial ? '（試用期）' : ''}</li>`)
          .join('')
      : '<li class="muted">還沒有考核紀錄，第一次考核在明年 1/1。</li>',

  ladder: ({ state }) =>
    LADDER.map(l => {
      const cls = l.level === state.job.level ? 'is-current' : l.level < state.job.level ? 'is-done' : '';
      return `<li class="${cls}"><b>${l.title}</b><span class="muted">${requirement(l)}</span></li>`;
    }).join(''),
};

// 只列出目前版本有效的條件（技能、人脈條件尚未開放）
function requirement(l) {
  if (l.level === 1) return '起始職位';
  if (l.consecutiveA) return `考核連 ${l.consecutiveA} 年 A`;
  return `前一職級待 ${l.years} 年、考核達 ${l.grade}`;
}
