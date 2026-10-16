// 進修與技能（DESIGN.md §6、§9.1）：報名課程、出席、結業；技能一律透過 addSkill 增加
import { SKILLS, STUDY } from '../data/balance.js';
import { COURSES_BY_ID } from '../data/courses.js';
import { addLog } from '../core/state.js';
import { pushCard } from './cards.js';

export function addSkill(state, id, amount) {
  state.skills[id] = Math.min(SKILLS.max, Math.max(0, state.skills[id] + amount));
}

export const currentCourse = state => state.study.course;
export const requiredAttendance = course => course.weeks * course.slots;

// 不能報名的原因；可以報名回傳 null
export function enrollBlocker(state, id) {
  const c = COURSES_BY_ID[id];
  if (state.study.course) return '一次只能上一門課';
  if (c.minLevel && state.job.level < c.minLevel) return '資深專員以上才能報名';
  if (!c.repeat && state.study.done[id]) return '已經上過了';
  if (state.money < c.cost) return '存款不夠繳學費';
  return null;
}

// 報名當天晚上就開始算出席
export function enrollCourse(state, id) {
  if (!COURSES_BY_ID[id] || enrollBlocker(state, id)) return false;
  const c = COURSES_BY_ID[id];
  state.money -= c.cost;
  state.period.expenses += c.cost;
  state.study.course = { id, startDay: state.day, endDay: state.day + c.weeks * 7, attended: 0 };
  addLog(state, { kind: 'courseEnroll', id, cost: c.cost });
  return true;
}

// 中途退課：學費不退、沒有效果
export function dropCourse(state) {
  const course = state.study.course;
  if (!course) return;
  state.study.course = null;
  addLog(state, { kind: 'courseDrop', id: course.id });
}

// 一格進修：上課中算出席，沒報名就自學專業
export function attendStudy(state, k) {
  const course = state.study.course;
  if (course && state.day < course.endDay) course.attended += k;
  else addSkill(state, 'professional', SKILLS.selfStudy * k);
}

// 當天結算完呼叫：課程期間最後一天結算後，依出席率決定有沒有結業
export function checkCourse(state) {
  const course = state.study.course;
  if (!course || state.day + 1 < course.endDay) return;
  const c = COURSES_BY_ID[course.id];
  const required = requiredAttendance(c);
  const passed = course.attended / required >= STUDY.passRate;
  if (passed) {
    for (const [skill, amount] of Object.entries(c.gain)) addSkill(state, skill, amount);
    state.study.done[course.id] = (state.study.done[course.id] ?? 0) + 1;
  }
  state.study.course = null;
  addLog(state, { kind: passed ? 'coursePass' : 'courseFail', id: course.id });
  pushCard(state, { kind: 'notice', id: 'course', data: { id: course.id, passed, attended: Math.min(course.attended, required), required } });
}
