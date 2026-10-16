import { FINANCE } from '../data/balance.js';
import { addLog } from '../core/state.js';

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
  if (state.money < 0) {
    const interest = Math.round((-state.money * FINANCE.debtAnnualRate) / 12);
    state.money -= interest;
    state.period.expenses += interest;
    addLog(state, { kind: 'interest', amount: interest });
  }
  state.money -= FINANCE.livingCost;
  state.period.expenses += FINANCE.livingCost;
  addLog(state, { kind: 'livingCost', amount: FINANCE.livingCost });
}
