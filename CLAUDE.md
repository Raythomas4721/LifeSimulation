# 上班模擬器（Office Life Simulator）

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

## 工作流程

- **不開新分支**：都在 `feat/m1-core` 上開發，用 commit 區分里程碑；要合併進 `main` 時由使用者在 GitHub 開 PR（沒有 `gh` 時給網頁連結）
- **先給使用者看，同意後才 commit**：做完一個里程碑先回報給使用者試玩，使用者說可以才 commit，commit 後接著 push
- **里程碑開工前先寫規格**：DESIGN.md 只有大綱的部分，先把細節與數值寫進對應章節給使用者看；做的過程中補的決定也要寫回 DESIGN.md
- commit 訊息用繁體中文，第一行寫「里程碑＋重點」，下面條列改了什麼
- 改完數值先跑 `node tools/simulate.js 20` 看平衡；畫面改動用瀏覽器實際點過，測試前先備份 localStorage 的存檔（`lifesim.save`），測完還原

## 目前進度

完成一個里程碑就更新這裡。

- v0.1（M1～M4）、v0.2（M5～M7）完成，都在 `feat/m1-core`；`main` 合併到 M4
- v0.3 已規劃（DESIGN.md §15：M8 產業與學歷、M9 生活與消費、M10 求職、M11 公務員與裸辭），下一步是 M8

## 本機執行

ES modules 不能直接用 file:// 開啟，要起本機伺服器：

```bash
npx serve .
```

手機版是 PWA：改了任何遊戲檔案、要推上 GitHub 前，先跑 `node tools/update-sw.js` 更新 service worker 的快取清單與版本號（見 DESIGN.md §14.5），否則玩家會一直拿到舊檔。
