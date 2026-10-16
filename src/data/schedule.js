// 每週行程的時段活動（DESIGN.md §5.2）；效果數值在 balance.js 的 DAILY
export const SLOT_ACTIVITIES = [
  { id: 'rest', label: '休息', emoji: '🛋️' },
  { id: 'overtime', label: '加班', emoji: '💻' },
  { id: 'slack', label: '耍廢', emoji: '🎮' },
  { id: 'study', label: '進修', emoji: '📚' },
  { id: 'exercise', label: '運動', emoji: '🏃' },
];

// 索引 0～6 對應週一到週日
export const SLOT_SHORT = ['一', '二', '三', '四', '五', '六', '日'];

const R = 'rest';
const O = 'overtime';
const S = 'study';

// 一鍵行程（§5.2、§5.4）；沒有 schedule 的是「照舊」
export const SCHEDULE_PRESETS = [
  { id: 'keep', label: '照舊' },
  { id: 'rest', label: '全部休息', schedule: [R, R, R, R, R, R, R] },
  { id: 'ot2', label: '加班 2 天', schedule: [R, O, R, O, R, R, R] },
  { id: 'ot4', label: '拼一點：4 天', schedule: [O, O, O, O, R, R, R] },
];

// 有報名課程時多一個「上課」：照課程每週要的格數排進修，其餘休息
export const STUDY_PRESETS = {
  1: [R, R, S, R, R, R, R],
  2: [R, S, R, S, R, R, R],
  3: [S, R, S, R, S, R, R],
};
