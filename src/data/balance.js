// 所有數值平衡常數（DESIGN.md §5、§6.2、§11）。調整後先跑 node tools/simulate.js

// 以年為節奏（§5.1）：1 天 0.4 秒、1 年約 2.4 分鐘，22～65 歲約 1 小時 45 分（×1，不含看卡片的時間）
export const TIME = {
  msPerDay: 400,
  speeds: [0, 1, 2, 4],
  debugSpeed: 100,
};

export const START = {
  date: [2026, 7, 1], // 年、月、日；當天滿 22 歲並到職
  age: 22,
  money: 30_000,
  salary: 32_000,
  energy: 100,
  energyMax: 100,
  mood: 70,
  performance: 35,
};

// 體力主要靠每晚睡覺恢復；晚上休息只多補一點，主要是心情
export const DAILY = {
  work: { energy: -8, mood: -2, performance: 0.14 },
  sleep: { energy: 8, mood: 0, performance: 0 }, // 每天都有，含週末與請假
  rest: { energy: 4, mood: 4, performance: 0 },
  overtime: { energy: -16, mood: -6, performance: 0.08 },
  slack: { energy: 0, mood: 8, performance: 0 }, // 耍廢：只補心情
  study: { energy: -6, mood: -3, performance: 0 },
  exercise: { energy: -4, mood: 2, performance: 0 },
  weekendMultiplier: 2, // 週末一整天：效果、花費、出席、體能都加倍
};

// 技能（DESIGN.md §6）：每項 0～100
export const SKILLS = {
  max: 100,
  workProfessional: 0.02, // 每個上班日，專業 +0.02（一年約 +5）
  selfStudy: 0.1, // 沒報名課程時，一格進修自學的專業（每週 2 格一年約 +10）
  professionalPerformance: 1 / 1000, // 工作表現累積 ×（1 + 專業 × 這個值），專業 100 時多 10%
  managerFromLevel: 3, // 升上這個職級（主任）後，每年 1/1 管理再加
  managerYearly: 3,
};

// 體能（§6）：靠運動累積，每天自然下降
export const FITNESS = {
  max: 100,
  perSlot: 1,
  dailyDecay: 0.15,
  energyMaxPerPoint: 0.3, // 體力上限 = 100 + 體能 × 0.3
  sleepPerPoint: 0.03, // 每晚睡覺多恢復 體能 × 0.03（體能 100 時 +3）
  exerciseCost: 200, // 一格運動的花費（健身房、球場）
};

// 進修（§9.1）
export const STUDY = {
  passRate: 0.7, // 出席率達到這個比例才算結業
};

// 考試（§9.1）：通過率 = 基礎 + 技能 + 出席 + 考前狀態，限制在 5%～95%
export const EXAM = {
  base: 0.3,
  perSkillPoint: 0.006, // 相關技能每 10 點 +6%
  attendanceBonus: 0.2, // 出席率達 70%
  goodState: 0.1, // 考前體力、心情都 ≥ 50
  badState: -0.2, // 考前體力或心情 < 20
  cramBonus: 0.1, // 考前熬夜衝刺
  cramEnergy: -15,
  min: 0.05,
  max: 0.95,
};

export const THRESHOLDS = {
  low: 20, // 體力或心情低於此值，工作表現累積減半
  lowPenalty: 0.5,
  happy: 80,
};

export const FINANCE = {
  daysPerMonth: 30, // 日薪 = 月薪 ÷ 30
  livingCost: 18_000,
  overtimePayRate: { weekday: 0.5, weekend: 1.0 },
  debtAnnualRate: 0.15,
  debtPlanRate: 0.05, // 債務協商後的年利率
  // 卡債事件鏈（§11）：負債滿 1 個月、3 個月、之後每 6 個月
  debtBillMonths: 1,
  debtCollectionMonths: 3,
  debtCourtEveryMonths: 6,
};

export const REVIEW = {
  grades: [
    { grade: 'A', min: 80 },
    { grade: 'B', min: 60 },
    { grade: 'C', min: 40 },
    { grade: 'D', min: 0 },
  ],
  raise: { A: [0.05, 0.08], B: [0.02, 0.04], C: [0, 0], D: [0, 0] },
  carryOver: 0.5, // 考核後工作表現保留的比例
  trialMonths: 12, // 到職未滿這麼久的考核固定為 B、不升遷
  trialGrade: 'B',
  promotionRaise: 0.1, // 接受升遷時月薪另外調升（DESIGN.md §7.2）
  levelWorkEnergy: -1, // 每高一個職級，平日上班多扣的體力（升遷的代價）
  declineMood: 5, // 婉拒升遷時心情回升
  pipSalaryCut: 0.1, // 績效改善計畫沒通過：降一級並減薪；已經是專員就只減薪
  minSalary: 29_500, // 減薪不低於基本工資
  salaryRound: 100,
};

export const BONUS = {
  months: { A: 2, B: 1.5, C: 1, D: 0.5 }, // 1/1 考核時一起發放（§7.4）
};

export const EVENTS = {
  minGapDays: 38, // 兩個事件之間至少隔幾天（約 15 秒），讓事件間隔落在 15～30 秒（§10.2）
  holidayWindowDays: 14, // 節日可以延後幾天出現；延後還排不進去就跳過那一年
  holidayCooldownDays: 1000, // 同一個節日至少隔快三年才再出現（M7 從 700 調長，降低重複感）
  dailyChance: 1 / 12, // 空檔夠長時，隨機事件每天出現的機率
  cooldownDays: 180,
  weight: 10,
};

export const HEALTH = {
  minorMedical: 500,
  collapseLeaveDays: 7,
  collapseMedical: 3_000,
  collapseMood: -15,
  collapseRestoreEnergy: 60, // 病倒請假結束時體力至少回到這裡
  hospitalAfter: 3, // 同一年病倒幾次就住院
  hospitalDays: 14,
  hospitalMedical: 25_000,
  hospitalPerformance: -20,
  hospitalMood: -20,
  sickPayDays: 30, // 每年前幾天病假半薪，之後無薪
  sickPayRate: 0.5,
};

export const OFFLINE = {
  maxDays: 365, // 離線最多推進 1 遊戲年，約 2.4 分鐘的離開時間（§5.3）
  minSummaryDays: 30, // 推進不到一個月又沒發生事情時不跳摘要
};

export const SAVE = {
  autosaveMs: 10_000,
};
