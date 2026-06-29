<script setup lang="ts">
interface Option {
  value: string;
  label: string;
}
defineProps<{ options: Option[]; modelValue: string; allLabel: string }>();
defineEmits<{ "update:modelValue": [value: string] }>();
</script>

<template>
  <div class="filter">
    <button
      class="chip"
      :class="{ active: modelValue === 'all' }"
      @click="$emit('update:modelValue', 'all')"
    >
      {{ allLabel }}
    </button>
    <button
      v-for="opt in options"
      :key="opt.value"
      class="chip"
      :class="{ active: modelValue === opt.value }"
      @click="$emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<style scoped>
.filter {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.chip {
  border: 1px solid var(--border);
  background: var(--card-bg);
  color: var(--text-dim);
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s ease;
}
.chip:hover {
  border-color: var(--accent);
  color: var(--text);
}
.chip.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}
</style>
