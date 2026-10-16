// 存讀檔（DESIGN.md §14.4）。格式變動時把 SAVE_VERSION 加 1，並在 MIGRATIONS 補上舊版升級函式
const KEY = 'lifesim.save';
export const SAVE_VERSION = 3;

// 遷移函式要自給自足，不引用現在的遊戲程式，舊存檔才不會因為程式改動而升級失敗
const MIGRATIONS = {
  // v2：人資教學、檢討卡片、里程碑、暫停前的速度
  1: save => {
    const s = save.state;
    return {
      ...save,
      version: 2,
      state: {
        ...s,
        flags: { tutorialDone: true, reviews: 4, milestones: {} },
        period: {
          startDay: s.day,
          money: s.money,
          energy: s.vitals.energy,
          mood: s.vitals.mood,
          performance: s.job.performance,
          income: 0,
          overtimePay: 0,
          expenses: 0,
          overtimeSlots: 0,
          workDays: 0,
        },
        pending: null,
        settings: { lastSpeed: 1, ...s.settings },
      },
    };
  },
  // v3：事件、傷病、年度考核、卡片佇列
  2: save => {
    const s = save.state;
    return {
      ...save,
      version: 3,
      state: {
        ...s,
        job: { ...s.job, levelStartDay: s.job.startDay, reviews: [] },
        health: { collapses: 0, sickDays: 0 },
        events: { last: {}, counts: {} },
        stats: { collapses: 0, hospitalStays: 0, ...s.stats },
        pending: s.pending ? { kind: 'review', ...s.pending } : null,
        queue: [],
      },
    };
  },
};

export function toSave({ state, seed, rng }, savedAt) {
  return { version: SAVE_VERSION, savedAt, seed, rng: rng.state, state };
}

export function migrate(save) {
  let s = save;
  while (s.version < SAVE_VERSION) {
    const up = MIGRATIONS[s.version];
    if (!up) throw new Error(`沒有 v${s.version} 的存檔遷移函式`);
    s = up(s);
  }
  return s;
}

function isValid(save) {
  return (
    save != null &&
    Number.isInteger(save.version) &&
    save.version <= SAVE_VERSION &&
    Number.isInteger(save.rng) &&
    typeof save.state?.day === 'number'
  );
}

export function writeSave(save) {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
    return true;
  } catch (e) {
    console.warn('存檔失敗', e);
    return false;
  }
}

export function readSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const save = JSON.parse(raw);
    if (!isValid(save)) {
      console.warn('存檔格式不正確，已忽略');
      return null;
    }
    return migrate(save);
  } catch (e) {
    console.warn('讀檔失敗', e);
    return null;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // 儲存空間被封鎖時沒有東西可刪
  }
}
