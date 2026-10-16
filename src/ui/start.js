// 開局流程前半（DESIGN.md §13.2）：標題 → 輸入名字。之後進遊戲由人資教學接手
import { SURNAMES, GIVEN_NAMES } from '../data/names.js';
import { ageOn } from '../core/calendar.js';
import { esc } from './format.js';

const NAME_MAX = 12;

// 回傳 { action: 'continue' } 或 { action: 'new', name }
export function runStartFlow(root, { save }) {
  return new Promise(resolve => {
    const screens = { title, name };

    function title() {
      const cont = save
        ? `<button class="btn btn-block btn-primary" data-go="continue">繼續：${esc(save.state.player.name)}（${ageOn(save.state.day)} 歲）</button>`
        : '';
      return `
        <div class="start">
          <div class="start-logo" aria-hidden="true">🏢</div>
          <h1>上班模擬器</h1>
          <p class="muted">Office Life Simulator</p>
          <div class="start-actions">
            ${cont}
            <button class="btn btn-block${save ? '' : ' btn-primary'}" data-go="new">開始新人生</button>
          </div>
        </div>`;
    }

    function name() {
      return `
        <div class="start">
          <h1>你叫什麼名字？</h1>
          <p class="muted">2026 年 7 月 1 日，22 歲的你第一天上班。</p>
          <div class="name-row">
            <input class="input" id="name" maxlength="${NAME_MAX}" value="${esc(randomName())}" autocomplete="off" aria-label="名字">
            <button class="btn" data-go="reroll" aria-label="換一個名字">🎲</button>
          </div>
          <div class="start-actions">
            <button class="btn btn-block btn-primary" data-go="named">第一天上班</button>
          </div>
        </div>`;
    }

    function show(screen) {
      root.innerHTML = screens[screen]();
      root.querySelector('#name')?.focus();
    }

    function finish(result) {
      root.removeEventListener('click', onClick);
      root.removeEventListener('keydown', onKey);
      resolve(result);
    }

    function submitName() {
      const input = root.querySelector('#name');
      const value = input.value.trim().slice(0, NAME_MAX);
      if (!value) return input.focus();
      finish({ action: 'new', name: value });
    }

    function onClick(e) {
      const go = e.target.closest('[data-go]')?.dataset.go;
      if (go === 'continue') finish({ action: 'continue' });
      if (go === 'new') {
        if (save && !confirm('目前的存檔會被覆蓋，確定要開始新人生嗎？')) return;
        show('name');
      }
      if (go === 'reroll') root.querySelector('#name').value = randomName();
      if (go === 'named') submitName();
    }

    function onKey(e) {
      if (e.key === 'Enter' && e.target.id === 'name') submitName();
    }

    root.addEventListener('click', onClick);
    root.addEventListener('keydown', onKey);
    show('title');
  });
}

// 預設名字不影響遊戲結果，所以不用遊戲的亂數
const randomName = () =>
  SURNAMES[Math.floor(Math.random() * SURNAMES.length)] + GIVEN_NAMES[Math.floor(Math.random() * GIVEN_NAMES.length)];
