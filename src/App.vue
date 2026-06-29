<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useNews } from './composables/useNews'
import NewsCard from './components/NewsCard.vue'
import SourceFilter from './components/SourceFilter.vue'
import Pagination from './components/Pagination.vue'
import LocaleSwitcher from './components/LocaleSwitcher.vue'

const { t, te, locale } = useI18n()

const {
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
  favoriteCount,
  isFavorite,
  toggleFavorite,
  reload,
} = useNews()

function changePage(p: number) {
  goToPage(p)
}

// Filter options (stable values, labels follow the active language)
const topicOptions = computed(() =>
  topicIds.value.map((id) => ({ value: id, label: t(`topics.${id}`) })),
)
const categoryOptions = computed(() =>
  categories.value.map((c) => ({
    value: c,
    label: te(`category.${c}`) ? t(`category.${c}`) : c,
  })),
)
const sourceOptions = computed(() =>
  sources.value.map((s) => ({ value: s, label: s })),
)

// Keep <html lang> and the document title in sync with the active language
watchEffect(() => {
  document.documentElement.lang = locale.value
  document.title = `${t('app.title')} · AI News Daily`
})

const theme = ref<'light' | 'dark'>('light')
function applyTheme(t: 'light' | 'dark') {
  theme.value = t
  document.documentElement.dataset.theme = t
  localStorage.setItem('ainews-theme', t)
}
function toggleTheme() {
  applyTheme(theme.value === 'light' ? 'dark' : 'light')
}
onMounted(() => {
  const saved = localStorage.getItem('ainews-theme') as 'light' | 'dark' | null
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  applyTheme(saved ?? (prefersDark ? 'dark' : 'light'))
})

const updatedLabel = computed(() => {
  if (!feed.value) return ''
  return new Date(feed.value.generatedAt).toLocaleString(locale.value, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
})
</script>

<template>
  <div class="page">
    <header class="hero">
      <div class="hero-top">
        <div class="brand">
          <span class="logo">AI</span>
          <div>
            <h1>{{ t('app.title') }}</h1>
            <p class="tagline">{{ t('app.tagline') }}</p>
          </div>
        </div>
        <div class="hero-actions">
          <LocaleSwitcher />
          <button class="theme-btn" @click="toggleTheme" :title="t('theme.toggle')">
            {{ theme === 'light' ? '🌙' : '☀️' }}
          </button>
        </div>
      </div>

      <div v-if="feed" class="stats">
        <span>📰 {{ t('stats.articles', { n: feed.count }) }}</span>
        <span>🔗 {{ t('stats.sources', { n: feed.sources.length }) }}</span>
        <span>🕒 {{ t('stats.updated', { time: updatedLabel }) }}</span>
      </div>

      <div class="controls">
        <div class="search-row">
          <input
            v-model="search"
            class="search"
            type="search"
            :placeholder="'🔍 ' + t('search.placeholder')"
          />
          <button
            class="fav-toggle"
            :class="{ active: favoritesOnly }"
            @click="favoritesOnly = !favoritesOnly"
          >
            ★ {{ t('filters.favorites', { n: favoriteCount }) }}
          </button>
        </div>
        <SourceFilter :options="topicOptions" v-model="activeTopic" :all-label="t('filters.all')" />
        <SourceFilter :options="categoryOptions" v-model="activeCategory" :all-label="t('filters.all')" />
        <SourceFilter :options="sourceOptions" v-model="activeSource" :all-label="t('filters.all')" />
      </div>
    </header>

    <main>
      <div v-if="loading" class="state">{{ t('state.loading') }}</div>

      <div v-else-if="error" class="state error">
        <p>😢 {{ error }}</p>
        <p class="hint">
          <i18n-t keypath="state.errorHint">
            <template #cmd><code>npm run fetch-news</code></template>
          </i18n-t>
        </p>
        <button class="retry" @click="reload">{{ t('state.retry') }}</button>
      </div>

      <div v-else-if="filtered.length === 0" class="state">
        {{ favoritesOnly ? t('state.emptyFav') : t('state.empty') }}
      </div>

      <template v-else>
        <Pagination
          class="pager-top"
          :current="currentPage"
          :total="totalPages"
          @change="changePage"
        />
        <div class="grid">
          <NewsCard
            v-for="item in paged"
            :key="item.link"
            :item="item"
            :favorite="isFavorite(item.link)"
            @toggle-favorite="toggleFavorite"
          />
        </div>
        <Pagination
          :current="currentPage"
          :total="totalPages"
          @change="changePage"
        />
        <p class="count">
          {{ t('list.count', { start: pageStart, end: pageEnd, total: filtered.length, page: currentPage, pages: totalPages }) }}
        </p>
      </template>
    </main>

    <footer class="footer">
      <p>
        <i18n-t keypath="footer.text">
          <template #gnhf>
            <a href="https://github.com/kunchenguid/gnhf" target="_blank" rel="noopener">gnhf</a>
          </template>
        </i18n-t>
      </p>
    </footer>
  </div>
</template>

<style scoped>
.page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1.5rem 1.25rem 4rem;
}
.hero {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.5rem 0 1.75rem;
}
.hero-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}
.brand {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}
.logo {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--accent);
  color: #fff;
  font-weight: 800;
  font-size: 1.1rem;
}
h1 {
  margin: 0;
  font-size: 1.6rem;
  letter-spacing: -0.02em;
}
.tagline {
  margin: 0.15rem 0 0;
  color: var(--text-dim);
  font-size: 0.9rem;
}
.hero-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-shrink: 0;
}
.theme-btn {
  border: 1px solid var(--border);
  background: var(--card-bg);
  border-radius: 10px;
  width: 42px;
  height: 42px;
  font-size: 1.1rem;
  cursor: pointer;
}
.stats {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  font-size: 0.85rem;
  color: var(--text-dim);
}
.controls {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.search-row {
  display: flex;
  gap: 0.6rem;
}
.search {
  flex: 1;
  padding: 0.7rem 1rem;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--card-bg);
  color: var(--text);
  font-size: 0.95rem;
}
.search:focus {
  outline: none;
  border-color: var(--accent);
}
.fav-toggle {
  white-space: nowrap;
  border: 1px solid var(--border);
  background: var(--card-bg);
  color: var(--text-dim);
  border-radius: 12px;
  padding: 0 1rem;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s ease;
}
.fav-toggle:hover {
  border-color: var(--accent);
  color: var(--text);
}
.fav-toggle.active {
  background: #f5a623;
  border-color: #f5a623;
  color: #fff;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.1rem;
}
.pager-top {
  margin-top: 0.5rem;
  margin-bottom: 1.5rem;
}
.count {
  text-align: center;
  color: var(--text-dim);
  font-size: 0.8rem;
  margin-top: 0.5rem;
}
.state {
  text-align: center;
  padding: 4rem 1rem;
  color: var(--text-dim);
}
.state.error {
  color: var(--text);
}
.hint {
  font-size: 0.9rem;
  color: var(--text-dim);
}
code {
  background: var(--accent-soft);
  color: var(--accent);
  padding: 0.1rem 0.4rem;
  border-radius: 6px;
  font-size: 0.85em;
}
.retry {
  margin-top: 0.75rem;
  border: none;
  background: var(--accent);
  color: #fff;
  padding: 0.55rem 1.2rem;
  border-radius: 10px;
  cursor: pointer;
}
.footer {
  margin-top: 3rem;
  text-align: center;
  font-size: 0.8rem;
  color: var(--text-dim);
}
.footer a {
  color: var(--accent);
}
</style>
