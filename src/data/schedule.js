// 每週行程的時段活動（DESIGN.md §5.2）；效果數值在 balance.js 的 DAILY
export const SLOT_ACTIVITIES = [
  { id: 'rest', label: '休息', emoji: '🛋️' },
  { id: 'overtime', label: '加班', emoji: '💻' },
];

// 索引 0～6 對應週一到週日
export const SLOT_SHORT = ['一', '二', '三', '四', '五', '六', '日'];

const R = 'rest';
const O = 'overtime';

// 檢討卡片的一鍵行程（§5.4）；沒有 schedule 的是「照舊」
export const SCHEDULE_PRESETS = [
  { id: 'keep', label: '照舊' },
  { id: 'rest', label: '全部休息', schedule: [R, R, R, R, R, R, R] },
  { id: 'ot2', label: '加班 2 天', schedule: [R, O, R, O, R, R, R] },
  { id: 'ot4', label: '拼一點：4 天', schedule: [O, O, O, O, R, R, R] },
];
