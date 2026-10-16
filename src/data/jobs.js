// 通用職位階梯（DESIGN.md §7.2）。skills、network 條件在對應版本開放前視為符合
export const LADDER = [
  { level: 1, title: '專員' },
  { level: 2, title: '資深專員', years: 2, grade: 'B' },
  { level: 3, title: '主任', years: 3, grade: 'B', skills: { management: 20 } },
  { level: 4, title: '經理', years: 4, grade: 'A', skills: { management: 40 } },
  { level: 5, title: '協理', years: 5, grade: 'A', skills: { management: 60 }, network: 10 },
  { level: 6, title: '總經理', consecutiveA: 3, skills: { management: 80 } },
];
