// 平衡模擬（DESIGN.md §14.7）：node tools/simulate.js [年數] [種子]
// 卡片一律照預設選項處理（事件選 default、檢討選照舊、出院選繼續、升遷照策略接受或婉拒）
import { createState } from '../src/core/state.js';
import { advanceDay } from '../src/core/advance.js';
import { createRng } from '../src/core/rng.js';
import { calendarOf } from '../src/core/calendar.js';
import { autoResolve } from '../src/systems/auto.js';
import { LADDER } from '../src/data/jobs.js';
import { EVENT_LIST } from '../src/data/events.js';

const YEARS = Number(process.argv[2] ?? 10);
const SEED = Number(process.argv[3] ?? 12345);

// overtime：哪幾個平日晚上加班（0 = 週一）
const STRATEGIES = [
  { name: '不加班', overtime: [] },
  { name: '加班 2 格', overtime: [1, 3] },
  { name: '加班 2 格、婉拒升遷', overtime: [1, 3], promotion: 'decline' },
  { name: '加班 3 格', overtime: [0, 2, 4] },
  { name: '加班 4 格', overtime: [0, 1, 2, 3] },
];

function simulate({ overtime, promotion = 'accept' }) {
  const state = createState('模擬');
  const rng = createRng(SEED);
  overtime.forEach(i => (state.schedule[i] = 'overtime'));
  // 檢討卡片「照舊」不會改行程，所以策略會一直維持
  const endYear = calendarOf(0).year + YEARS;
  while (calendarOf(state.day).year < endYear || calendarOf(state.day).month < 2) {
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
      事件數: Object.values(state.events.counts).reduce((a, b) => a + b, 0),
    },
  };
}

const results = STRATEGIES.map(s => ({ name: s.name, ...simulate(s) }));
console.log(`模擬 ${YEARS} 年（到 ${calendarOf(0).year + YEARS} 年 1 月底），種子 ${SEED}；卡片照預設選項處理\n`);
console.table(Object.fromEntries(results.map(r => [r.name, r.row])));

// 事件出現次數（以「加班 2 格」為例），用來檢查有沒有事件太常或從來沒出現
const counts = results[1].state.events.counts;
console.log('\n事件出現次數（加班 2 格）：');
console.log(EVENT_LIST.map(e => `${e.title} ${counts[e.id] ?? 0}`).join('、'));
