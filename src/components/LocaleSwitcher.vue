<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { SUPPORTED, LOCALE_NAMES, persistLocale, type Locale } from '../i18n'

const { locale, t } = useI18n()

function onChange(e: Event) {
  const value = (e.target as HTMLSelectElement).value as Locale
  locale.value = value
  persistLocale(value)
}
</script>

<template>
  <label class="switcher" :title="t('locale.label')">
    <span class="sr-only">{{ t('locale.label') }}</span>
    <select :value="locale" @change="onChange">
      <option v-for="loc in SUPPORTED" :key="loc" :value="loc">
        {{ LOCALE_NAMES[loc] }}
      </option>
    </select>
  </label>
</template>

<style scoped>
.switcher select {
  appearance: none;
  border: 1px solid var(--border);
  background: var(--card-bg);
  color: var(--text);
  border-radius: 10px;
  height: 42px;
  padding: 0 1.8rem 0 0.8rem;
  font-size: 0.85rem;
  cursor: pointer;
  background-image: linear-gradient(45deg, transparent 50%, var(--text-dim) 50%),
    linear-gradient(135deg, var(--text-dim) 50%, transparent 50%);
  background-position: calc(100% - 16px) 18px, calc(100% - 11px) 18px;
  background-size: 5px 5px, 5px 5px;
  background-repeat: no-repeat;
}
.switcher select:focus {
  outline: none;
  border-color: var(--accent);
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
</style>
