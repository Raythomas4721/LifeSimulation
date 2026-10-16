// 平衡模擬（DESIGN.md §14.7）：node tools/simulate.js [年數] [種子]
import { createState } from '../src/core/state.js';
import { advanceDay } from '../src/core/advance.js';
import { createRng } from '../src/core/rng.js';
import { gradeFor } from '../src/systems/work.js';

const YEARS = Number(process.argv[2] ?? 5);
const SEED = Number(process.argv[3] ?? 12345);
const DAYS_PER_YEAR = 365;

// overtime：哪幾個平日晚上加班（0 = 週一）
const STRATEGIES = [
  { name: '不加班', overtime: [] },
  { name: '每週加班 2 格', overtime: [0, 2] },
  { name: '每週加班 3 格', overtime: [0, 2, 4] },
  { name: '每週加班 4 格', overtime: [0, 1, 2, 3] },
];

function simulate({ overtime }) {
  const state = createState('模擬');
  const rng = createRng(SEED);
  overtime.forEach(i => (state.schedule[i] = 'overtime'));

  let firstLowEnergyDay = null;
  let firstZeroEnergyDay = null;
  let perfGained = 0;
  let energySum = 0;
  let minMood = state.vitals.mood;

  for (let d = 0; d < YEARS * DAYS_PER_YEAR; d++) {
    // 年度考核要到 M2 才有；每天把表現放在中間值，量出未被上限截斷的累積量
    state.job.performance = 50;
    advanceDay(state, rng);
    perfGained += state.job.performance - 50;

    const { energy, mood } = state.vitals;
    energySum += energy;
    minMood = Math.min(minMood, mood);
    if (firstLowEnergyDay == null && energy < 20) firstLowEnergyDay = d;
    if (firstZeroEnergyDay == null && energy === 0) firstZeroEnergyDay = d;
  }

  const perYear = perfGained / YEARS;
  const steady = Math.min(100, perYear * 2); // 考核後保留 50%，穩定值 ≈ 每年累積量 × 2
  const week = d => (d == null ? '不會' : `第 ${Math.floor(d / 7) + 1} 週`);
  return {
    每年累積表現: perYear.toFixed(1),
    預估穩定值: `${steady.toFixed(0)}（${gradeFor(steady)}）`,
    體力低於20: week(firstLowEnergyDay),
    體力歸零: week(firstZeroEnergyDay),
    平均體力: Math.round(energySum / (YEARS * DAYS_PER_YEAR)),
    最低心情: minMood,
    [`第${YEARS}年底存款`]: state.money.toLocaleString('zh-TW'),
  };
}

console.log(`模擬 ${YEARS} 年，種子 ${SEED}（尚無考核加薪、事件、傷病）\n`);
console.table(Object.fromEntries(STRATEGIES.map(s => [s.name, simulate(s)])));
