// v0.2 M7 一般事件擴充（DESIGN.md §10.3）：職場與生活的小事，讓隨機事件更多樣
// 欄位同 events.js；預設選項（離線時自動選）盡量接近中性
const weekday = (s, c) => !c.weekend;

export const LIFE_EVENTS = [
  {
    id: 'phone_broken',
    title: '手機摔破了',
    text: '早上趕捷運，手機從口袋滑出去，螢幕碎成蜘蛛網。',
    choices: [
      { text: '直接換新手機', effects: { money: -25_000, mood: 6 }, result: '新手機好順，但存款痛了一下。' },
      { text: '送修換螢幕', effects: { money: -4_000 }, result: '修好了，跟新的一樣。', default: true },
      { text: '貼膠帶繼續用', effects: { mood: -3 }, result: '滑起來有點刮手…' },
    ],
  },
  {
    id: 'meeting_marathon',
    cast: 'boss',
    title: '一整天都在開會',
    text: '行事曆從早上九點排到下午六點，全部都是會議。',
    condition: weekday,
    choices: [
      { text: '認真開會', effects: { energy: -6, performance: 1 }, result: '開完會，自己的工作一件都沒做。', default: true },
      {
        text: '開會時偷做自己的事',
        chance: {
          p: 0.3,
          effects: { performance: -2, mood: -4 },
          result: '被王經理點名：「你覺得呢？」完全答不出來。',
          otherwise: { performance: 1 },
          otherwiseResult: '神不知鬼不覺，把報告趕完了。',
        },
      },
    ],
  },
  {
    id: 'new_intern',
    title: '新來的實習生',
    text: '部門來了一個實習生，主管說：「你帶他一下。」',
    condition: weekday,
    choices: [
      { text: '好好帶他', effects: { energy: -5, management: 2 }, result: '教人比想像中難，但自己也學到不少。' },
      { text: '丟給他整理資料', effects: { mood: 2 }, result: '實習生默默整理了一整天的檔案。', default: true },
    ],
  },
  {
    id: 'team_building',
    cast: 'boss',
    title: '週末的部門團康',
    text: '王經理：「這週六部門團康，大家都會到吧？」',
    condition: (s, c) => c.weekday === 4 || c.weekday === 5, // 週四、週五問週末的事
    choices: [
      { text: '參加', effects: { energy: -8, mood: -2, performance: 1 }, result: '玩了一整天大地遊戲，跟同事熟了一點。' },
      { text: '說家裡有事', effects: { mood: 2 }, result: '週末還是自己的。', default: true },
    ],
  },
  {
    id: 'scratch_card',
    title: '超商的刮刮樂',
    text: '結帳時看到刮刮樂，今天手氣好像不錯？',
    choices: [
      {
        text: '買一張試試',
        effects: { money: -200 },
        chance: { p: 0.1, effects: { money: 2_000, mood: 6 }, result: '中了兩千！', otherwiseResult: '銘謝惠顧。' },
      },
      { text: '算了', result: '把錢留著買飲料。', default: true },
    ],
  },
  {
    id: 'birthday_cake',
    cast: 'xiaomei',
    title: '同事的生日蛋糕',
    text: '小美：「今天是阿凱生日，會議室有蛋糕喔！」',
    condition: weekday,
    choices: [
      { text: '去吃一塊', effects: { mood: 3 }, result: '大家一起唱生日快樂歌，辦公室難得熱鬧。', default: true },
      { text: '留在座位上趕工', effects: { performance: 1, mood: -1 }, result: '小美幫你留了一塊放在桌上。' },
    ],
  },
  {
    id: 'online_course_ad',
    title: '演算法推薦的線上課',
    text: '社群一直跳出廣告：「三十天學會資料分析，限時五折！」',
    choices: [
      { text: '買了', effects: { money: -3_000, professional: 2 }, result: '看了前幾集，有學到東西，剩下的…之後再說。' },
      { text: '滑掉', result: '演算法好像更懂你了。', default: true },
    ],
  },
  {
    id: 'boss_vacation',
    cast: 'boss',
    title: '王經理出國兩週',
    text: '王經理請了特休出國，辦公室的空氣突然變得好清新。',
    condition: weekday,
    choices: [
      { text: '照常努力', effects: { performance: 1 }, result: '該做的照做，回來也沒被念。', default: true },
      { text: '趁機放鬆一下', effects: { mood: 6, performance: -1 }, result: '準時下班，還去吃了好幾次下午茶。' },
    ],
  },
  {
    id: 'peer_promoted',
    cast: 'xiaomei',
    title: '同期升遷了',
    text: '公告出來了，跟你同一年進公司的同事升官了。',
    condition: s => s.day > 365 * 2,
    choices: [
      { text: '真心恭喜他', effects: { mood: -2 }, result: '心裡有點酸，但還是替他高興。', default: true },
      { text: '默默給自己打氣', effects: { mood: -4, performance: 2 }, result: '把羨慕變成動力。' },
    ],
  },
  {
    id: 'parking_ticket',
    title: '收到罰單',
    text: '信箱裡有一張紅單：違規停車，罰款 900。',
    choices: [
      { text: '乖乖繳掉', effects: { money: -900, mood: -2 }, result: '下次停車要看清楚。', default: true },
      {
        text: '寫申訴',
        effects: { energy: -3 },
        chance: {
          p: 0.3,
          effects: { mood: 5 },
          result: '申訴成功，撤銷了！',
          otherwise: { money: -900, mood: -4 },
          otherwiseResult: '申訴被駁回，還是要繳。',
        },
      },
    ],
  },
  {
    id: 'midnight_quake',
    title: '半夜地震',
    text: '凌晨三點，手機的地震警報大響，房間晃了好一陣子。',
    choices: [
      { text: '躲到桌子底下', effects: { energy: -5 }, result: '確認沒事以後，翻來覆去睡不著。', default: true },
      { text: '翻身繼續睡', effects: { mood: 2 }, result: '台灣人的日常。' },
    ],
  },
  {
    id: 'payday_spree',
    title: '發薪日的購物車',
    text: '薪水入帳，購物車裡的東西一直在對你招手。',
    condition: (s, c) => c.date >= 5 && c.date <= 12, // 每月 5 日發薪後一週
    choices: [
      { text: '全部結帳', effects: { money: -5_000, mood: 7 }, result: '買東西的快樂大概能撐一週。' },
      { text: '先存起來', effects: { mood: -1 }, result: '把購物車清空，假裝沒看到。', default: true },
    ],
  },
];
