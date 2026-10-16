// 年度考核、升遷（DESIGN.md §7.2、§7.3）與年終（§7.4）
import { BONUS, REVIEW } from '../data/balance.js';
import { LADDER } from '../data/jobs.js';
import { calendarOf, monthsBetween } from '../core/calendar.js';
import { addLog } from '../core/state.js';
import { pushCard } from './cards.js';
import { applyEffects } from './effects.js';
import { triggerEvent } from './events.js';
import { gradeFor } from './work.js';

const GRADE_ORDER = ['A', 'B', 'C', 'D'];
const atLeast = (grade, required) => GRADE_ORDER.indexOf(grade) <= GRADE_ORDER.indexOf(required);
const roundTo = (n, step) => Math.round(n / step) * step;

// 1/1 結算時呼叫，評的是剛結束的那一年
export function annualReview(state, rng) {
  const year = calendarOf(state.day).year - 1;
  const trial = monthsBetween(state.job.startDay, state.day) < REVIEW.trialMonths;
  const grade = trial ? REVIEW.trialGrade : gradeFor(state.job.performance);
  const [lo, hi] = REVIEW.raise[grade];
  const raise = lo + (hi - lo) * rng.next();
  let salary = state.job.salary * (1 + raise);

  state.job.reviews.push({ year, grade, trial });
  // 符合條件時不直接升遷，而是在考核卡片上讓玩家決定要不要接受（§7.2）
  const next = LADDER.find(l => l.level === state.job.level + 1);
  const offer = !trial && next && canPromote(state, next, grade) ? { level: next.level, title: next.title } : null;

  const before = state.job.salary;
  state.job.salary = roundTo(salary, REVIEW.salaryRound);
  state.job.performance *= REVIEW.carryOver;
  addLog(state, { kind: 'review', year, grade });
  pushCard(state, {
    kind: 'notice',
    id: 'review',
    data: { year, grade, trial, raise, offer },
    salary: { from: before, to: state.job.salary },
  });
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

// 技能、人脈條件在對應版本開放前視為符合；年資看的是目前職級待了多久
function canPromote(state, next, grade) {
  if (next.consecutiveA) {
    const last = state.job.reviews.slice(-next.consecutiveA);
    return last.length === next.consecutiveA && last.every(r => r.grade === 'A' && !r.trial);
  }
  const years = monthsBetween(state.job.levelStartDay, state.day) / 12;
  return years >= next.years && atLeast(grade, next.grade);
}

// 1/20 結算時呼叫：依最近一次考核發年終，未滿一年按在職月數比例
export function yearEndBonus(state) {
  const last = state.job.reviews[state.job.reviews.length - 1];
  if (!last) return;
  const months = BONUS.months[last.grade];
  const ratio = Math.min(1, monthsBetween(state.job.startDay, state.day) / 12);
  const amount = Math.round(state.job.salary * months * ratio);
  applyEffects(state, { money: amount });
  addLog(state, { kind: 'bonus', amount });
  pushCard(state, {
    kind: 'notice',
    id: 'bonus',
    data: { grade: last.grade, months, prorated: ratio < 1 },
    deltas: { money: amount },
  });
  if (last.grade === 'C') triggerEvent(state, 'year_end_bonus');
}
