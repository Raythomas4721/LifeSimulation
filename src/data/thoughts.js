// 主角台詞（DESIGN.md §13.3）
// urgent 的優先，符合就只說這組；其他符合的台詞混在一起輪流說
// c：{ kind（work／sick／hospital）, season（spring／summer／autumn／winter）, overtimeHeavy, studying }
export const THOUGHTS = [
  { urgent: true, when: (s, c) => c.kind === 'hospital', lines: ['好想出院…', '醫院的飯好清淡…', '以後要好好照顧自己。'] },
  { urgent: true, when: (s, c) => c.kind === 'sick', lines: ['咳咳…', '好好休息吧…', '躺著追劇也不錯。'] },
  { urgent: true, when: s => s.vitals.energy < 20, lines: ['好想睡覺…', '眼皮好重…', '咖啡已經沒用了…'] },
  { urgent: true, when: s => s.vitals.mood < 20, lines: ['好想放假…', '什麼時候才有連假…', '不想上班…'] },
  { urgent: true, when: s => s.money < 0, lines: ['帳戶怎麼是負的…', '月底要吃泡麵了…'] },
  { when: (s, c) => c.overtimeHeavy, lines: ['最近好常加班…', '辦公室比家還熟了。', '加班費是用命換的。'] },
  { when: (s, c) => c.studying, lines: ['下班還要上課，好累…', '學費不能白繳！', '作業寫完了嗎…'] },
  { when: s => s.fitness >= 40, lines: ['最近有運動，精神好多了。', '爬樓梯不會喘了！'] },
  { when: s => s.skills.professional >= 30, lines: ['這種事我已經很熟了。'] },
  { when: (s, c) => c.season === 'spring', lines: ['春天了，好想去賞花。', '梅雨季要來了…'] },
  { when: (s, c) => c.season === 'summer', lines: ['好熱…冷氣開強一點。', '想去海邊。'] },
  { when: (s, c) => c.season === 'autumn', lines: ['天氣變涼了，好舒服。', '快到年底了…'] },
  { when: (s, c) => c.season === 'winter', lines: ['好冷，不想離開被窩。', '想吃薑母鴨。'] },
  { when: s => s.vitals.mood >= 80, lines: ['今天狀態不錯！', '上班好像也沒那麼糟。'] },
  { when: () => true, lines: ['今天也要加油。', '午餐吃什麼好呢？', '好想下班…', '再撐一下就週末了。'] },
];
