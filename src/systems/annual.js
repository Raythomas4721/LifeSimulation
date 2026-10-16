// 年度考核、升遷（DESIGN.md §7.2、§7.3）與年終（§7.4），都在 1/1 一起處理
import { BONUS, REVIEW, SKILLS } from '../data/balance.js';
import { LADDER } from '../data/jobs.js';
import { calendarOf, monthsBetween } from '../core/calendar.js';
import { addLog } from '../core/state.js';
import { pushCard } from './cards.js';
import { applyEffects } from './effects.js';
import { triggerEvent } from './events.js';
import { gradeFor } from './work.js';
import { addSkill } from './study.js';

const GRADE_ORDER = ['A', 'B', 'C', 'D'];
const atLeast = (grade, required) => GRADE_ORDER.indexOf(grade) <= GRADE_ORDER.indexOf(required);
const roundTo = (n, step) => Math.round(n / step) * step;
const lastGrades = (state, n, grade) => {
  const last = state.job.reviews.slice(-n);
  return last.length === n && last.every(r => r.grade === grade && !r.trial);
};
const lastGradesA = (state, n) => lastGrades(state, n, 'A');

// 1/1 結算時呼叫，評的是剛結束的那一年
export function annualReview(state, rng) {
  const year = calendarOf(state.day).year - 1;
  const trial = monthsBetween(state.job.startDay, state.day) < REVIEW.trialMonths;
  const grade = trial ? REVIEW.trialGrade : gradeFor(state.job.performance);
  const [lo, hi] = REVIEW.raise[grade];
  const raise = lo + (hi - lo) * rng.next();
  let salary = state.job.salary * (1 + raise);

  state.job.reviews.push({ year, grade, trial });
  if (state.job.level >= SKILLS.managerFromLevel) addSkill(state, 'management', SKILLS.managerYearly); // 當主管本身就是練習
  // 符合條件時不直接升遷，而是在考核卡片上讓玩家決定要不要接受（§7.2）
  const next = LADDER.find(l => l.level === state.job.level + 1);
  const check = !trial && next ? promotionCheck(state, next, grade) : null;
  const offer = check?.ok ? { level: next.level, title: next.title } : null;
  // 年資和考核都夠、只差技能時，卡片上告訴玩家還差多少
  const missing = check?.missingSkills.length ? { title: next.title, skills: check.missingSkills } : null;

  const before = state.job.salary;
  state.job.salary = roundTo(salary, REVIEW.salaryRound);
  state.job.performance *= REVIEW.carryOver;

  // 被約談後的績效改善計畫（§7.3）：這次 C 以上就結束，還是 D 就降級或減薪
  let pip = null;
  if (state.crisis.pip && !trial) {
    state.crisis.pip = false;
    pip = grade === 'D' ? demote(state) : 'passed';
    addLog(state, { kind: 'pip', result: pip });
  }

  // 年終和考核一起發（§7.4），一張卡片看完；到職未滿一年按在職月數比例
  const months = BONUS.months[grade];
  const ratio = Math.min(1, monthsBetween(state.job.startDay, state.day) / 12);
  const bonus = Math.round(state.job.salary * months * ratio);
  applyEffects(state, { money: bonus });

  addLog(state, { kind: 'review', year, grade });
  addLog(state, { kind: 'bonus', amount: bonus });
  pushCard(state, {
    kind: 'notice',
    id: 'review',
    data: { year, grade, trial, raise, offer, missing, pip, bonusMonths: months, prorated: ratio < 1 },
    salary: { from: before, to: state.job.salary },
    deltas: { money: bonus },
  });
  if (grade === 'C') triggerEvent(state, 'year_end_bonus');
  if (!pip && lastGrades(state, 2, 'D')) triggerEvent(state, 'pip_talk'); // 連兩年 D 被約談
}

// 降一級並減薪；已經是專員就只減薪，不低於基本工資
function demote(state) {
  const cut = salary => Math.max(REVIEW.minSalary, roundTo(salary * (1 - REVIEW.pipSalaryCut), REVIEW.salaryRound));
  state.job.salary = cut(state.job.salary);
  if (state.job.level === 1) return 'cut';
  state.job.level -= 1;
  state.job.levelStartDay = state.day;
  return 'demoted';
}

// 考核卡片上的升遷抉擇：接受就升一級、月薪再調升，之後平日上班更累
export function acceptPromotion(state) {
  const offer = state.pending?.data?.offer;
  if (!offer || offer.level !== state.job.level + 1) return;
  state.job.level = offer.level;
  state.job.levelStartDay = state.day;
  state.job.salary = roundTo(state.job.salary * (1 + REVIEW.promotionRaise), REVIEW.salaryRound);
  addLog(state, { kind: 'promotion', title: offer.title });
}

// 婉拒：維持現職、心情回升；年資照算，明年考核還能再升
export function declinePromotion(state) {
  const offer = state.pending?.data?.offer;
  if (!offer) return;
  applyEffects(state, { mood: REVIEW.declineMood });
  addLog(state, { kind: 'declinePromotion', title: offer.title });
}

// 人脈條件在 v0.4 開放前視為符合；年資看的是目前職級待了多久
// missingSkills 只在其他條件都符合時才列，避免年資還不夠就叫玩家去上課
export function promotionCheck(state, next, grade) {
  const basic = next.consecutiveA
    ? lastGradesA(state, next.consecutiveA)
    : monthsBetween(state.job.levelStartDay, state.day) / 12 >= next.years && atLeast(grade, next.grade);
  const missingSkills = Object.entries(next.skills ?? {})
    .filter(([id, need]) => state.skills[id] < need)
    .map(([id, need]) => ({ id, need, short: Math.ceil(need - state.skills[id]) }));
  return { ok: basic && !missingSkills.length, missingSkills: basic ? missingSkills : [] };
}
