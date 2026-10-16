// 人資帶你過第一天（DESIGN.md §13.2）
// target 對應畫面上的 data-tour；有 waitFor 的步驟要等玩家做那個動作才往下走
export const TUTOR = '人資小林';

export const TUTORIAL = [
  {
    target: 'money',
    text: '歡迎加入！我是人資小林。這是你的存款，薪水每天都會進帳，數字會一直往上跳。每月 1 日要繳房租和生活費。',
    next: '好',
  },
  {
    target: 'year',
    text: '時間過得很快，一年大約兩分半鐘。這條是今年的進度，旁邊會提醒你下一件大事。',
    next: '好',
  },
  {
    target: 'vitals',
    text: '上班會消耗體力和心情。體力或心情太低的時候，工作表現會變差，要記得照顧自己。',
    next: '了解',
  },
  {
    target: 'week',
    text: '下班後的時間你決定！選一個每週行程，或點方塊一天一天調整。加班有加班費、表現更好，但會更累。',
    waitFor: 'schedule',
  },
  {
    target: 'year',
    text: '行程會每週自動套用。每年年底我會來跟你回顧這一年，順便調整明年的行程。右上角可以暫停或加速，祝你上班愉快！',
    next: '開始上班',
  },
];
