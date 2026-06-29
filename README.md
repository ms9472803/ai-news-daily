# AI News Daily

Automatically collects the latest AI articles from multiple public RSS/Atom feeds
and presents them in a single-page app built with **Vue 3 + Vite**. No backend and
no API key — it deploys as a fully static site.

Live demo: **https://ms9472803.github.io/ai-news-daily/**

> Inspired by the workflow of [gnhf](https://github.com/kunchenguid/gnhf)
> (Good Night, Have Fun) — a tool that lets a coding agent iterate on a project
> autonomously while you sleep. See [`gnhf.objective.md`](./gnhf.objective.md).

## Features

- 🗞️ Collects from Hugging Face, OpenAI, Google AI, MIT Tech Review, The Verge,
  TechCrunch, Ars Technica, smol.ai, Simon Willison, and arXiv cs.AI
- 🔍 Live search (title / summary) plus topic, category, and source filters
- ⭐ Favorites (stored in `localStorage`) with a favorites-only view
- 📄 Pagination — 30 items per page, with pagers at the top and bottom
- 🌙 Light / dark theme (remembers your choice, follows the system)
- 🌐 Internationalization (English / 繁體中文 / 简体中文 / 日本語) — the default
  language is detected from the browser, can be switched manually, and is remembered
  (vue-i18n)
- 🤖 A daily GitHub Actions cron re-fetches and deploys to GitHub Pages
- 📦 Fully static: fetching happens at build time; the frontend only reads `news.json`

## Architecture

```
feeds.config.json ─┐
                   │  npm run fetch-news (Node built-in fetch + custom RSS/Atom parser)
                   ▼
            public/news.json ──► Vue frontend (useNews composable) ──► card list
```

The collection logic lives in `scripts/fetch-news.mjs`:
fetch → parse → dedupe → sort by date → write `public/news.json`.
It caps each source (so no single feed floods the feed) and filters out
low-signal items (e.g. smol.ai's daily "not much happened today").

## Development

This project uses [pnpm](https://pnpm.io/).

```bash
git clone git@github.com:ms9472803/ai-news-daily.git
cd ai-news-daily
pnpm install

# 1. Collect data once (generates public/news.json)
pnpm fetch-news

# 2. Start the dev server
pnpm dev

# Produce a static build
pnpm build && pnpm preview
```

## Daily updates

`.github/workflows/daily-news.yml` runs every day at 00:00 UTC (08:00 Taipei):
re-fetch → build → deploy to GitHub Pages. It can also be triggered manually from
the Actions tab.

To enable it once: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

> When deploying to `https://<user>.github.io/<repo>/`, the workflow sets
> `BASE_PATH` to `/<repo>/` automatically, and the frontend loads `news.json`
> correctly via `import.meta.env.BASE_URL`.

## Adding a source

Edit `feeds.config.json` and add an entry `{ "name", "url", "category" }`.
The parser supports both RSS and Atom.

## Topic filters

Topic quick-filters live in `src/composables/useNews.ts` (`TOPICS`). Each topic has
a stable `id` and a list of keywords matched against the title and summary; display
names come from the i18n `topics.<id>` messages.

## Tech stack

Vue 3 (`<script setup>`) · TypeScript · Vite 6 · vue-i18n · a dependency-free
custom RSS/Atom parser
