// 除錯面板（DESIGN.md §14.6）：網址加 ?debug 才出現，所有跳轉都經過 advanceDay
import { TIME } from '../data/balance.js';
import { daysUntil } from '../core/calendar.js';
import { EVENT_LIST } from '../data/events.js';
import { esc } from './format.js';

let autoCards = false;

const STAT_FIELDS = [
  { key: 'money', label: '存款', get: s => s.money, set: (s, v) => (s.money = v) },
  { key: 'energy', label: '體力', get: s => s.vitals.energy, set: (s, v) => (s.vitals.energy = v) },
  { key: 'mood', label: '心情', get: s => s.vitals.mood, set: (s, v) => (s.vitals.mood = v) },
  { key: 'performance', label: '工作表現', get: s => s.job.performance, set: (s, v) => (s.job.performance = v) },
];

// 開關放在底部分頁列，避免浮動按鈕蓋住畫面上的操作
export function mountDebug(ctl, tabbar) {
  const toggle = document.createElement('button');
  toggle.className = 'tabbar-btn';
  toggle.innerHTML = '<span aria-hidden="true">🐞</span>除錯';
  tabbar.append(toggle);

  const wrap = document.createElement('div');
  wrap.className = 'debug';
  wrap.innerHTML = '<div class="debug-panel card" hidden></div>';
  document.body.append(wrap);
  const panel = wrap.querySelector('.debug-panel');

  toggle.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    toggle.setAttribute('aria-pressed', String(!panel.hidden));
    if (!panel.hidden) render();
  });

  function render() {
    const s = ctl.state;
    panel.innerHTML = `
      <h2>除錯面板</h2>
      <div class="debug-row">
        <button class="btn" data-debug="fast">×${TIME.debugSpeed}</button>
        <button class="btn" data-debug="normal">×1</button>
      </div>
      <div class="debug-row">
        <button class="btn" data-debug="days" data-n="1">+1 天</button>
        <button class="btn" data-debug="days" data-n="7">+7 天</button>
        <button class="btn" data-debug="nextMonth">下個月 1 日</button>
        <button class="btn" data-debug="nextYear">下一個 1/1</button>
      </div>
      <label class="debug-check"><input type="checkbox" id="debug-auto"${autoCards ? ' checked' : ''}> 跳轉時自動處理途中的卡片（照預設選項）</label>
      <div class="debug-row">
        <label class="debug-seed">觸發事件<select class="input" id="debug-event">${EVENT_LIST.map(e => `<option value="${e.id}">${e.title}</option>`).join('')}</select></label>
        <button class="btn" data-debug="trigger">觸發</button>
      </div>
      <div class="debug-stats">
        ${STAT_FIELDS.map(f => `<label>${f.label}<input class="input" type="number" data-stat="${f.key}" value="${Math.round(f.get(s))}"></label>`).join('')}
      </div>
      <button class="btn btn-block" data-debug="applyStats">套用數值</button>
      <div class="debug-row">
        <label class="debug-seed">種子<input class="input" type="number" id="debug-seed" value="${ctl.seed}"></label>
        <button class="btn" data-debug="reseed">用這個種子重新開始</button>
      </div>
      <details><summary>state</summary><pre>${esc(JSON.stringify(s, null, 2))}</pre></details>`;
  }

  wrap.addEventListener('click', e => {
    const btn = e.target.closest('[data-debug]');
    if (!btn) return;
    const day = ctl.state.day;
    autoCards = panel.querySelector('#debug-auto').checked;
    switch (btn.dataset.debug) {
      case 'fast': ctl.setSpeed(TIME.debugSpeed); break;
      case 'normal': ctl.setSpeed(1); break;
      case 'days': ctl.advanceDays(Number(btn.dataset.n), autoCards); break;
      case 'nextMonth': ctl.advanceDays(daysUntil(day, c => c.date === 1), autoCards); break;
      case 'nextYear': ctl.advanceDays(daysUntil(day, c => c.month === 1 && c.date === 1), autoCards); break;
      case 'trigger': ctl.triggerEvent(panel.querySelector('#debug-event').value); break;
      case 'applyStats':
        for (const f of STAT_FIELDS) {
          const v = Number(panel.querySelector(`[data-stat="${f.key}"]`).value);
          if (Number.isFinite(v)) f.set(ctl.state, v);
        }
        ctl.changed();
        break;
      case 'reseed': {
        const seed = Number(panel.querySelector('#debug-seed').value);
        if (Number.isInteger(seed) && seed >= 0) ctl.newGameWithSeed(seed >>> 0);
        return;
      }
    }
    render();
  });

  return {
    destroy() {
      toggle.remove();
      wrap.remove();
    },
  };
}
