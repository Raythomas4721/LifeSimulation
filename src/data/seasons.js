// 季節（DESIGN.md §13.4）：一天只有 0.4 秒，畫面改用季節表現時間流動
export const SEASONS = [
  { id: 'spring', label: '春', icon: '🌸', months: [3, 4, 5] },
  { id: 'summer', label: '夏', icon: '☀️', months: [6, 7, 8] },
  { id: 'autumn', label: '秋', icon: '🍂', months: [9, 10, 11] },
  { id: 'winter', label: '冬', icon: '❄️', months: [12, 1, 2] },
];

export const seasonOf = month => SEASONS.find(s => s.months.includes(month));
