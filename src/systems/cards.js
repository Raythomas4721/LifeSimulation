// 等玩家回應的卡片：state.pending 是目前這張，其他排在 state.queue（DESIGN.md §14.3）
// kind：'review'（檢討與月結）、'event'（事件）、'notice'（考核、年終、病倒等通知）
export function pushCard(state, card) {
  if (state.pending) state.queue.push(card);
  else state.pending = card;
}

export function closeCard(state) {
  state.pending = state.queue.shift() ?? null;
}
