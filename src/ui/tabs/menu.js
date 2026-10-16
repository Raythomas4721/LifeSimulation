import { decodeSaveCode } from '../../core/save.js';
import { esc } from '../format.js';

// 存檔碼區塊的狀態：'export'、'import' 或 null；訊息用 data-bind 顯示，才不會重畫掉輸入框
let mode = null;
let code = '';
let message = '';

export function render({ ctl }) {
  mode = null;
  message = '';
  return `
    <section class="card">
      <h2>存檔</h2>
      <p>每 10 秒自動存檔，切到背景時也會存。</p>
      <p class="muted">上次存檔：<span data-bind="savedAt"></span></p>
      <button class="btn btn-block" data-action="save">立即存檔</button>
    </section>
    <section class="card">
      <h2>存檔碼</h2>
      <p>換手機、或怕瀏覽器清掉資料時，可以把存檔變成一串文字保存起來。</p>
      <div class="preset-grid">
        <button class="btn" data-action="exportCode">匯出存檔碼</button>
        <button class="btn" data-action="importOpen">匯入存檔碼</button>
      </div>
      <div data-block="saveCode"></div>
      <p class="muted" data-bind="codeMessage"></p>
    </section>
    <section class="card">
      <h2>重新開始</h2>
      <p>刪掉目前的存檔，從 22 歲重新來過。</p>
      <button class="btn btn-block btn-danger" data-action="restart">重新開始</button>
    </section>
    <section class="card">
      <h2>關於</h2>
      <p>上班模擬器（Office Life Simulator）v0.1 開發中</p>
      <p class="muted">離開遊戲時時間照樣會走（最多 1 年），回來會看到「你不在的時候」。按暫停再離開，時間就不會走。</p>
      ${ctl.debug ? '<p class="muted">除錯模式已開啟：底部的 🐞 是除錯面板。</p>' : ''}
    </section>`;
}

export const binds = {
  savedAt: ({ ctl }) => {
    if (ctl.saveFailed) return '存檔失敗，瀏覽器可能封鎖了儲存空間';
    return ctl.lastSavedAt ? new Date(ctl.lastSavedAt).toLocaleTimeString('zh-TW') : '還沒存過';
  },
  codeMessage: () => message,
};

export const blocks = {
  saveCode: () => {
    if (mode === 'export') {
      return `
        <textarea class="input code" readonly aria-label="存檔碼">${esc(code)}</textarea>
        <button class="btn btn-block btn-primary" data-action="copyCode">複製存檔碼</button>`;
    }
    if (mode === 'import') {
      return `
        <textarea class="input code" id="import-code" placeholder="把存檔碼貼在這裡（LS1: 開頭）" aria-label="貼上存檔碼"></textarea>
        <button class="btn btn-block btn-primary" data-action="importCode">匯入</button>`;
    }
    return '';
  },
};

export const actions = {
  exportCode: (_, ctl) => {
    mode = 'export';
    code = ctl.exportCode();
    message = '這串文字就是你的存檔，複製起來存到記事本或傳給自己。';
  },
  copyCode: () => {
    navigator.clipboard?.writeText(code).then(
      () => (message = '已複製到剪貼簿。'),
      () => (message = '沒辦法自動複製，請長按上面的文字全選後複製。'),
    );
  },
  importOpen: () => {
    mode = 'import';
    message = '匯入後，目前的存檔會被覆蓋。';
  },
  importCode: (_, ctl) => {
    const value = document.getElementById('import-code')?.value ?? '';
    try {
      decodeSaveCode(value); // 先確認存檔碼正確，再問要不要覆蓋
    } catch (e) {
      message = e.message;
      return;
    }
    if (!confirm('目前的存檔會被覆蓋，確定要匯入嗎？')) return;
    message = '';
    ctl.importCode(value);
  },
};
