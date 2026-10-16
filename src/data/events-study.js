// v0.2 M6 事件包（DESIGN.md §10.3）：進修、技能、運動受傷、重症
// 欄位同 events.js；effects 可以是函式，chance.p 也可以是函式；hint 是選項按鈕下方的說明
import { COURSES_BY_ID } from './courses.js';

const weekday = (s, c) => !c.weekend;
const courseOf = s => s.study.course && COURSES_BY_ID[s.study.course.id];
const studying = s => Boolean(s.study.course);
const slotsOf = (s, id) => s.schedule.filter(a => a === id).length;
const mainSkill = s => Object.keys(courseOf(s).gain)[0];
const clamp = p => Math.min(0.95, Math.max(0.05, p));
const pct = p => `${Math.round(p * 100)}%`;
const STUDY_WEIGHT = 30; // 課程只有兩三個月，權重調高，上課期間才碰得到

const languageChance = s => clamp(0.15 + s.skills.language / 80);
const programmingChance = s => clamp(0.1 + s.skills.programming / 40);

export const STUDY_EVENTS = [
  {
    id: 'tuition_subsidy',
    cast: 'hr',
    title: '學費可以申請補助',
    text: '人資小林：「聽說你在上課？公司有進修補助，可以補一半學費喔。」',
    condition: s => studying(s) && s.day - s.study.course.startDay <= 60 && courseOf(s).cost >= 8_000,
    weight: STUDY_WEIGHT,
    cooldownDays: 365,
    choices: [
      {
        text: '申請補助',
        effects: s => (courseOf(s) ? { money: Math.round(courseOf(s).cost / 2), mood: 3 } : {}),
        result: '補助下來了！不過要簽一年內不離職的同意書。（轉職 v0.3 起會綁約）',
        default: true,
      },
      { text: '不用了，自己出', effects: { mood: 1 }, result: '不想被綁住，學費自己來。' },
    ],
  },
  {
    id: 'boss_against_study',
    cast: 'boss',
    title: '「最近怎麼都準時走？」',
    text: '王經理：「最近怎麼都準時下班？聽說你去上課？這週案子很趕喔。」',
    condition: (s, c) => studying(s) && weekday(s, c),
    weight: STUDY_WEIGHT,
    choices: [
      {
        text: '說明是為了工作學的',
        chance: {
          p: 0.6,
          effects: { performance: 1 },
          result: '王經理點點頭：「有心就好。」',
          otherwise: { mood: -3 },
          otherwiseResult: '王經理：「學歸學，工作不要耽誤。」',
        },
        default: true,
      },
      {
        text: '這週先不去上課，留下來',
        effects: { performance: 2, mood: -3 },
        forceSlots: { activity: 'overtime', weeks: 1, slots: [1, 3] },
        result: '這週的課只好先翹掉了。',
      },
    ],
  },
  {
    id: 'classmates_supper',
    title: '同學揪宵夜',
    text: '下課後，班上同學揪：「一起去吃鹹酥雞？」',
    condition: studying,
    weight: STUDY_WEIGHT,
    choices: [
      {
        text: '一起去',
        effects: { money: -350, mood: 6 },
        delayed: { days: 1, effects: { energy: -8 } },
        result: '聊到快十二點，認識了幾個不同產業的朋友。',
      },
      { text: '回家睡覺', result: '明天還要上班，先回家了。', default: true },
    ],
  },
  {
    id: 'homework_night',
    title: '明天要交作業',
    text: '突然想起來，課堂作業明天就要交了，還一個字都沒寫。',
    condition: studying,
    weight: STUDY_WEIGHT,
    choices: [
      {
        text: '熬夜認真寫',
        effects: s => (courseOf(s) ? { energy: -12, [mainSkill(s)]: 2 } : { energy: -12 }),
        result: '寫到半夜，不過真的學到東西。',
      },
      { text: '隨便寫寫交差', effects: { mood: 1 }, result: '交了就好。', default: true },
    ],
  },
  {
    id: 'study_burnout',
    title: '上班加上課，有點撐不住',
    text: '白天上班、晚上上課，最近累到在捷運上站著都能睡著。',
    condition: s => studying(s) && s.vitals.energy < 35,
    weight: STUDY_WEIGHT * 2,
    choices: [
      {
        text: '這週翹課，好好休息',
        effects: { mood: 4 },
        forceSlots: { activity: 'rest', weeks: 1, slots: [0, 1, 2, 3, 4] },
        result: '這週晚上都待在家。出席率要小心了。',
        default: true,
      },
      { text: '咬牙撐下去', effects: { mood: -4 }, result: '學費都繳了，不能放棄。' },
    ],
  },
  {
    id: 'bookstore_sale',
    title: '書店在特價',
    text: '路過書店，商業書和工具書全部 79 折。',
    condition: s => !studying(s) && slotsOf(s, 'study') > 0,
    choices: [
      { text: '買幾本專業書', effects: { money: -800, professional: 2 }, result: '自學的晚上有新東西可以看了。' },
      { text: '逛逛就好', result: '翻了幾頁，放回架上。', default: true },
    ],
  },
  {
    id: 'foreign_client',
    cast: 'boss',
    title: '外國客戶來訪',
    text: '王經理：「下午有日本和美國的客戶要來，誰英文比較好，幫忙接待一下？」',
    condition: weekday,
    choices: [
      {
        text: '我來接待',
        hint: s => `成功機率約 ${pct(languageChance(s))}（看外語）`,
        chance: {
          p: languageChance,
          effects: { performance: 3, mood: 4 },
          result: '客戶聊得很開心，王經理對你刮目相看。',
          otherwise: { performance: -1, mood: -6 },
          otherwiseResult: '雞同鴨講了一下午，有點丟臉…',
        },
      },
      { text: '請英文好的同事幫忙', result: '躲在座位上假裝很忙。', default: true },
    ],
  },
  {
    id: 'automate_report',
    title: '每週都要整理的報表',
    text: '每週一早上都要花三小時手動整理報表，越做越煩。',
    condition: weekday,
    choices: [
      {
        text: '寫個程式自動化',
        hint: s => `成功機率約 ${pct(programmingChance(s))}（看程式）`,
        chance: {
          p: programmingChance,
          effects: { performance: 3, mood: 4 },
          result: '程式跑起來了！以後每週省下三小時。',
          otherwise: { energy: -10, mood: -3 },
          otherwiseResult: '寫了一整晚還是跑不動，明天繼續手動做…',
        },
      },
      { text: '繼續手動做', effects: { energy: -3 }, result: '複製、貼上、複製、貼上…', default: true },
    ],
  },
  {
    id: 'sports_injury',
    title: '運動時扭到了',
    text: '打球時落地沒站穩，腳踝腫了起來。',
    condition: s => slotsOf(s, 'exercise') > 0,
    weight: s => 6 * slotsOf(s, 'exercise'), // 運動越多越容易受傷
    choices: [
      {
        text: '去看醫生，乖乖休息',
        effects: { money: -1_500, fitness: -5 },
        sickLeave: 3,
        result: '醫生說休息幾天就好，這陣子先別運動太猛。',
        default: true,
      },
      {
        text: '貼個痠痛貼布繼續動',
        chance: {
          p: 0.4,
          effects: { fitness: -15, money: -3_000, energy: -20, mood: -5 },
          result: '越動越痛，傷得更重了，花了更多時間復健…',
          otherwiseResult: '休息一晚，好像沒事了。',
        },
      },
    ],
  },
  {
    id: 'stomach_ulcer',
    title: '胃好痛',
    text: '心情一直很差，最近常常胃痛，今天早上痛到冒冷汗。',
    condition: s => s.vitals.mood < 20,
    weight: 25,
    cooldownDays: 365,
    choices: [
      {
        text: '馬上去醫院',
        effects: { illness: 'hospital' },
        result: '醫生說是胃潰瘍，要住院治療。壓力真的會把人弄壞。',
        default: true,
      },
      {
        text: '吃胃藥撐著',
        chance: {
          p: 0.6,
          effects: { illness: 'hospital', mood: -5 },
          result: '撐了兩天，最後還是被送進急診…',
          otherwise: { mood: -3 },
          otherwiseResult: '暫時壓下去了，但問題還在。',
        },
      },
    ],
  },
  {
    id: 'palpitation',
    title: '心臟怦怦跳',
    text: '連續加班好幾週，今天開會時突然心悸、喘不過氣。',
    condition: s => slotsOf(s, 'overtime') >= 3 && s.vitals.energy < 30,
    weight: 25,
    cooldownDays: 365,
    choices: [
      {
        text: '去看醫生，請假休息',
        effects: { money: -2_000 },
        sickLeave: 5,
        result: '醫生說是過勞，要好好休息，加班量最好減少。',
        default: true,
      },
      {
        text: '喝杯咖啡繼續拚',
        chance: {
          p: 0.4,
          effects: { illness: 'hospital' },
          result: '下午在辦公室昏倒，被救護車送進醫院…',
          otherwise: { performance: 1 },
          otherwiseResult: '撐過去了…但身體在警告你。',
        },
      },
    ],
  },
];
