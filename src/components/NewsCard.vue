<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { NewsItem } from "../types";

const props = defineProps<{ item: NewsItem; favorite: boolean }>();
defineEmits<{ toggleFavorite: [link: string] }>();

const { t, locale } = useI18n();

const dateLabel = computed(() => {
  if (!props.item.publishedAt) return t("card.unknownDate");
  const d = new Date(props.item.publishedAt);
  const now = Date.now();
  const diffH = Math.round((now - d.getTime()) / 3_600_000);
  if (diffH < 1) return t("card.justNow");
  if (diffH < 24) return t("card.hoursAgo", { n: diffH });
  const diffD = Math.round(diffH / 24);
  if (diffD < 7) return t("card.daysAgo", { n: diffD });
  return d.toLocaleDateString(locale.value, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
});

const host = computed(() => {
  try {
    return new URL(props.item.link).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
});
</script>

<template>
  <article class="card">
    <div class="card-meta">
      <span class="badge">{{ item.source }}</span>
      <span class="category">{{ item.category }}</span>
      <span class="dot">·</span>
      <time>{{ dateLabel }}</time>
      <button
        class="fav"
        :class="{ active: favorite }"
        :aria-label="favorite ? t('card.unfav') : t('card.fav')"
        :title="favorite ? t('card.unfav') : t('card.fav')"
        @click="$emit('toggleFavorite', item.link)"
      >
        {{ favorite ? "★" : "☆" }}
      </button>
    </div>
    <h2 class="card-title">
      <a :href="item.link" target="_blank" rel="noopener noreferrer">
        {{ item.title }}
      </a>
    </h2>
    <p v-if="item.summary" class="card-summary">{{ item.summary }}</p>
    <a class="card-link" :href="item.link" target="_blank" rel="noopener noreferrer">
      {{ host }} ↗
    </a>
  </article>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 1.25rem;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 14px;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    border-color 0.15s ease;
}
.card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px var(--shadow);
  border-color: var(--accent);
}
.card-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.78rem;
  color: var(--text-dim);
  flex-wrap: wrap;
}
.badge {
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 600;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
}
.category {
  opacity: 0.8;
}
.dot {
  opacity: 0.5;
}
.fav {
  margin-left: auto;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 1.05rem;
  line-height: 1;
  color: var(--text-dim);
  padding: 0.1rem 0.2rem;
  transition:
    color 0.15s ease,
    transform 0.15s ease;
}
.fav:hover {
  transform: scale(1.2);
  color: #f5a623;
}
.fav.active {
  color: #f5a623;
}
.card-title {
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.4;
  font-weight: 650;
}
.card-title a {
  color: var(--text);
  text-decoration: none;
}
.card-title a:hover {
  color: var(--accent);
}
.card-summary {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--text-dim);
}
.card-link {
  margin-top: auto;
  font-size: 0.8rem;
  color: var(--accent);
  text-decoration: none;
}
.card-link:hover {
  text-decoration: underline;
}
</style>
