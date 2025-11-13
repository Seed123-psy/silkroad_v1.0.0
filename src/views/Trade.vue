<template>
  <div class="trade-page" tabindex="-1">
    <header class="trade-header">
      <div>
        <h1 class="trade-title">丝绸之路贸易分析</h1>
        <p class="trade-subtitle">通过商品、时期与城市维度探索贸易脉络</p>
      </div>
      <div class="trade-actions">
        <button class="refresh-btn" type="button" :disabled="loading" @click="reloadData">
          重新加载
        </button>
      </div>
    </header>

    <section class="trade-filters">
      <label class="filter-control">
        <span>选择时期</span>
        <select v-model="selectedPeriod" class="select">
          <option value="all">全部时期</option>
          <option v-for="period in periods" :key="period.value" :value="period.value">
            {{ period.label }}
          </option>
        </select>
      </label>
      <label class="filter-control">
        <span>选择城市</span>
        <select v-model="selectedCity" class="select">
          <option value="all">全部城市</option>
          <option v-for="city in cityOptions" :key="city" :value="city">{{ city }}</option>
        </select>
      </label>
    </section>

    <section class="trade-content">
      <div v-if="loading" class="trade-loading">正在加载贸易数据...</div>
      <div v-else-if="error" class="trade-error">{{ error }}</div>
      <TradeVolumeChart
        v-else
        :data="tradeRecords"
        :goods-data="tradeGoods"
        :period="activePeriod"
        :city="activeCity"
        title="丝绸之路贸易分析"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TradeVolumeChart from '@/components/TradeVolumeChart.vue'
import { dataService } from '@/services/dataService'
import type { City, TradeGoods, TradeRecord } from '@/types'

const tradeRecords = ref<TradeRecord[]>([])
const tradeGoods = ref<TradeGoods[]>([])
const cities = ref<City[]>([])
const loading = ref(true)
const error = ref('')
const selectedPeriod = ref<string>('all')
const selectedCity = ref<string>('all')

const periods = [
  { value: 'han', label: '汉朝' },
  { value: 'tang', label: '唐朝' },
  { value: 'song', label: '宋朝' },
  { value: 'yuan', label: '元朝' },
  { value: 'ming', label: '明朝' },
  { value: 'qing', label: '清朝' },
]

const router = useRouter()
const route = useRoute()

const cityOptions = computed(() => {
  return cities.value.map(city => city.name)
})

const activePeriod = computed(() =>
  selectedPeriod.value === 'all' ? undefined : selectedPeriod.value
)
const activeCity = computed(() => (selectedCity.value === 'all' ? undefined : selectedCity.value))

const syncFromRoute = () => {
  const { period, city } = route.query
  if (typeof period === 'string' && periods.some(p => p.value === period)) {
    selectedPeriod.value = period
  }
  if (typeof city === 'string') {
    selectedCity.value = city
  }
}

const syncToRoute = () => {
  router.replace({
    query: {
      ...(activePeriod.value ? { period: activePeriod.value } : {}),
      ...(activeCity.value ? { city: activeCity.value } : {}),
    },
  })
}

const loadData = async () => {
  try {
    loading.value = true
    error.value = ''

    const [tradeData, cityData] = await Promise.all([
      dataService.loadTradeData(),
      dataService.loadCities(),
    ])

    tradeRecords.value = tradeData.records
    tradeGoods.value = tradeData.goods
    cities.value = cityData
  } catch (err) {
    console.error('加载贸易数据失败:', err)
    error.value = `加载失败: ${err}`
  } finally {
    loading.value = false
  }
}

const reloadData = () => {
  loadData()
}

onMounted(async () => {
  syncFromRoute()
  await loadData()
})

watchEffect(() => {
  syncToRoute()
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;
@use '@/assets/styles/mixins.scss' as *;

.trade-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: $spacing-xl;
  gap: $spacing-xl;
  box-sizing: border-box;
  background: linear-gradient(135deg, rgba(9, 14, 28, 0.96), rgba(15, 27, 48, 0.94));
  overflow-y: auto;
}

.trade-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $spacing-lg;
}

.trade-title {
  margin: 0;
  font-size: 28px;
  font-weight: $font-weight-bold;
  letter-spacing: 0.02em;
}

.trade-subtitle {
  margin: $spacing-xs 0 0 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 15px;
}

.trade-actions {
  display: flex;
  gap: $spacing-sm;
}

.refresh-btn {
  @include button-base;
  background: rgba(255, 255, 255, 0.12);
  color: $text-inverse;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: wait;
  }
}

.trade-filters {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-lg;
  background: rgba(255, 255, 255, 0.06);
  border-radius: $border-radius-xl;
  padding: $spacing-lg;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.filter-control {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
}

.select {
  padding: $spacing-sm $spacing-md;
  border-radius: $border-radius-base;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(7, 12, 24, 0.9);
  color: $text-inverse;
  min-width: 180px;
  transition: border-color $transition-duration-fast $transition-timing-function;

  &:hover,
  &:focus {
    border-color: rgba(255, 255, 255, 0.45);
    outline: none;
  }
}

.trade-content {
  flex: 1;
  min-height: 0;
  background: rgba(255, 255, 255, 0.08);
  border-radius: $border-radius-xl;
  padding: $spacing-lg;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
  display: flex;
}

.trade-loading,
.trade-error {
  margin: auto;
  color: $text-inverse;
  font-size: 16px;
  letter-spacing: 0.04em;
}

@media (max-width: 1024px) {
  .trade-page {
    padding: $spacing-lg;
  }

  .trade-content {
    padding: $spacing-md;
  }
}

@media (max-width: 768px) {
  .trade-page {
    padding: $spacing-md;
    gap: $spacing-lg;
  }

  .trade-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .trade-title {
    font-size: 24px;
  }

  .trade-content {
    padding: $spacing-sm;
  }
}
</style>
