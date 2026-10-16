# LifeSimulate（暫名：上班模擬器）

手機優先的放置型人生經營遊戲。開工前先讀 `docs/DESIGN.md`，規格以那份為準；若實作需要偏離規格，先提出來討論，同意後再回頭更新文件。

## 開發原則

- 純前端：HTML + CSS + 原生 JavaScript（ES modules），不用框架、不用 build 工具
- 手機直式優先：可點擊元素至少 44px，常用操作放畫面下半部，不依賴 hover
- 介面文字一律繁體中文
- 遊戲內容（事件、職缺、課程、活動、NPC）放在 `src/data/`，邏輯程式不寫死內容
- 數值平衡用的常數集中在 `src/data/balance.js`，方便調整
- 存檔放 localStorage，存檔物件要帶 `version`，格式變動時寫遷移函式
- 註解只寫重點，一個決策最多一行
- 每個版本都要能獨立遊玩，不要一次做多個版本的功能

## 本機執行

ES modules 不能直接用 file:// 開啟，要起本機伺服器：

```bash
npx serve .
```
