// 人資帶你過第一天（DESIGN.md §13.2）：把說到的地方亮起來，其他地方變暗，教學期間時間暫停
import { TUTOR, TUTORIAL } from '../data/tutorial.js';

export function createTutorial(root, onFinish) {
  let step = -1;
  let target = null;
  const layer = document.createElement('div');
  layer.className = 'tour';

  function show() {
    target?.classList.remove('tour-target');
    const s = TUTORIAL[step];
    target = root.querySelector(`[data-tour="${s.target}"]`);
    target?.classList.add('tour-target');
    target?.scrollIntoView({ block: 'center' });
    // 目標在畫面上半部時，對話框放下面，反之放上面，才不會蓋住目標
    const atBottom = !target || target.getBoundingClientRect().top < innerHeight / 2;
    const action = s.next
      ? `<button class="btn btn-primary btn-block" data-tour-next>${s.next}</button>`
      : '<p class="muted">（點上面亮起來的地方）</p>';
    layer.innerHTML = `
      <div class="tour-blocker"></div>
      <div class="tour-card card ${atBottom ? 'is-bottom' : 'is-top'}" role="dialog" aria-live="polite">
        <p class="speech"><b>${TUTOR}：</b>${s.text}</p>
        ${action}
      </div>`;
  }

  function advance() {
    step++;
    if (step < TUTORIAL.length) return show();
    target?.classList.remove('tour-target');
    layer.remove();
    step = -1;
    onFinish();
  }

  layer.addEventListener('click', e => {
    if (e.target.closest('[data-tour-next]')) advance();
  });

  return {
    start() {
      document.body.append(layer);
      step = -1;
      advance();
    },
    // 玩家做了某個動作；符合目前步驟的 waitFor 就往下走
    notify(event) {
      if (step >= 0 && TUTORIAL[step].waitFor === event) advance();
    },
    get active() {
      return step >= 0;
    },
    destroy() {
      target?.classList.remove('tour-target');
      layer.remove();
      step = -1;
    },
  };
}
