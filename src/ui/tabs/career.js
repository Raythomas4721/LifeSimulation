import { LADDER } from '../../data/jobs.js';
import { CAST } from '../../data/cast.js';
import { CERTS, COURSES, COURSES_BY_ID } from '../../data/courses.js';
import { SKILL_LABELS, SKILL_LIST } from '../../data/skills.js';
import { FITNESS } from '../../data/balance.js';
import { monthsBetween } from '../../core/calendar.js';
import { gradeFor } from '../../systems/work.js';
import { enrollBlocker, requiredAttendance } from '../../systems/study.js';
import { formatDate, formatMoney, formatMonths, formatNumber } from '../format.js';
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
      <h2>技能與體能</h2>
      <ul class="skills" data-block="skills"></ul>
      <p data-block="certs"></p>
    </section>
    <section class="card">
      <h2>進修</h2>
      <div data-block="course"></div>
      <ul class="courses" data-block="courses"></ul>
      <p class="muted">報名時付清學費，之後每週要在行程排進修。出席率到 70% 才能結業，學費不退。</p>
    </section>
    <section class="card">
      <h2>考核紀錄</h2>
      <ul class="log" data-block="reviews"></ul>
    </section>
    <section class="card">
      <h2>身邊的人</h2>
      <ul class="cast-list">
        ${CAST.map(c => `<li><span class="cast-emoji" aria-hidden="true">${c.emoji}</span><span><b>${c.name}</b><small>${c.role}</small><br>${c.desc}</span></li>`).join('')}
      </ul>
      <p class="muted">v0.4 起會有好感度，能交朋友、請他們內推。</p>
    </section>
    <section class="card">
      <h2>職位階梯</h2>
      <ol class="ladder" data-block="ladder"></ol>
      <p class="muted">升遷年資從升上目前職級那天算起。升上主任後，每年考核時管理 +3。</p>
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

const skillRow = (label, value, use) => `
  <li>
    <div class="meter"><span class="meter-label">${label}</span><div class="bar bar-perf"><i style="width:${Math.min(100, value)}%"></i></div><b class="meter-value">${Math.floor(value)}</b></div>
    <small class="muted">${use}</small>
  </li>`;

export const blocks = {
  skills: ({ state }) =>
    SKILL_LIST.map(s => skillRow(s.label, state.skills[s.id], s.use)).join('') +
    skillRow('體能', state.fitness, `靠運動累積、不運動會慢慢下降；體力上限 ${state.vitals.energyMax}，每晚睡覺多恢復 ${(state.fitness * FITNESS.sleepPerPoint).toFixed(1)}`),

  certs: ({ state }) => {
    const owned = Object.entries(state.study.certs);
    if (!owned.length) return '<span class="muted">證照：還沒有。多益、PMP 課程結束後可以考。</span>';
    return `證照：${owned.map(([id, day]) => `${CERTS[id].emoji} ${CERTS[id].title}（${formatDate(day, { weekday: false })}）`).join('、')}`;
  },

  course: ({ state }) => {
    const c = state.study.course;
    if (!c) return '<p class="muted">目前沒有上課。沒報名時，行程裡的進修會變成自學，專業慢慢提升。</p>';
    const course = COURSES_BY_ID[c.id];
    const required = requiredAttendance(course);
    return `
      <div class="course-now">
        <p><b>${course.emoji} ${course.title}</b>：出席 ${c.attended} / ${required}（要 ${Math.ceil(required * 0.7)} 次才能結業），${formatDate(c.endDay - 1, { weekday: false })} 結業</p>
        <button class="btn btn-block btn-danger" data-action="courseDrop">退課（學費不退）</button>
      </div>`;
  },

  courses: ({ state }) =>
    COURSES.map(c => {
      const blocker = enrollBlocker(state, c.id);
      const done = state.study.done[c.id] ? `・已結業 ${state.study.done[c.id]} 次` : '';
      const gain = Object.entries(c.gain).map(([id, n]) => `${SKILL_LABELS[id]} +${n}`).join('、');
      return `
        <li>
          <p><b>${c.emoji} ${c.title}</b>　${gain}</p>
          <p class="muted">${c.desc}</p>
          <p class="muted">約 ${courseLength(c.weeks)}・每週 ${c.slots} 格・學費 ${formatMoney(c.cost)}${done}</p>
          ${c.exam ? `<p class="muted">結束後考試，考過拿到${CERTS[c.exam.cert].emoji} ${CERTS[c.exam.cert].title}和獎金 ${formatMoney(c.exam.bonus)}；${SKILL_LABELS[c.exam.skill]}越高越容易過</p>` : ''}${c.minLevel ? '<p class="muted">資深專員以上才能報名</p>' : ''}
          <button class="btn btn-block" data-action="courseEnroll" data-value="${c.id}"${blocker ? ' disabled' : ''}>${blocker ?? '報名'}</button>
        </li>`;
    }).join(''),

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

// 只列出目前版本有效的條件（人脈條件 v0.4 才開放）
function requirement(l) {
  if (l.level === 1) return '起始職位';
  const skills = Object.entries(l.skills ?? {}).map(([id, n]) => `${SKILL_LABELS[id]} ≥ ${n}`);
  const base = l.consecutiveA ? [`考核連 ${l.consecutiveA} 年 A`] : [`前一職級待 ${l.years} 年`, `考核達 ${l.grade}`];
  return [...base, ...skills].join('、');
}

const courseLength = weeks => (weeks >= 52 ? `${Math.round(weeks / 52)} 年` : `${Math.round(weeks / 4.3)} 個月`);

export const actions = {
  courseEnroll: ({ value }, ctl) => {
    const c = COURSES_BY_ID[value];
    if (confirm(`報名「${c.title}」，學費 ${formatMoney(c.cost)}？之後每週要排 ${c.slots} 格進修。`)) ctl.enrollCourse(value);
  },
  courseDrop: (_, ctl) => {
    if (confirm('確定要退課嗎？學費不會退，也不會有任何效果。')) ctl.dropCourse();
  },
};
