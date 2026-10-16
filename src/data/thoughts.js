// 主角台詞（DESIGN.md §13.3）
// urgent 的優先，符合就只說這組；其他符合的台詞混在一起輪流說
// c：{ kind（目前時段：commute／work／slot／sleep）, weekend, overtimeNow }
export const THOUGHTS = [
  { urgent: true, when: (s, c) => c.kind === 'sleep', lines: ['Zzz…', 'Zzz…呼…'] },
  { urgent: true, when: s => s.vitals.energy < 20, lines: ['今晚想早點睡…', '眼皮好重…', '咖啡已經沒用了…'] },
  { urgent: true, when: s => s.vitals.mood < 20, lines: ['好想放假…', '什麼時候才有連假…', '不想上班…'] },
  { urgent: true, when: s => s.money < 0, lines: ['帳戶怎麼是負的…', '月底要吃泡麵了…'] },
  { when: (s, c) => c.kind === 'commute', lines: ['捷運好擠…', '早餐吃蛋餅好了。', '又是新的一天。'] },
  { when: (s, c) => c.overtimeNow, lines: ['加班中…肚子好餓。', '辦公室只剩我了。', '再一下就好…'] },
  { when: (s, c) => c.kind === 'slot' && !c.overtimeNow, lines: c => (c.weekend ? ['週末真好～', '今天要好好放鬆。'] : ['下班了！', '追劇時間～', '今天辛苦了。']) },
  { when: s => s.vitals.mood >= 80, lines: ['今天狀態不錯！', '上班好像也沒那麼糟。'] },
  { when: (s, c) => c.kind === 'work', lines: ['今天也要加油。', '午餐吃什麼好呢？', '好想下班…', '再撐一下就週末了。'] },
];
