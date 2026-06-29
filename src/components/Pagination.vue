<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ current: number; total: number }>()
const emit = defineEmits<{ change: [page: number] }>()

const { t } = useI18n()

// Build page numbers, collapsing with … when there are many: 1 … 4 5 [6] 7 8 … 12
const pages = computed<(number | '…')[]>(() => {
  const { current, total } = props
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const out: (number | '…')[] = [1]
  const lo = Math.max(2, current - 1)
  const hi = Math.min(total - 1, current + 1)
  if (lo > 2) out.push('…')
  for (let p = lo; p <= hi; p++) out.push(p)
  if (hi < total - 1) out.push('…')
  out.push(total)
  return out
})

function go(p: number) {
  if (p >= 1 && p <= props.total && p !== props.current) emit('change', p)
}
</script>

<template>
  <nav v-if="total > 1" class="pager" :aria-label="t('pager.label')">
    <button class="pg" :disabled="current === 1" @click="go(current - 1)">
      {{ t('pager.prev') }}
    </button>
    <button
      v-for="(p, i) in pages"
      :key="i"
      class="pg num"
      :class="{ active: p === current, gap: p === '…' }"
      :disabled="p === '…'"
      @click="typeof p === 'number' && go(p)"
    >
      {{ p }}
    </button>
    <button class="pg" :disabled="current === total" @click="go(current + 1)">
      {{ t('pager.next') }}
    </button>
  </nav>
</template>

<style scoped>
.pager {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.4rem;
  margin-top: 2rem;
}
.pg {
  border: 1px solid var(--border);
  background: var(--card-bg);
  color: var(--text);
  border-radius: 9px;
  padding: 0.45rem 0.7rem;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s ease;
}
.pg.num {
  min-width: 2.4rem;
}
.pg:hover:not(:disabled):not(.active) {
  border-color: var(--accent);
  color: var(--accent);
}
.pg.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
  cursor: default;
}
.pg.gap {
  border: none;
  background: none;
  cursor: default;
}
.pg:disabled:not(.active):not(.gap) {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
