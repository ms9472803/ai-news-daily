import { computed, ref, watch, onMounted } from 'vue'
import type { NewsFeed, NewsItem } from '../types'

const FAV_KEY = 'ainews-favorites'
const PAGE_SIZE = 30

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

export function useNews() {
  const feed = ref<NewsFeed | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  const search = ref('')
  const activeSource = ref<string>('all')
  const activeCategory = ref<string>('all')
  const activeTopic = ref<string>('all')
  const favoritesOnly = ref(false)

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

  // Pagination: PAGE_SIZE items per page
  const currentPage = ref(1)
  const totalPages = computed(() =>
    Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)),
  )
  const paged = computed<NewsItem[]>(() => {
    const start = (currentPage.value - 1) * PAGE_SIZE
    return filtered.value.slice(start, start + PAGE_SIZE)
  })
  const pageStart = computed(() =>
    filtered.value.length === 0 ? 0 : (currentPage.value - 1) * PAGE_SIZE + 1,
  )
  const pageEnd = computed(() =>
    Math.min(currentPage.value * PAGE_SIZE, filtered.value.length),
  )
  function goToPage(n: number) {
    currentPage.value = Math.min(Math.max(1, n), totalPages.value)
  }

  // Reset to the first page whenever any filter changes
  watch([search, activeSource, activeCategory, activeTopic, favoritesOnly], () => {
    currentPage.value = 1
  })
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
    pageSize: PAGE_SIZE,
    favoriteCount,
    isFavorite,
    toggleFavorite,
    reload: load,
  }
}
