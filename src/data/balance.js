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

export const DAILY = {
  work: { energy: -8, mood: -2, performance: 0.14 },
  rest: { energy: 12, mood: 4, performance: 0 },
  overtime: { energy: -12, mood: -4, performance: 0.08 },
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
};

export const PACING = {
  weeklyReviews: 4, // 前幾週每週日檢討，之後改成每月最後一天月結（§5.4）
  minMonthlyDays: 14, // 月結距離上次檢討太近就併到下個月
};

export const SAVE = {
  autosaveMs: 10_000,
};
