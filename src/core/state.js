// 遊戲狀態的結構與初始值；存檔就是存這個物件
import { START } from '../data/balance.js';
import { startPeriod } from '../systems/review.js';

const LOG_LIMIT = 30;

export function createState(name) {
  const state = {
    player: { name },
    day: 0,
    money: START.money,
    vitals: { energy: START.energy, energyMax: START.energyMax, mood: START.mood },
    job: { level: 1, salary: START.salary, startDay: 0, performance: START.performance },
    schedule: Array(7).fill('rest'),
    statuses: [], // 病假、住院、強制時段等持續狀態（DESIGN.md §14.3），M2 起使用
    stats: { workDays: 0, overtimeSlots: 0 },
    flags: { tutorialDone: false, reviews: 0, milestones: {} },
    period: null,
    pending: null, // 等玩家回應的檢討卡片；有值時時間暫停
    log: [],
    settings: { speed: 1, lastSpeed: 1 },
  };
  startPeriod(state);
  addLog(state, { kind: 'start' });
  return state;
}

// 紀錄存成結構化資料，文字由畫面決定
export function addLog(state, entry) {
  state.log.unshift({ day: state.day, ...entry });
  if (state.log.length > LOG_LIMIT) state.log.length = LOG_LIMIT;
}
