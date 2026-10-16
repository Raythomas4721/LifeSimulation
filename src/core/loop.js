// 真實時間 → 遊戲日。只負責計時，實際推進交給 onDays
const TICK_MS = 250; // 時鐘和存款要看起來連續走動，所以比一天（10 秒）細很多
const MAX_DELTA_MS = 2000; // 分頁被節流或電腦休眠時不一次補太多，離線推進另外處理（M3）

export function createLoop({ msPerDay, getSpeed, onDays, onTick, now = () => Date.now() }) {
  let last = now();
  let acc = 0;
  let timer = null;

  function tick() {
    const t = now();
    const delta = Math.min(Math.max(t - last, 0), MAX_DELTA_MS); // 時間倒退當成 0
    last = t;
    acc += delta * getSpeed();
    const days = Math.floor(acc / msPerDay);
    if (days > 0) {
      acc -= days * msPerDay;
      onDays(days);
    }
    onTick();
  }

  return {
    start() {
      if (timer) return;
      last = now();
      timer = setInterval(tick, TICK_MS);
    },
    stop() {
      clearInterval(timer);
      timer = null;
    },
    progress: () => acc / msPerDay, // 今天過了多少（0～1），畫面內插用
  };
}
