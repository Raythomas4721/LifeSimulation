// 系統通知卡片的文字（考核、年終、病倒、住院、出院、課程結業）。d 是發出通知時記下的資料
import { COURSES_BY_ID } from './courses.js';
import { SKILL_LABELS } from './skills.js';

const gainText = gain => Object.entries(gain).map(([id, n]) => `${SKILL_LABELS[id]} +${n}`).join('、');
// 只差技能時的提示，例如「升主任還差管理 8，可以去上主管培訓班」
const missingText = m => `升${m.title}還差${m.skills.map(s => `${SKILL_LABELS[s.id]} ${s.short}`).join('、')}，可以去「職涯」分頁報名課程。`;

// actions 可以是函式，依資料決定要給哪些選項；沒有 actions 就只有一顆「好」
export const NOTICES = {
  review: {
    title: d => `${d.year} 年度考核`,
    lines: d => [
      `考核結果：${d.grade}${d.trial ? '（試用期固定為 B）' : ''}`,
      d.raise > 0 ? `加薪 ${(d.raise * 100).toFixed(1)}%` : '這次沒有加薪。',
      d.bonusMonths != null ? `年終 ${d.bonusMonths} 個月${d.prorated ? '（未滿一年，依在職月數按比例）' : ''}` : null,
      d.offer ? `主管：「想升你當『${d.offer.title}』，你覺得呢？」` : null,
      d.missing ? missingText(d.missing) : null,
    ],
    actions: d =>
      d.offer
        ? [
            { id: 'acceptPromotion', label: '接受升遷' }, // 按鈕下方的效果說明由畫面依目前數值算
            { id: 'declinePromotion', label: '先不要' },
          ]
        : null,
  },
  bonus: {
    title: () => '年終入帳',
    lines: d => [`依考核 ${d.grade}，年終 ${d.months} 個月${d.prorated ? '（未滿一年，依在職月數按比例）' : ''}。`],
  },
  collapse: {
    title: () => '你病倒了',
    lines: () => ['體力撐不住，整個人倒下了。', '醫生說要請假一週好好休息，這週只領半薪。'],
  },
  hospital: {
    title: () => '住院了',
    lines: () => ['這一年已經病倒好幾次，這次直接被送進醫院。', '要住院兩週，期間都不能工作。'],
  },
  course: {
    title: d => `${COURSES_BY_ID[d.id].title}${d.passed ? '結業了' : '沒有結業'}`,
    lines: d => [
      `出席 ${d.attended} / ${d.required} 次（${Math.round((d.attended / d.required) * 100)}%）。`,
      d.passed ? `結業！${gainText(COURSES_BY_ID[d.id].gain)}。` : '出席率不到 70%，這次沒有結業，學費也不會退。',
    ],
  },
  discharge: {
    title: () => '出院了',
    lines: () => ['在醫院躺了兩週，終於出院。', '要繼續這樣拚下去，還是重新開始人生？'],
    actions: () => [
      { id: 'continue', label: '繼續，這次會照顧好自己' },
      { id: 'restart', label: '重新開始人生' },
    ],
  },
};
