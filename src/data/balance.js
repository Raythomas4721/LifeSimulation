// 所有數值平衡常數（DESIGN.md §5、§6.2、§11）。調整後先跑 node tools/simulate.js

export const TIME = {
  msPerDay: 10_000,
  speeds: [0, 1, 2, 4],
  debugSpeed: 100,
};

export const START = {
  date: [2026, 7, 1], // 年、月、日；當天滿 22 歲並到職
  age: 22,
  money: 30_000,
  salary: 32_000,
  energy: 100,
  energyMax: 100,
  mood: 70,
  performance: 35,
};

// 體力主要靠每晚睡覺恢復；晚上休息只多補一點，主要是心情
export const DAILY = {
  work: { energy: -8, mood: -2, performance: 0.14 },
  sleep: { energy: 8, mood: 0, performance: 0 }, // 每天都有，含週末與請假
  rest: { energy: 4, mood: 4, performance: 0 },
  overtime: { energy: -16, mood: -6, performance: 0.08 },
  weekendMultiplier: 2,
};

export const THRESHOLDS = {
  low: 20, // 體力或心情低於此值，工作表現累積減半
  lowPenalty: 0.5,
  happy: 80,
};

export const FINANCE = {
  daysPerMonth: 30, // 日薪 = 月薪 ÷ 30
  livingCost: 18_000,
  overtimePayRate: { weekday: 0.5, weekend: 1.0 },
  debtAnnualRate: 0.15,
};

export const REVIEW = {
  grades: [
    { grade: 'A', min: 80 },
    { grade: 'B', min: 60 },
    { grade: 'C', min: 40 },
    { grade: 'D', min: 0 },
  ],
  raise: { A: [0.05, 0.08], B: [0.02, 0.04], C: [0, 0], D: [0, 0] },
  carryOver: 0.5, // 考核後工作表現保留的比例
  trialMonths: 12, // 到職未滿這麼久的考核固定為 B、不升遷
  trialGrade: 'B',
  promotionRaise: 0.1, // 接受升遷時月薪另外調升（DESIGN.md §7.2）
  levelWorkEnergy: -1, // 每高一個職級，平日上班多扣的體力（升遷的代價）
  declineMood: 5, // 婉拒升遷時心情回升
  salaryRound: 100,
};

export const BONUS = {
  months: { A: 2, B: 1.5, C: 1, D: 0.5 }, // 1/20 依當年 1/1 的考核發放（§7.4）
};

export const EVENTS = {
  dailyChance: 1 / 14, // 平均每 2 週約 1 個事件（§10.2）
  cooldownDays: 180,
  weight: 10,
};

export const HEALTH = {
  minorMedical: 500,
  collapseLeaveDays: 7,
  collapseMedical: 3_000,
  collapseMood: -15,
  collapseRestoreEnergy: 60, // 病倒請假結束時體力至少回到這裡
  hospitalAfter: 3, // 同一年病倒幾次就住院
  hospitalDays: 14,
  hospitalMedical: 25_000,
  hospitalPerformance: -20,
  hospitalMood: -20,
  sickPayDays: 30, // 每年前幾天病假半薪，之後無薪
  sickPayRate: 0.5,
};

export const PACING = {
  weeklyReviews: 4, // 前幾週每週日檢討，之後改成每月最後一天月結（§5.4）
  minMonthlyDays: 14, // 月結距離上次檢討太近就併到下個月
};

export const SAVE = {
  autosaveMs: 10_000,
};
