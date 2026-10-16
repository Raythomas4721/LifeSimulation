// 里程碑（DESIGN.md §13.3），每個只會達成一次
export const MILESTONES = [
  { id: 'first_overtime', when: s => s.stats.overtimeSlots >= 1, text: '第一次加班，領到加班費了！' },
  { id: 'one_month', when: s => s.day >= 30, text: '上班滿一個月了！' },
  { id: 'money_100k', when: s => s.money >= 100_000, text: '存款破十萬了！' },
  { id: 'money_500k', when: s => s.money >= 500_000, text: '存款破五十萬了！' },
  { id: 'one_year', when: s => s.day >= 365, text: '上班滿一年了！' },
  { id: 'money_1m', when: s => s.money >= 1_000_000, text: '存款破百萬了！' },
];
