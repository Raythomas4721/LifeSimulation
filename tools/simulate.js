// 平衡模擬（DESIGN.md §14.7）：node tools/simulate.js [年數] [種子]
// 卡片一律照預設選項處理（事件選 default、檢討選照舊、出院選繼續、升遷照策略接受或婉拒）
import { createState } from '../src/core/state.js';
import { advanceDay } from '../src/core/advance.js';
import { createRng } from '../src/core/rng.js';
import { calendarOf } from '../src/core/calendar.js';
import { autoResolve } from '../src/systems/auto.js';
import { enrollCourse } from '../src/systems/study.js';
import { LADDER } from '../src/data/jobs.js';
import { EVENT_LIST } from '../src/data/events.js';

const YEARS = Number(process.argv[2] ?? 10);
const SEED = Number(process.argv[3] ?? 12345);

// overtime／exercise：哪幾格加班、運動（0 = 週一）
// study：管理不夠升下一級時報名主管培訓班，上課期間把這幾格改成進修
const STRATEGIES = [
  { name: '不加班', overtime: [] },
  { name: '不加班＋上課', overtime: [], study: [1, 3] },
  { name: '加班 2 格', overtime: [1, 3] },
  { name: '加班 2 格＋上課', overtime: [1, 3], study: [0, 2] },
  { name: '加班 2 格＋上課＋運動', overtime: [1, 3], study: [0, 2], exercise: [5] },
  { name: '加班 2 格＋上課、婉拒升遷', overtime: [1, 3], study: [0, 2], promotion: 'decline' },
  { name: '加班 3 格＋上課', overtime: [0, 2, 4], study: [1, 3] },
  { name: '加班 4 格＋上課', overtime: [0, 1, 2, 3], study: [4, 5] },
];
const EVENT_SAMPLE = 3; // 列出事件次數的策略

function scheduleFor(state, { overtime, study = [], exercise = [] }) {
  const s = Array(7).fill('rest');
  overtime.forEach(i => (s[i] = 'overtime'));
  exercise.forEach(i => (s[i] = 'exercise'));
  if (state.study.course) study.forEach(i => (s[i] = 'study'));
  return s;
}

function planStudy(state) {
  if (state.study.course) return;
  const next = LADDER.find(l => l.level === state.job.level + 1);
  if (state.skills.management < (next?.skills?.management ?? 0)) enrollCourse(state, 'leadership');
}

function simulate(strategy) {
  const { promotion = 'accept' } = strategy;
  const state = createState('模擬');
  const rng = createRng(SEED);
  // 檢討卡片選「照舊」，所以由策略每天重新排行程（上課期間才排進修）
  const endYear = calendarOf(0).year + YEARS;
  while (calendarOf(state.day).year < endYear || calendarOf(state.day).month < 2) {
    if (strategy.study) planStudy(state);
    state.schedule = scheduleFor(state, strategy);
    advanceDay(state, rng);
    while (state.pending) autoResolve(state, rng, { promotion });
  }
  const title = LADDER.find(l => l.level === state.job.level).title;
  return {
    state,
    row: {
      考核: state.job.reviews.map(r => r.grade).join(''),
      職位: title,
      月薪: state.job.salary.toLocaleString('zh-TW'),
      存款: state.money.toLocaleString('zh-TW'),
      病倒: state.stats.collapses,
      住院: state.stats.hospitalStays,
      管理: Math.floor(state.skills.management),
      專業: Math.floor(state.skills.professional),
      體能: Math.floor(state.fitness),
      上課: Object.values(state.study.done).reduce((a, b) => a + b, 0),
    },
  };
}

const results = STRATEGIES.map(s => ({ name: s.name, ...simulate(s) }));
console.log(`模擬 ${YEARS} 年（到 ${calendarOf(0).year + YEARS} 年 1 月底），種子 ${SEED}；卡片照預設選項處理\n`);
console.table(Object.fromEntries(results.map(r => [r.name, r.row])));

// 事件出現次數，用來檢查有沒有事件太常或從來沒出現
const sample = results[EVENT_SAMPLE];
console.log(`\n事件出現次數（${sample.name}）：`);
console.log(EVENT_LIST.map(e => `${e.title} ${sample.state.events.counts[e.id] ?? 0}`).join('、'));
