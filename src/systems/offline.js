// 離線推進（DESIGN.md §5.3）：固定 ×1 速度、最多 12 遊戲週
// 一般卡片照預設選項處理並記進摘要；遇到重大抉擇就停，等玩家回來決定
import { OFFLINE, TIME } from '../data/balance.js';
import { advanceDay } from '../core/advance.js';
import { autoResolve } from './auto.js';
import { isMajor, pushCardFront } from './cards.js';

export const offlineDays = awayMs => Math.min(OFFLINE.maxDays, Math.floor(Math.max(0, awayMs) / TIME.msPerDay));

export function runOffline(state, rng, awayMs) {
  const days = offlineDays(awayMs);
  if (days < 1) return null;

  const before = stats(state);
  const happened = [];
  let reviews = 0;
  let ran = 0;
  let stopped = false;

  // 處理目前排著的卡片；遇到重大抉擇回傳 false
  const settle = () => {
    while (state.pending) {
      const card = state.pending;
      if (isMajor(card)) return false;
      autoResolve(state, rng);
      if (card.kind === 'review') reviews++;
      else if (card.kind === 'event' && card.choice != null) happened.push({ kind: 'event', id: card.id, choice: card.choice, text: card.text });
      else if (card.kind === 'notice') happened.push({ kind: 'notice', id: card.id, data: card.data, deltas: card.deltas });
    }
    return true;
  };

  while (ran < days) {
    if (!settle()) {
      stopped = true;
      break;
    }
    advanceDay(state, rng);
    ran++;
  }
  if (!stopped) stopped = !settle();

  const summary = {
    kind: 'away',
    awayMs,
    capped: !stopped && ran === OFFLINE.maxDays && awayMs > OFFLINE.maxDays * TIME.msPerDay, // 真的碰到 12 週上限才提
    days: ran,
    from: before,
    to: stats(state),
    happened,
    reviews,
    stopped,
  };
  pushCardFront(state, summary);
  return summary;
}

const stats = state => ({
  day: state.day,
  money: state.money,
  energy: state.vitals.energy,
  mood: state.vitals.mood,
  performance: state.job.performance,
  level: state.job.level,
});
