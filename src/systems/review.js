// 週日檢討與月結（DESIGN.md §5.4）
import { PACING } from '../data/balance.js';
import { calendarOf } from '../core/calendar.js';

// 每段期間開始時記下起點，期間內的收支由各系統累加
export function startPeriod(state) {
  state.period = {
    startDay: state.day,
    money: state.money,
    energy: state.vitals.energy,
    mood: state.vitals.mood,
    performance: state.job.performance,
    income: 0,
    overtimePay: 0,
    expenses: 0,
    overtimeSlots: 0,
    workDays: 0,
  };
}

// 在當天結算完、state.day 加 1 之前呼叫
export function checkReview(state) {
  if (state.pending) return;
  const cal = calendarOf(state.day);
  const weekly = state.flags.reviews < PACING.weeklyReviews;
  const due = weekly
    ? cal.weekday === 0
    : calendarOf(state.day + 1).date === 1 && state.day - state.period.startDay + 1 >= PACING.minMonthlyDays;
  if (!due) return;
  state.flags.reviews += 1;
  state.pending = {
    type: weekly ? 'weekly' : 'monthly',
    number: state.flags.reviews,
    month: cal.month,
    report: buildReport(state),
  };
}

export function resolveReview(state, schedule) {
  if (schedule) state.schedule = [...schedule];
  state.pending = null;
  startPeriod(state);
}

function buildReport(state) {
  const p = state.period;
  return {
    startDay: p.startDay,
    endDay: state.day,
    income: p.income,
    overtimePay: p.overtimePay,
    expenses: p.expenses,
    moneyStart: p.money,
    moneyEnd: state.money,
    energyStart: p.energy,
    energyEnd: state.vitals.energy,
    moodStart: p.mood,
    moodEnd: state.vitals.mood,
    perfGain: state.job.performance - p.performance,
    perfPerWorkday: p.workDays ? (state.job.performance - p.performance) / p.workDays : 0,
    overtimeSlots: p.overtimeSlots,
  };
}
