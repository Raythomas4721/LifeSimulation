// 固定班底（DESIGN.md §10.4）：在事件裡反覆出現的同事，v0.4 起會變成有好感度的 NPC
export const CAST = [
  { id: 'boss', name: '王經理', role: '直屬主管', emoji: '👔', desc: '口頭禪是「簡單改一下就好」，其實人不壞。' },
  { id: 'xiaomei', name: '小美', role: '熱心同事', emoji: '🙋', desc: '團購、訂飲料、辦活動都找她。' },
  { id: 'akai', name: '阿凱', role: '厭世同事', emoji: '😪', desc: '躺平代表，摸魚技術一流。' },
  { id: 'hr', name: '人資小林', role: '人資', emoji: '📋', desc: '帶你過第一天的人，試用期面談也是她。' },
  { id: 'mom', name: '媽媽', role: '家人', emoji: '👩', desc: '每天早上準時傳長輩圖。' },
];

export const CAST_BY_ID = Object.fromEntries(CAST.map(c => [c.id, c]));
