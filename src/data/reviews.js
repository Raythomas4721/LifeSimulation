// 檢討卡片的主管評語（DESIGN.md §5.4），由上往下挑第一個符合的
// r：這段期間的報告；perfPerWorkday 不加班時約 0.14，每週加班 2 格約 0.17
export const BOSS = '主管';

export const BOSS_COMMENTS = [
  { when: r => r.energyEnd < 20, text: '辛苦了，不過你臉色不太好，要注意身體。' },
  { when: r => r.moodEnd < 20, text: '最近好像悶悶不樂？有什麼事可以跟我說。' },
  { when: r => r.perfPerWorkday >= 0.165, text: '表現不錯喔，繼續保持！' },
  { when: r => r.perfPerWorkday >= 0.12, text: '穩穩的，很好。' },
  { when: () => true, text: '最近狀況好像不太好，要加油一點。' },
];
