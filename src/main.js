// 進入點：載入存檔、啟動迴圈、掛上 UI
import { SAVE, TIME } from './data/balance.js';
import { SCHEDULE_PRESETS, SLOT_ACTIVITIES } from './data/schedule.js';
import { createState } from './core/state.js';
import { createRng, randomSeed } from './core/rng.js';
import { createLoop } from './core/loop.js';
import { advanceDay } from './core/advance.js';
import { clearSave, decodeSaveCode, encodeSaveCode, readSave, toSave, writeSave } from './core/save.js';
import { clampVitals } from './systems/work.js';
import { resolveReview } from './systems/review.js';
import { closeCard } from './systems/cards.js';
import { chooseEvent, triggerEvent } from './systems/events.js';
import { autoResolve } from './systems/auto.js';
import { runOffline } from './systems/offline.js';
import { acceptPromotion, declinePromotion } from './systems/annual.js';
import { mountApp } from './ui/app.js';
import { runStartFlow } from './ui/start.js';
import { createTutorial } from './ui/tutorial.js';
import { mountDebug } from './ui/debug.js';
import { nextActivity } from './ui/text.js';

const PARAMS = new URLSearchParams(location.search);
const DEBUG = PARAMS.has('debug');
const SLOT_IDS = SLOT_ACTIVITIES.map(a => a.id);
const root = document.getElementById('app');

let game = null; // { state, seed, rng }
let session = null; // 這一局的 loop、ui、教學、計時器

const ctl = {
  debug: DEBUG,
  lastSavedAt: null,
  saveFailed: false,
  get state() {
    return game.state;
  },
  get seed() {
    return game.seed;
  },
  progress: () => session.loop.progress(),
  // 教學中或有檢討卡片等玩家回應時，時間暫停
  blocked: () => Boolean(session.tutorial?.active || game.state.pending),
  setSpeed(speed) {
    game.state.settings.speed = speed;
    if (speed > 0) game.state.settings.lastSpeed = speed;
  },
  setSlot(index, activity) {
    if (!SLOT_IDS.includes(activity) || index < 0 || index > 6) return;
    game.state.schedule[index] = activity;
    save();
  },
  toggleSlot(index) {
    ctl.setSlot(index, nextActivity(game.state.schedule[index]));
    session.tutorial?.notify('schedule');
  },
  applyPreset(id) {
    const preset = SCHEDULE_PRESETS.find(p => p.id === id);
    if (!preset?.schedule) return;
    game.state.schedule = [...preset.schedule];
    save();
    session.tutorial?.notify('schedule');
  },

  resolveReview(schedule) {
    if (game.state.pending?.kind !== 'review') return;
    if (schedule && (schedule.length !== 7 || !schedule.every(id => SLOT_IDS.includes(id)))) return;
    resolveReview(game.state, schedule);
    save();
  },
  chooseEvent(index) {
    chooseEvent(game.state, game.rng, index);
    save();
  },
  closeCard() {
    if (game.state.pending?.kind === 'review') return;
    closeCard(game.state);
    save();
  },
  // 通知卡片上的選項：升遷抉擇、出院後繼續
  noticeAction(id) {
    if (game.state.pending?.kind !== 'notice') return;
    if (id === 'acceptPromotion') acceptPromotion(game.state);
    if (id === 'declinePromotion') declinePromotion(game.state);
    closeCard(game.state);
    save();
  },
  triggerEvent(id) {
    triggerEvent(game.state, id);
    session.ui.refresh();
  },
  // 除錯跳轉；auto 時途中的卡片照預設選項處理，停在最後一天
  advanceDays(n, auto = false) {
    if (!auto) advance(n);
    else {
      for (let i = 0; i < n; i++) {
        while (game.state.pending) autoResolve(game.state, game.rng);
        advanceDay(game.state, game.rng);
      }
      save();
    }
    session.ui.refresh();
  },
  changed() {
    clampVitals(game.state);
    save();
    session.ui.refresh();
  },
  saveNow: () => save(),
  restart() {
    endSession();
    clearSave();
    boot();
  },
  // 匯出、匯入存檔碼（§14.4）；匯入會換掉整局，所以延到這次點擊處理完再做
  exportCode: () => encodeSaveCode(toSave(game, Date.now())),
  importCode(code) {
    const imported = decodeSaveCode(code);
    setTimeout(() => {
      endSession();
      writeSave(imported);
      startSession({ state: imported.state, seed: imported.seed, rng: createRng(imported.rng) }, Date.now() - imported.savedAt);
    });
  },
  // 除錯：假裝離開了一段時間
  simulateAway(ms) {
    catchUp(ms);
    session.ui.refresh();
  },
  newGameWithSeed(seed) {
    const name = game.state.player.name;
    endSession();
    startSession(newGame(name, seed));
  },
};

function newGame(name, seed = randomSeed()) {
  return { state: createState(name), seed, rng: createRng(seed) };
}

// 跳出檢討卡片就停下來，等玩家回應
function advance(days) {
  for (let i = 0; i < days && !game.state.pending; i++) advanceDay(game.state, game.rng);
  if (game.state.pending) save();
}

function save() {
  if (!game) return;
  const now = Date.now();
  ctl.saveFailed = !writeSave(toSave(game, now));
  if (!ctl.saveFailed) ctl.lastSavedAt = now;
}

// 離線推進（§5.3）：教學沒走完或玩家按了暫停時不推進
function catchUp(awayMs) {
  if (!game.state.flags.tutorialDone || game.state.settings.speed === 0) return;
  if (runOffline(game.state, game.rng, awayMs)) save();
}

// 切到背景時存檔並停止計時；切回來時把離開的時間當成離線推進
function onVisibility() {
  if (document.hidden) {
    save();
    session.hiddenAt = Date.now();
    session.loop.stop();
  } else {
    if (session.hiddenAt) catchUp(Date.now() - session.hiddenAt);
    session.hiddenAt = null;
    session.loop.start();
    session.ui.refresh();
  }
}

// awayMs：上次存檔到現在過了多久，用來做離線推進
function startSession(g, awayMs = 0) {
  game = g;
  const loop = createLoop({
    msPerDay: TIME.msPerDay,
    getSpeed: () => (ctl.blocked() ? 0 : game.state.settings.speed),
    onDays: advance,
    onTick: () => session.ui.refresh(),
  });
  session = { loop };
  session.ui = mountApp(root, ctl);
  session.debug = DEBUG ? mountDebug(ctl, root.querySelector('.tabbar')) : null;
  if (!game.state.flags.tutorialDone) {
    session.tutorial = createTutorial(root, () => {
      game.state.flags.tutorialDone = true;
      save();
      session.ui.refresh();
    });
    session.tutorial.start();
  }
  catchUp(awayMs);
  session.ui.refresh();
  session.autosave = setInterval(save, SAVE.autosaveMs);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', save);
  save();
  loop.start();
}

function endSession() {
  if (!session) return;
  session.loop.stop();
  session.ui.destroy();
  session.debug?.destroy();
  session.tutorial?.destroy();
  clearInterval(session.autosave);
  document.removeEventListener('visibilitychange', onVisibility);
  window.removeEventListener('pagehide', save);
  session = null;
  game = null;
}

async function boot() {
  const saved = readSave();
  const choice = await runStartFlow(root, { save: saved });
  if (choice.action === 'continue') {
    const s = choice.save ?? saved; // 從標題畫面匯入存檔碼時會帶 save
    startSession({ state: s.state, seed: s.seed, rng: createRng(s.rng) }, Date.now() - s.savedAt);
  } else {
    startSession(newGame(choice.name));
  }
}

boot();

// service worker 只在正式網址註冊；本機開發加 ?sw 才註冊，免得一直拿到快取的舊檔（§14.5）
const LOCAL = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
if ('serviceWorker' in navigator && (!LOCAL || PARAMS.has('sw'))) navigator.serviceWorker.register('sw.js');
