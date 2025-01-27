<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getDailyInspiration, refreshInspiration } from '../services/inspirationService'

const { t, locale } = useI18n()
const inspiration = ref('')
const isRefreshing = ref(false)

const fetchInspiration = async () => {
  inspiration.value = await getDailyInspiration(locale.value)
}

const handleRefresh = async () => {
  isRefreshing.value = true
  inspiration.value = await refreshInspiration(locale.value)
  isRefreshing.value = false
}

// 监听语言变化
watch(
  locale,
  async () => {
    isRefreshing.value = true
    try {
      inspiration.value = await refreshInspiration(locale.value)
    } finally {
      isRefreshing.value = false
    }
  },
  { immediate: false }
)

onMounted(fetchInspiration)
</script>

<template>
  <div v-if="inspiration" class="daily-inspiration">
    <div class="inspiration-header">
      <h3>{{ t('dailyInspiration') }}</h3>
      <button :disabled="isRefreshing" class="refresh-btn" @click="handleRefresh">
        {{ isRefreshing ? t('refreshing') : t('refresh') }}
      </button>
    </div>
    <p class="inspiration-text">
      {{ inspiration }}
    </p>
  </div>
</template>

<style scoped>
.daily-inspiration {
  font-family:
    'LXGW WenKai Screen',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    Oxygen-Sans,
    Ubuntu,
    Cantarell,
    'Helvetica Neue',
    sans-serif;
  background-color: var(--card-bg-color);
  border-radius: var(--border-radius);
  box-shadow: var(--card-shadow);
  padding: 1rem;
  height: fit-content;
  width: 260px;
  position: fixed;
  top: 5rem;
  left: 2rem;
  z-index: 1000;
}

.inspiration-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

h3 {
  color: var(--text-color);
  margin: 0;
  font-size: 1.2rem;
}

.inspiration-text {
  color: var(--text-color);
  font-style: italic;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.refresh-btn {
  background-color: var(--button-bg-color);
  color: var(--text-color);
  border: none;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.refresh-btn:hover:not(:disabled) {
  background-color: var(--button-hover-bg-color);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 1200px) {
  .daily-inspiration {
    position: static;
    width: 100%;
    max-width: 600px;
    margin: 0 auto 1rem;
  }
}

@media (max-width: 768px) {
  .daily-inspiration {
    width: calc(100% - 8rem);
    margin: 1rem auto;
  }
}
</style>
