// v0.2 M7 職場危機（DESIGN.md §7.3、§11）：被約談、卡債事件鏈，都由系統觸發（followUp）
// crisis：選了之後寫進 state.crisis，例如進入績效改善計畫；major：離線時停下來等玩家
export const CRISIS_EVENTS = [
  {
    id: 'pip_talk',
    cast: 'boss',
    title: '被約談了',
    text: '王經理把你叫進會議室，人資小林也在：「連續兩年考核 D，公司希望你接下來一年跟著績效改善計畫走。明年考核還是 D 的話……我們再談。」',
    followUp: true, // 連兩年 D 時由年度考核觸發
    major: true,
    choices: [
      {
        text: '虛心接受，好好改進',
        effects: { mood: -6, performance: 3 },
        crisis: { pip: true },
        result: '拿到一份密密麻麻的改善計畫。明年考核 C 以上就能過關。',
        default: true,
      },
      {
        text: '據理力爭',
        crisis: { pip: true },
        chance: {
          p: 0.4,
          effects: { mood: 4, performance: 5 },
          result: '王經理承認給你的雜事太多，答應幫你減量。改善計畫還是要跑。',
          otherwise: { mood: -8, performance: -2 },
          otherwiseResult: '王經理臉色更難看了：「那就用結果證明吧。」',
        },
      },
    ],
  },
  {
    id: 'debt_bill',
    title: '卡費繳不出來',
    text: '信用卡帳單來了，帳戶裡的錢不夠繳。',
    followUp: true, // 負債滿 1 個月
    choices: [
      { text: '先繳最低應繳金額', effects: { mood: -4 }, result: '剩下的會被收循環利息，年利率 15%…', default: true },
      {
        text: '打電話給媽媽',
        effects: { money: 20_000, mood: -6 },
        result: '媽媽什麼都沒問，只說：「錢不夠要說，記得吃飯。」匯了兩萬過來。',
      },
    ],
  },
  {
    id: 'debt_collection',
    title: '銀行的催收電話',
    text: '已經欠了三個月，銀行開始每天打電話來，上班時間也打。',
    followUp: true, // 負債滿 3 個月
    choices: [
      {
        text: '申請債務協商',
        effects: { mood: -5 },
        crisis: { debtPlan: true },
        result: '協商成功，利率降到 5%，但信用卡被停卡了。還清之前都要省一點。',
        default: true,
      },
      { text: '先拖著', effects: { mood: -8 }, result: '電話越來越多，連同事都聽到了…' },
    ],
  },
  {
    id: 'debt_court',
    title: '法院寄來的支付命令',
    text: '欠款太久，債權銀行向法院聲請了支付命令，還要負擔程序費用。',
    followUp: true, // 負債滿 6 個月，之後每 6 個月
    choices: [
      {
        text: '請假去處理',
        effects: { money: -5_000, mood: -12, performance: -2 },
        result: '跑了一趟法院，請假的事主管也知道了。',
        default: true,
      },
      {
        text: '把能賣的東西都賣掉',
        effects: { money: 3_000, mood: -15 },
        result: '二手拍賣賣掉了相機和吉他，付完程序費還剩一點。',
      },
    ],
  },
];
