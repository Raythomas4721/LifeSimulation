// 年度回顧（DESIGN.md §5.4）：每年 12/31 結束時回顧這一年，順便調整明年的每週行程
import { calendarOf } from '../core/calendar.js';
import { closeCard, pushCard } from './cards.js';

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
    events: 0,
  };
}

// 在當天結算完、state.day 加 1 之前呼叫
export function checkReview(state) {
  if (calendarOf(state.day + 1).date !== 1 || calendarOf(state.day + 1).month !== 1) return;
  state.flags.reviews += 1;
  pushCard(state, {
    kind: 'review',
    type: 'yearly',
    year: calendarOf(state.day).year,
    report: buildReport(state),
  });
}

export function resolveReview(state, schedule) {
  if (schedule) state.schedule = [...schedule];
  closeCard(state);
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
    events: p.events ?? 0,
    collapses: state.health.collapses,
    sickDays: state.health.sickDays,
  };
}
