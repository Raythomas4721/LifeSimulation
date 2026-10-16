# 上班模擬器（Office Life Simulator）

從新人開始上班，薪水自己會進帳；你要決定下班後的時間怎麼用：加班、進修、參加活動、約會，或回家睡覺。一路轉職、升遷、談戀愛，直到退休或財富自由。

- 設計文件：[docs/DESIGN.md](docs/DESIGN.md)
- 目前進度：v0.1 開發中（M1 核心）

## 本機執行

ES modules 不能直接用 file:// 開啟，要起本機伺服器：

```bash
npx serve .
```

打開終端機顯示的網址（通常是 http://localhost:3000）。

- **除錯面板**：網址後面加上 `?debug`，例如 http://localhost:3000/?debug，底部分頁列會多一個 🐞
- **平衡模擬**：`node tools/simulate.js [年數] [種子]`，比較不同加班策略的表現、體力與存款

## 部署

用 GitHub Pages 部署：repo 的 Settings → Pages → Source 選「Deploy from a branch」，Branch 選 `main`、資料夾選 `/ (root)`。之後推上 main 就會自動更新。
