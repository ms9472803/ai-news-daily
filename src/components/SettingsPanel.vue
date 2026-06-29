<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { PAGE_SIZE_PRESETS } from "../composables/useNews";

const props = defineProps<{ pageSize: number }>();
const emit = defineEmits<{ "update:pageSize": [n: number]; close: [] }>();
const { t } = useI18n();

const presets = PAGE_SIZE_PRESETS;
const isPreset = (n: number) => (presets as readonly number[]).includes(n);

const mode = ref<"preset" | "custom">(isPreset(props.pageSize) ? "preset" : "custom");
const customValue = ref<number>(props.pageSize);
const customInput = ref<HTMLInputElement | null>(null);

const customActive = computed(() => mode.value === "custom");

function selectPreset(n: number) {
  mode.value = "preset";
  emit("update:pageSize", n);
}
async function chooseCustom() {
  mode.value = "custom";
  await nextTick();
  customInput.value?.focus();
}
function applyCustom() {
  const v = Math.min(200, Math.max(1, Math.floor(Number(customValue.value) || 0)));
  customValue.value = v;
  emit("update:pageSize", v);
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") emit("close");
}
onMounted(() => window.addEventListener("keydown", onKeydown));
onUnmounted(() => window.removeEventListener("keydown", onKeydown));
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="dialog" role="dialog" aria-modal="true">
      <header class="dialog-head">
        <h2>{{ t("settings.title") }}</h2>
        <button class="close" :aria-label="t('settings.close')" @click="emit('close')">×</button>
      </header>

      <section class="field">
        <label class="field-label">{{ t("settings.itemsPerPage") }}</label>
        <div class="chips">
          <button
            v-for="n in presets"
            :key="n"
            class="chip"
            :class="{ active: mode === 'preset' && pageSize === n }"
            @click="selectPreset(n)"
          >
            {{ n }}
          </button>
          <button class="chip" :class="{ active: customActive }" @click="chooseCustom">
            {{ t("settings.custom") }}
          </button>
        </div>
        <input
          v-if="customActive"
          ref="customInput"
          v-model.number="customValue"
          class="custom-input"
          type="number"
          min="1"
          max="200"
          inputmode="numeric"
          @change="applyCustom"
        />
      </section>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.45);
}
.dialog {
  width: 100%;
  max-width: 420px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 20px 60px var(--shadow);
  overflow: hidden;
}
.dialog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border);
}
.dialog-head h2 {
  margin: 0;
  font-size: 1.1rem;
}
.close {
  border: none;
  background: none;
  color: var(--text-dim);
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 0.25rem;
}
.close:hover {
  color: var(--text);
}
.field {
  padding: 1.25rem;
}
.field-label {
  display: block;
  font-size: 0.85rem;
  color: var(--text-dim);
  margin-bottom: 0.6rem;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.chip {
  border: 1px solid var(--border);
  background: var(--card-bg);
  color: var(--text-dim);
  padding: 0.45rem 1rem;
  border-radius: 999px;
  font-size: 0.9rem;
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
.custom-input {
  margin-top: 0.75rem;
  width: 120px;
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg);
  color: var(--text);
  font-size: 0.95rem;
}
.custom-input:focus {
  outline: none;
  border-color: var(--accent);
}
</style>
