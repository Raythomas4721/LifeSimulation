// 存讀檔（DESIGN.md §14.4）。格式變動時把 SAVE_VERSION 加 1，並在 MIGRATIONS 補上舊版升級函式
const KEY = 'lifesim.save';
export const SAVE_VERSION = 4;

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
  // v4：技能、體能、進修（v0.2 M5）。已經升上去的職級不會因為缺管理而降級
  3: save => {
    const s = save.state;
    return {
      ...save,
      version: 4,
      state: {
        ...s,
        skills: { professional: 0, management: 0, language: 0, programming: 0 },
        fitness: 0,
        study: { course: null, done: {} },
        vitals: { ...s.vitals, energyMax: 100 },
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

// 存檔碼（§14.4）：「LS1:」加上存檔 JSON 的 UTF-8 base64，用來換手機或備份
const CODE_PREFIX = 'LS1:';

export function encodeSaveCode(save) {
  const bytes = new TextEncoder().encode(JSON.stringify(save));
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return CODE_PREFIX + btoa(binary);
}

// 失敗時丟出可以直接顯示給玩家的錯誤訊息
export function decodeSaveCode(code) {
  const text = String(code).replace(/\s+/g, '');
  if (!text.startsWith(CODE_PREFIX)) throw new Error('這不是上班模擬器的存檔碼，請確認有從「LS1:」開始整段複製。');
  let save;
  try {
    const binary = atob(text.slice(CODE_PREFIX.length));
    save = JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, c => c.charCodeAt(0))));
  } catch {
    throw new Error('存檔碼不完整，請確認有整段複製。');
  }
  if (Number.isInteger(save?.version) && save.version > SAVE_VERSION) throw new Error('這個存檔碼來自比較新的版本，請先更新遊戲。');
  if (!isValid(save)) throw new Error('存檔碼的內容不正確。');
  return migrate(save);
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // 儲存空間被封鎖時沒有東西可刪
  }
}
