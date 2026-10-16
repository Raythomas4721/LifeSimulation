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
    // levelStartDay：升上目前職級的那天，升遷年資從這天算（DESIGN.md §7.2）
    job: { level: 1, salary: START.salary, startDay: 0, levelStartDay: 0, performance: START.performance, reviews: [] },
    schedule: Array(7).fill('rest'),
    statuses: [], // 病假、住院、強制時段、延遲效果（DESIGN.md §14.3）
    health: { collapses: 0, sickDays: 0 }, // 當年度的病倒次數與病假天數，每年 1/1 歸零
    events: { last: {}, counts: {} }, // 每個事件上次出現的日子與次數
    stats: { workDays: 0, overtimeSlots: 0, collapses: 0, hospitalStays: 0 },
    flags: { tutorialDone: false, reviews: 0, milestones: {} },
    period: null,
    pending: null, // 等玩家回應的卡片；有值時時間暫停
    queue: [], // 排隊中的卡片
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
