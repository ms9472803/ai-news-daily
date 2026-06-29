# gnhf 目標檔

本專案可用 [gnhf](https://github.com/kunchenguid/gnhf)（Good Night, Have Fun）
這個自主 agent loop 工具，在你睡覺時持續迭代改進。

## 安裝

```bash
npm install -g gnhf
```

## 建議的 objective

在 `ai-news-daily/` 目錄下執行，讓 agent 一次做一個小而完整的改動：

```bash
gnhf "持續改進這個 Vue AI 新知網站：新增實用的 RSS 來源、\
增進前端 UX（無限捲動、依分類分頁、收藏功能）、\
強化 fetch-news.mjs 的解析穩定度與錯誤處理，\
並為新功能補上測試。每次迭代只做一個小改動並 commit。" \
  --worktree --push
```

## 常用旗標

- `--worktree`：在獨立 git worktree 執行，可多個 agent 平行跑。
- `--current-branch`：直接在目前分支上即時更新。
- `--push`：完成後自動推送。

每次迭代 gnhf 會 commit 一個小改動並寫下 iteration log，
隔天早上即可在分支看到乾淨、可追溯的成果。
