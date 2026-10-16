// 一天的時段（DESIGN.md §13.4）：只影響畫面上的時鐘、時間軸與場景，結算仍是一天一次
// 一天從 06:00 起算到隔天 06:00；from 是幾點開始，24 以上代表隔天凌晨
export const DAY_START_HOUR = 6;

// kind 為 'slot' 的時段依當天行程顯示休息或加班
export const WEEKDAY_PARTS = [
  { from: 6, kind: 'commute', label: '起床通勤', short: '通勤', place: '🚇' },
  { from: 9, kind: 'work', label: '上班中', short: '上班', place: '🏢' },
  { from: 18, kind: 'slot' },
  { from: 23, kind: 'sleep', label: '睡覺中', short: '💤', place: '🛏️' },
];

export const WEEKEND_PARTS = [
  { from: 6, kind: 'sleep', label: '睡到自然醒', short: '💤', place: '🛏️' },
  { from: 10, kind: 'slot' },
  { from: 23, kind: 'sleep', label: '睡覺中', short: '💤', place: '🛏️' },
];

export const SLOT_PARTS = {
  rest: { weekday: '下班在家休息', weekend: '週末在家休息', short: '休息', place: '🛋️' },
  overtime: { weekday: '加班中', weekend: '週末加班中', short: '加班', place: '💻' },
};

// 天色：依幾點決定場景背景與時鐘圖示
export const SKY = [
  { from: 5, sky: 'dawn', icon: '🌅' },
  { from: 7, sky: 'day', icon: '☀️' },
  { from: 17, sky: 'dusk', icon: '🌇' },
  { from: 19, sky: 'night', icon: '🌙' },
];
