// 遊戲主畫面。更新分兩種（DESIGN.md §14.3）：
// data-bind / data-bar / data-pressed 每秒只改文字、寬度與按下狀態；data-block 內容有變化時才重畫那一塊
import { calendarOf, slotIndex } from '../core/calendar.js';
import * as header from './header.js';
import * as cards from './cards.js';
import * as home from './tabs/home.js';
import * as career from './tabs/career.js';
import * as menu from './tabs/menu.js';

const TABS = [
  { id: 'today', label: '今天', icon: '🏠', view: home },
  { id: 'career', label: '職涯', icon: '💼', view: career },
  { id: 'menu', label: '選單', icon: '☰', view: menu },
];

export function mountApp(root, ctl) {
  let tab = TABS[0];
  const lastHtml = new WeakMap();

  root.innerHTML = `
    <header class="status">${header.render()}</header>
    <main class="tab" id="tab"></main>
    <nav class="tabbar">
      ${TABS.map(t => `<button class="tabbar-btn" data-action="tab" data-value="${t.id}"><span aria-hidden="true">${t.icon}</span>${t.label}</button>`).join('')}
    </nav>
    <div data-block="card"></div>`;
  const main = root.querySelector('#tab');

  const context = () => ({ state: ctl.state, progress: ctl.progress(), ctl });
  const views = () => [header, cards, tab.view];

  function showTab(id) {
    tab = TABS.find(t => t.id === id) ?? TABS[0];
    main.innerHTML = tab.view.render(context());
    for (const btn of root.querySelectorAll('.tabbar-btn[data-value]')) {
      btn.setAttribute('aria-current', btn.dataset.value === tab.id ? 'page' : 'false');
    }
    window.scrollTo(0, 0);
    refresh();
  }

  function refresh() {
    const c = context();
    const binds = Object.assign({}, ...views().map(v => v.binds));
    const blocks = Object.assign({}, ...views().map(v => v.blocks));
    for (const el of root.querySelectorAll('[data-bind]')) {
      const text = String(binds[el.dataset.bind](c));
      if (el.textContent !== text) el.textContent = text;
    }
    for (const el of root.querySelectorAll('[data-bar]')) {
      el.style.width = `${Math.max(0, Math.min(100, binds[el.dataset.bar](c)))}%`;
    }
    for (const el of root.querySelectorAll('[data-pressed]')) {
      el.setAttribute('aria-pressed', String(Boolean(binds[el.dataset.pressed](c))));
    }
    for (const el of root.querySelectorAll('[data-block]')) {
      const html = blocks[el.dataset.block](c);
      if (lastHtml.get(el) !== html) {
        lastHtml.set(el, html);
        el.innerHTML = html;
      }
    }
    const todaySlot = slotIndex(calendarOf(c.state.day).weekday);
    for (const el of root.querySelectorAll('[data-slot]')) {
      el.classList.toggle('is-today', Number(el.dataset.slot) === todaySlot);
    }
  }

  function onClick(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn || !root.contains(btn)) return;
    const { action, value, index } = btn.dataset;
    switch (action) {
      case 'tab': return showTab(value);
      case 'speed': ctl.setSpeed(Number(value)); break;
      case 'preset': ctl.applyPreset(value); break;
      case 'toggleSlot': ctl.toggleSlot(Number(index)); break;
      case 'save': ctl.saveNow(); break;
      case 'restart':
        if (confirm('確定要刪掉存檔、重新開始嗎？')) ctl.restart();
        return;
      default:
        for (const v of views()) v.actions?.[action]?.(btn.dataset, ctl);
    }
    refresh();
  }

  root.addEventListener('click', onClick);
  showTab('today');

  return {
    refresh,
    destroy: () => root.removeEventListener('click', onClick),
  };
}
