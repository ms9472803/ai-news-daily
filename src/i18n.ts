import { createI18n } from "vue-i18n";

export const SUPPORTED = ["en", "zh-Hant", "zh-Hans", "ja"] as const;
export type Locale = (typeof SUPPORTED)[number];

// Native display names for each locale (used by the language switcher)
export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  "zh-Hant": "繁體中文",
  "zh-Hans": "简体中文",
  ja: "日本語",
};

const STORE_KEY = "ainews-locale";

/** Map a browser language tag to one of the supported locales */
function normalize(tag: string): Locale | null {
  const t = tag.toLowerCase();
  if (t.startsWith("en")) return "en";
  if (t.startsWith("ja")) return "ja";
  if (t.startsWith("zh")) {
    // zh-tw / zh-hk / zh-hant → Traditional; other zh-* → Simplified
    if (/hant|tw|hk|mo/.test(t)) return "zh-Hant";
    return "zh-Hans";
  }
  return null;
}

/** Resolve the default locale: saved choice > browser setting > en */
export function detectLocale(): Locale {
  const saved = localStorage.getItem(STORE_KEY);
  if (saved && (SUPPORTED as readonly string[]).includes(saved)) {
    return saved as Locale;
  }
  const candidates = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const tag of candidates) {
    const loc = normalize(tag);
    if (loc) return loc;
  }
  return "en";
}

export function persistLocale(locale: Locale) {
  localStorage.setItem(STORE_KEY, locale);
}

const messages = {
  en: {
    app: {
      title: "AI Daily",
      tagline: "Auto-curated latest AI news from multiple sources",
    },
    stats: {
      articles: "{n} articles",
      sources: "{n} sources",
      updated: "Updated {time}",
    },
    search: {
      placeholder: "Search title or content…",
      recent: "Recent searches",
      removeOne: "Remove this search",
      clear: "Clear all",
    },
    filters: { all: "All", favorites: "Favorites ({n})" },
    state: {
      loading: "Loading…",
      errorHint: "No data yet? Run {cmd} first to collect today’s AI news.",
      retry: "Reload",
      emptyFav: "No favorites yet. Tap the ☆ on a card to save it.",
      empty: "No articles match your filters.",
    },
    list: { count: "{start}–{end} of {total} · page {page}/{pages}" },
    card: {
      fav: "Add to favorites",
      unfav: "Remove from favorites",
      justNow: "just now",
      hoursAgo: "{n}h ago",
      daysAgo: "{n}d ago",
      unknownDate: "Date unknown",
    },
    pager: { prev: "‹ Prev", next: "Next ›", label: "Pagination" },
    theme: { toggle: "Toggle theme" },
    settings: {
      open: "Settings",
      title: "Settings",
      close: "Close",
      itemsPerPage: "Items per page",
      custom: "Custom",
    },
    footer: { text: "Auto-collected daily from public RSS feeds · Built with Vue 3 + Vite" },
    backtotop: { label: "Back to top" },
    category: { Research: "Research", Industry: "Industry", Media: "Media" },
    topics: {
      claude: "Claude / Anthropic",
      openai: "OpenAI / GPT",
      gemini: "Gemini / Google",
      llama: "Llama / Meta",
      opensource: "Open Source",
      agent: "Agent",
      multimodal: "Multimodal / Vision",
      reasoning: "Reasoning",
      mistral: "Mistral",
    },
    locale: { label: "Language" },
  },
  "zh-Hant": {
    app: {
      title: "AI 每日新知",
      tagline: "自動匯整多個來源的最新人工智慧消息",
    },
    stats: {
      articles: "{n} 篇文章",
      sources: "{n} 個來源",
      updated: "更新於 {time}",
    },
    search: {
      placeholder: "搜尋標題或內容…",
      recent: "最近搜尋",
      removeOne: "刪除此搜尋",
      clear: "全部清除",
    },
    filters: { all: "全部", favorites: "收藏 ({n})" },
    state: {
      loading: "載入中…",
      errorHint: "尚未產生資料？請先執行 {cmd} 來搜集今天的 AI 新知。",
      retry: "重新載入",
      emptyFav: "還沒有收藏任何文章。點卡片上的 ☆ 來收藏。",
      empty: "沒有符合條件的文章。",
    },
    list: { count: "第 {start}–{end} 篇，共 {total} 篇 · 第 {page} / {pages} 頁" },
    card: {
      fav: "收藏",
      unfav: "取消收藏",
      justNow: "剛剛",
      hoursAgo: "{n} 小時前",
      daysAgo: "{n} 天前",
      unknownDate: "日期未知",
    },
    pager: { prev: "‹ 上一頁", next: "下一頁 ›", label: "分頁" },
    theme: { toggle: "切換主題" },
    settings: {
      open: "設定",
      title: "設定",
      close: "關閉",
      itemsPerPage: "每頁顯示數量",
      custom: "自訂",
    },
    footer: { text: "資料由公開 RSS feed 每日自動搜集 · 以 Vue 3 + Vite 製作" },
    backtotop: { label: "回到頂部" },
    category: { Research: "研究", Industry: "產業", Media: "媒體" },
    topics: {
      claude: "Claude / Anthropic",
      openai: "OpenAI / GPT",
      gemini: "Gemini / Google",
      llama: "Llama / Meta",
      opensource: "開源",
      agent: "Agent",
      multimodal: "多模態 / 視覺",
      reasoning: "推理",
      mistral: "Mistral",
    },
    locale: { label: "語言" },
  },
  "zh-Hans": {
    app: {
      title: "AI 每日新知",
      tagline: "自动汇整多个来源的最新人工智能消息",
    },
    stats: {
      articles: "{n} 篇文章",
      sources: "{n} 个来源",
      updated: "更新于 {time}",
    },
    search: {
      placeholder: "搜索标题或内容…",
      recent: "最近搜索",
      removeOne: "删除此搜索",
      clear: "全部清除",
    },
    filters: { all: "全部", favorites: "收藏 ({n})" },
    state: {
      loading: "加载中…",
      errorHint: "尚未生成数据？请先执行 {cmd} 来搜集今天的 AI 新知。",
      retry: "重新加载",
      emptyFav: "还没有收藏任何文章。点卡片上的 ☆ 来收藏。",
      empty: "没有符合条件的文章。",
    },
    list: { count: "第 {start}–{end} 篇，共 {total} 篇 · 第 {page} / {pages} 页" },
    card: {
      fav: "收藏",
      unfav: "取消收藏",
      justNow: "刚刚",
      hoursAgo: "{n} 小时前",
      daysAgo: "{n} 天前",
      unknownDate: "日期未知",
    },
    pager: { prev: "‹ 上一页", next: "下一页 ›", label: "分页" },
    theme: { toggle: "切换主题" },
    settings: {
      open: "设置",
      title: "设置",
      close: "关闭",
      itemsPerPage: "每页显示数量",
      custom: "自定义",
    },
    footer: { text: "数据由公开 RSS feed 每日自动搜集 · 以 Vue 3 + Vite 制作" },
    backtotop: { label: "回到顶部" },
    category: { Research: "研究", Industry: "产业", Media: "媒体" },
    topics: {
      claude: "Claude / Anthropic",
      openai: "OpenAI / GPT",
      gemini: "Gemini / Google",
      llama: "Llama / Meta",
      opensource: "开源",
      agent: "Agent",
      multimodal: "多模态 / 视觉",
      reasoning: "推理",
      mistral: "Mistral",
    },
    locale: { label: "语言" },
  },
  ja: {
    app: {
      title: "AI デイリー",
      tagline: "複数のソースから最新の AI ニュースを自動収集",
    },
    stats: {
      articles: "{n} 件の記事",
      sources: "{n} 件のソース",
      updated: "更新: {time}",
    },
    search: {
      placeholder: "タイトルや内容を検索…",
      recent: "最近の検索",
      removeOne: "この検索を削除",
      clear: "すべて消去",
    },
    filters: { all: "すべて", favorites: "お気に入り ({n})" },
    state: {
      loading: "読み込み中…",
      errorHint:
        "データがまだありません。まず {cmd} を実行して今日の AI ニュースを収集してください。",
      retry: "再読み込み",
      emptyFav: "お気に入りはまだありません。カードの ☆ をタップして保存できます。",
      empty: "条件に一致する記事がありません。",
    },
    list: { count: "{total} 件中 {start}–{end} 件 · {page}/{pages} ページ" },
    card: {
      fav: "お気に入りに追加",
      unfav: "お気に入りから削除",
      justNow: "たった今",
      hoursAgo: "{n} 時間前",
      daysAgo: "{n} 日前",
      unknownDate: "日付不明",
    },
    pager: { prev: "‹ 前へ", next: "次へ ›", label: "ページ送り" },
    theme: { toggle: "テーマ切り替え" },
    settings: {
      open: "設定",
      title: "設定",
      close: "閉じる",
      itemsPerPage: "1ページの表示件数",
      custom: "カスタム",
    },
    footer: { text: "公開 RSS フィードから毎日自動収集 · Vue 3 + Vite 製" },
    backtotop: { label: "トップへ戻る" },
    category: { Research: "研究", Industry: "業界", Media: "メディア" },
    topics: {
      claude: "Claude / Anthropic",
      openai: "OpenAI / GPT",
      gemini: "Gemini / Google",
      llama: "Llama / Meta",
      opensource: "オープンソース",
      agent: "エージェント",
      multimodal: "マルチモーダル / ビジョン",
      reasoning: "推論",
      mistral: "Mistral",
    },
    locale: { label: "言語" },
  },
};

export const i18n = createI18n({
  legacy: false,
  locale: detectLocale(),
  fallbackLocale: "en",
  messages,
});
