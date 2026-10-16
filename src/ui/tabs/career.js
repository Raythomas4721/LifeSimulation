import { LADDER } from '../../data/jobs.js';
import { gradeFor } from '../../systems/work.js';
import { formatMoney, formatNumber } from '../format.js';
import { jobTitle, tenure, totalYears } from '../text.js';

export function render() {
  return `
    <section class="card">
      <h2>目前職位</h2>
      <dl class="kv">
        <dt>職位</dt><dd data-bind="jobTitle"></dd>
        <dt>月薪</dt><dd data-bind="salary"></dd>
        <dt>本職年資</dt><dd data-bind="tenure"></dd>
        <dt>總年資</dt><dd data-bind="totalYears"></dd>
        <dt>加班累計</dt><dd data-bind="overtime"></dd>
      </dl>
    </section>
    <section class="card">
      <h2>工作表現</h2>
      <div class="meter"><div class="bar bar-perf"><i data-bar="performancePct"></i></div><b class="meter-value" data-bind="performance"></b></div>
      <p data-bind="gradeHint"></p>
      <p class="muted">每年 1/1 依工作表現考核：A ≥ 80、B ≥ 60、C ≥ 40，其餘為 D。</p>
    </section>
    <section class="card">
      <h2>職位階梯</h2>
      <ol class="ladder" data-block="ladder"></ol>
    </section>`;
}

export const binds = {
  jobTitle: ({ state }) => jobTitle(state),
  salary: ({ state }) => formatMoney(state.job.salary),
  tenure: ({ state }) => tenure(state),
  totalYears: ({ state }) => totalYears(state),
  overtime: ({ state }) => `${formatNumber(state.stats.overtimeSlots)} 個時段`,
  performance: ({ state }) => Math.floor(state.job.performance),
  performancePct: ({ state }) => state.job.performance,
  gradeHint: ({ state }) => `照目前的表現，考核約落在 ${gradeFor(state.job.performance)}。`,
};

export const blocks = {
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
  return `本職年資 ${l.years} 年、考核達 ${l.grade}`;
}
