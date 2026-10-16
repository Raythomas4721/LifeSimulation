// 進入點：載入存檔、啟動迴圈、掛上 UI
import { SAVE, TIME } from './data/balance.js';
import { SLOT_ACTIVITIES } from './data/schedule.js';
import { createState } from './core/state.js';
import { createRng, randomSeed } from './core/rng.js';
import { createLoop } from './core/loop.js';
import { advanceDay } from './core/advance.js';
import { calendarOf, slotIndex } from './core/calendar.js';
import { clearSave, readSave, toSave, writeSave } from './core/save.js';
import { clampVitals } from './systems/work.js';
import { resolveReview } from './systems/review.js';
import { mountApp } from './ui/app.js';
import { runStartFlow } from './ui/start.js';
import { createTutorial } from './ui/tutorial.js';
import { mountDebug } from './ui/debug.js';
import { nextActivity } from './ui/text.js';

const DEBUG = new URLSearchParams(location.search).has('debug');
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
  setTonight(activity) {
    ctl.setSlot(slotIndex(calendarOf(game.state.day).weekday), activity);
    session.tutorial?.notify('tonight');
  },
  toggleSlot(index) {
    ctl.setSlot(index, nextActivity(game.state.schedule[index]));
  },
  resolveReview(schedule) {
    if (schedule && (schedule.length !== 7 || !schedule.every(id => SLOT_IDS.includes(id)))) return;
    resolveReview(game.state, schedule);
    save();
  },
  advanceDays(n) {
    advance(n);
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

function onVisibility() {
  // 離線推進在 M3；目前切到背景時先存檔並暫停
  if (document.hidden) {
    save();
    session.loop.stop();
  } else {
    session.loop.start();
  }
}

function startSession(g) {
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
    startSession({ state: saved.state, seed: saved.seed, rng: createRng(saved.rng) });
  } else {
    startSession(newGame(choice.name));
  }
}

boot();
