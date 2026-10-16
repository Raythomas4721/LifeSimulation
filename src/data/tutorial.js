// 人資帶你過第一天（DESIGN.md §13.2）
// target 對應畫面上的 data-tour；有 waitFor 的步驟要等玩家做那個動作才往下走
export const TUTOR = '人資小林';

export const TUTORIAL = [
  {
    target: 'money',
    text: '歡迎加入！我是人資小林。這是你的存款，每天都會領到日薪，數字會一直往上跳。每月 1 日要繳房租和生活費。',
    next: '好',
  },
  {
    target: 'clock',
    text: '這條是今天的時間軸，看得出現在幾點、你在做什麼：早上通勤、白天上班，晚上 6 點以後就是你自己的時間。',
    next: '好',
  },
  {
    target: 'vitals',
    text: '上班會消耗體力和心情。體力或心情太低的時候，工作表現會變差，要記得照顧自己。',
    next: '了解',
  },
  {
    target: 'tonight',
    text: '第一天下班了！今晚要做什麼？加班有加班費、表現更好，但會更累。',
    waitFor: 'tonight',
  },
  {
    target: 'week',
    text: '你的選擇會記在每週行程裡，之後每週都照這樣過，點一下就能切換。每週日晚上我會來問你這週過得如何。右上角可以暫停或加速。',
    next: '開始上班',
  },
];
