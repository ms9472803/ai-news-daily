import { computed, ref, watch, onMounted } from 'vue'
import type { NewsFeed, NewsItem } from '../types'

const FAV_KEY = 'ainews-favorites'
const SEARCH_KEY = 'ainews-search-history'
const PAGE_SIZE_KEY = 'ainews-page-size'
const MAX_HISTORY = 5
const DEFAULT_PAGE_SIZE = 30
const MAX_PAGE_SIZE = 200 // == MAX_ITEMS in fetch-news.mjs; beyond this shows everything
export const PAGE_SIZE_PRESETS = [10, 20, 30] as const

function loadPageSize(): number {
  const raw = Number(localStorage.getItem(PAGE_SIZE_KEY))
  if (Number.isInteger(raw) && raw >= 1 && raw <= MAX_PAGE_SIZE) return raw
  return DEFAULT_PAGE_SIZE
}

// Topic quick-filters: match keywords against title + summary (case-insensitive).
// `id` is a stable key (unchanged across languages); display names come from i18n topics.<id>.
export const TOPICS: { id: string; match: string[] }[] = [
  { id: 'claude', match: ['claude', 'anthropic', 'opus', 'sonnet', 'haiku'] },
  { id: 'openai', match: ['openai', 'gpt', 'chatgpt'] },
  { id: 'gemini', match: ['gemini', 'deepmind', 'google'] },
  { id: 'llama', match: ['llama', 'meta ai'] },
  { id: 'opensource', match: ['open-source', 'open source', 'open weight', 'open-weight'] },
  { id: 'agent', match: ['agent', 'agentic'] },
  { id: 'multimodal', match: ['multimodal', 'multi-modal', 'computer vision', 'vision-language', 'vision model', 'image generation', 'text-to-image', 'vlm'] },
  { id: 'reasoning', match: ['reasoning', 'chain-of-thought', 'chain of thought', 'inference-time', 'thinking model'] },
  { id: 'mistral', match: ['mistral', 'mixtral'] },
]

function loadFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(FAV_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(SEARCH_KEY)
    const arr = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(arr)
      ? arr.filter((t): t is string => typeof t === 'string').slice(0, MAX_HISTORY)
      : []
  } catch {
    return []
  }
}

export function useNews() {
  const feed = ref<NewsFeed | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  const search = ref('')
  const activeSource = ref<string>('all')
  const activeCategory = ref<string>('all')
  const activeTopic = ref<string>('all')
  const favoritesOnly = ref(false)

  // Search history (most recent first, max MAX_HISTORY, persisted in localStorage)
  const searchHistory = ref<string[]>(loadHistory())
  function persistHistory() {
    localStorage.setItem(SEARCH_KEY, JSON.stringify(searchHistory.value))
  }
  function addSearchTerm(raw: string) {
    const term = raw.trim()
    if (!term) return
    searchHistory.value = [
      term,
      ...searchHistory.value.filter((t) => t !== term),
    ].slice(0, MAX_HISTORY)
    persistHistory()
  }
  function removeSearchTerm(term: string) {
    searchHistory.value = searchHistory.value.filter((t) => t !== term)
    persistHistory()
  }
  function clearSearchHistory() {
    searchHistory.value = []
    persistHistory()
  }

  // Favorites (keyed by link, persisted in localStorage)
  const favorites = ref<Set<string>>(loadFavorites())
  function isFavorite(link: string) {
    return favorites.value.has(link)
  }
  function toggleFavorite(link: string) {
    const next = new Set(favorites.value)
    if (next.has(link)) next.delete(link)
    else next.add(link)
    favorites.value = next
    localStorage.setItem(FAV_KEY, JSON.stringify([...next]))
  }

  async function load() {
    loading.value = true
    error.value = null
    try {
      // public/news.json is served at the site root; use BASE_URL to support subpath deploys.
      const res = await fetch(`${import.meta.env.BASE_URL}news.json`, {
        cache: 'no-cache',
      })
      if (!res.ok) throw new Error(`載入失敗 (HTTP ${res.status})`)
      feed.value = (await res.json()) as NewsFeed
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      loading.value = false
    }
  }

  const sources = computed<string[]>(() => {
    if (!feed.value) return []
    return [...new Set(feed.value.items.map((i) => i.source))].sort()
  })

  const categories = computed<string[]>(() => {
    if (!feed.value) return []
    return [...new Set(feed.value.items.map((i) => i.category))].sort()
  })

  const topicIds = computed(() => TOPICS.map((t) => t.id))
  const favoriteCount = computed(() => favorites.value.size)

  const filtered = computed<NewsItem[]>(() => {
    if (!feed.value) return []
    const q = search.value.trim().toLowerCase()
    const topic = TOPICS.find((t) => t.id === activeTopic.value)
    return feed.value.items.filter((item) => {
      const matchSource =
        activeSource.value === 'all' || item.source === activeSource.value
      const matchCategory =
        activeCategory.value === 'all' || item.category === activeCategory.value
      const matchFav = !favoritesOnly.value || favorites.value.has(item.link)
      const haystack = (item.title + ' ' + item.summary).toLowerCase()
      const matchTopic = !topic || topic.match.some((k) => haystack.includes(k))
      const matchQuery = !q || haystack.includes(q)
      return matchSource && matchCategory && matchFav && matchTopic && matchQuery
    })
  })

  // Pagination: user-configurable page size (persisted in localStorage)
  const pageSize = ref(loadPageSize())
  function setPageSize(n: number) {
    const v = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(n || 0)))
    pageSize.value = v
    localStorage.setItem(PAGE_SIZE_KEY, String(v))
  }

  const currentPage = ref(1)
  const totalPages = computed(() =>
    Math.max(1, Math.ceil(filtered.value.length / pageSize.value)),
  )
  const paged = computed<NewsItem[]>(() => {
    const start = (currentPage.value - 1) * pageSize.value
    return filtered.value.slice(start, start + pageSize.value)
  })
  const pageStart = computed(() =>
    filtered.value.length === 0
      ? 0
      : (currentPage.value - 1) * pageSize.value + 1,
  )
  const pageEnd = computed(() =>
    Math.min(currentPage.value * pageSize.value, filtered.value.length),
  )
  function goToPage(n: number) {
    currentPage.value = Math.min(Math.max(1, n), totalPages.value)
  }

  // Reset to the first page whenever a filter or the page size changes
  watch(
    [search, activeSource, activeCategory, activeTopic, favoritesOnly, pageSize],
    () => {
      currentPage.value = 1
    },
  )
  // Clamp back into range when fewer results push the current page out of bounds
  watch(totalPages, (tp) => {
    if (currentPage.value > tp) currentPage.value = tp
  })

  onMounted(load)

  return {
    feed,
    loading,
    error,
    search,
    searchHistory,
    addSearchTerm,
    removeSearchTerm,
    clearSearchHistory,
    activeSource,
    activeCategory,
    activeTopic,
    favoritesOnly,
    sources,
    categories,
    topicIds,
    filtered,
    paged,
    currentPage,
    totalPages,
    pageStart,
    pageEnd,
    goToPage,
    pageSize,
    setPageSize,
    favoriteCount,
    isFavorite,
    toggleFavorite,
    reload: load,
  }
}
