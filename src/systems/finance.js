import { FINANCE } from '../data/balance.js';
import { addLog } from '../core/state.js';
import { triggerEvent } from './events.js';

export const dailyWage = state => Math.round(state.job.salary / FINANCE.daysPerMonth);

export const overtimePay = (state, weekend) =>
  Math.round(dailyWage(state) * FINANCE.overtimePayRate[weekend ? 'weekend' : 'weekday']);

// sickPay：今天是平日又在請假時，日薪要乘上的比例（半薪或無薪）
export function applyDailyIncome(state, sickPay = 1) {
  const wage = Math.round(dailyWage(state) * sickPay);
  state.money += wage;
  state.period.income += wage;
}

// 每月 1 日：先依現有負債計息，再扣房租與生活費
export function applyMonthStart(state) {
  trackDebt(state);
  if (state.money < 0) {
    const rate = state.crisis.debtPlan ? FINANCE.debtPlanRate : FINANCE.debtAnnualRate;
    const interest = Math.round((-state.money * rate) / 12);
    state.money -= interest;
    state.period.expenses += interest;
    addLog(state, { kind: 'interest', amount: interest });
  }
  state.money -= FINANCE.livingCost;
  state.period.expenses += FINANCE.livingCost;
  addLog(state, { kind: 'livingCost', amount: FINANCE.livingCost });
}

// 卡債事件鏈（§11）：月初還是負的就多算一個月，到了門檻觸發事件；轉正就重新計算
function trackDebt(state) {
  const c = state.crisis;
  if (state.money >= 0) {
    if (c.debtMonths) addLog(state, { kind: 'debtCleared' });
    c.debtMonths = 0;
    c.debtPlan = false;
    return;
  }
  c.debtMonths += 1;
  const m = c.debtMonths;
  if (m === FINANCE.debtBillMonths) triggerEvent(state, 'debt_bill');
  else if (m === FINANCE.debtCollectionMonths) triggerEvent(state, 'debt_collection');
  else if (m >= FINANCE.debtCourtEveryMonths && m % FINANCE.debtCourtEveryMonths === 0) triggerEvent(state, 'debt_court');
}
