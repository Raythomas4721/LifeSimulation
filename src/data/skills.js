// 技能（DESIGN.md §6）：v0.2 先開放 4 項，溝通在 v0.4 和人際一起加入
export const SKILL_LIST = [
  { id: 'professional', label: '專業', use: '上班和自學會慢慢累積；越高，工作表現累積越快' },
  { id: 'management', label: '管理', use: '升主任以上需要；上主管培訓班、在職專班提升' },
  { id: 'language', label: '外語', use: '上英文會話班提升；之後轉職加分（v0.3）' },
  { id: 'programming', label: '程式', use: '上程式設計入門提升；之後可以接案（v0.4）' },
];

export const SKILL_LABELS = Object.fromEntries(SKILL_LIST.map(s => [s.id, s.label]));
