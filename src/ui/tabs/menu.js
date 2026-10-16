export function render({ ctl }) {
  return `
    <section class="card">
      <h2>存檔</h2>
      <p>每 10 秒自動存檔，切到背景時也會存。</p>
      <p class="muted">上次存檔：<span data-bind="savedAt"></span></p>
      <button class="btn btn-block" data-action="save">立即存檔</button>
    </section>
    <section class="card">
      <h2>重新開始</h2>
      <p>刪掉目前的存檔，從 22 歲重新來過。</p>
      <button class="btn btn-block btn-danger" data-action="restart">重新開始</button>
    </section>
    <section class="card">
      <h2>關於</h2>
      <p>上班模擬器（Office Life Simulator）v0.1 開發中</p>
      ${ctl.debug ? '<p class="muted">除錯模式已開啟：底部的 🐞 是除錯面板。</p>' : ''}
    </section>`;
}

export const binds = {
  savedAt: ({ ctl }) => {
    if (ctl.saveFailed) return '存檔失敗，瀏覽器可能封鎖了儲存空間';
    return ctl.lastSavedAt ? new Date(ctl.lastSavedAt).toLocaleTimeString('zh-TW') : '還沒存過';
  },
};

export const blocks = {};
