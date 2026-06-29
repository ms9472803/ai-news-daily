# 每日 AI 新知 · AI News Daily

每天自動搜集多個公開 RSS 來源的最新 AI 文章，並以 **Vue 3 + Vite** 製作的單頁網站呈現。
無需後端、無需 API key，可直接部署為靜態網站。

> 靈感與工作流來自 [gnhf](https://github.com/kunchenguid/gnhf)（Good Night, Have Fun）—
> 一個讓 coding agent 在你睡覺時自主迭代專案的工具。詳見 [`gnhf.objective.md`](./gnhf.objective.md)。

## 功能

- 🗞️ 從 Hugging Face、OpenAI、Google AI、MIT Tech Review、The Verge、TechCrunch、Ars Technica、arXiv cs.AI 等來源搜集
- 🔍 即時搜尋（標題 / 摘要）、**分類分頁**與來源篩選
- ⭐ **收藏**文章（存於 localStorage）並可只看收藏
- ♾️ **無限捲動**（IntersectionObserver，每次載入 24 篇）
- 🌙 深色 / 淺色主題（記住偏好、跟隨系統）
- 🌐 **多國語**（English / 繁中 / 简中 / 日本語）— 預設語言依瀏覽器設定自動判斷,可手動切換並記憶（vue-i18n）
- 🤖 GitHub Actions 每日 cron 自動更新並部署到 GitHub Pages
- 📦 純靜態：抓取在 build 時完成，前端只讀 `news.json`

## 架構

```
feeds.config.json ─┐
                   │  npm run fetch-news (Node 內建 fetch + 自製 RSS/Atom 解析)
                   ▼
            public/news.json ──► Vue 前端 (useNews composable) ──► 卡片列表
```

抓取邏輯在 `scripts/fetch-news.mjs`：抓取 → 解析 → 去重 → 依時間排序 → 寫入 `public/news.json`。

## 開發

```bash
cd ai-news-daily
npm install

# 1. 先搜集一次資料（產生 public/news.json）
npm run fetch-news

# 2. 啟動開發伺服器
npm run dev

# 產出靜態檔
npm run build && npm run preview
```

## 每日自動更新

`.github/workflows/daily-news.yml` 會在每天 UTC 00:00（台北 08:00）執行：
重新搜集 → build → 部署到 GitHub Pages。也可在 Actions 頁面手動觸發。

> 部署到 `https://<user>.github.io/<repo>/` 時，workflow 已自動把 `BASE_PATH`
> 設為 `/<repo>/`；前端透過 `import.meta.env.BASE_URL` 正確載入 `news.json`。

## 新增來源

編輯 `feeds.config.json`，加入一筆 `{ "name", "url", "category" }` 即可，
解析器同時支援 RSS 與 Atom。

## 技術棧

Vue 3 (`<script setup>`) · TypeScript · Vite 6 · 零執行期依賴的自製 RSS 解析器
