<template>
  <div class="trade-analysis-container">
    <header class="page-header">
      <div class="header-content">
        <div>
          <h1>丝绸之路贸易记录档案</h1>
          <div class="subtitle">共收录 {{ totalRecords }} 条历史贸易记录</div>
        </div>
        <div class="header-stats">
          <div class="stat-pill">
            <span class="label">总贸易额</span>
            <span class="value">{{ formatNumber(totalValue) }}</span>
          </div>
          <div class="stat-pill">
            <span class="label">总交易量</span>
            <span class="value">{{ formatNumber(totalVolume) }}</span>
          </div>
        </div>
      </div>
    </header>

    <div class="dashboard-grid">
      <!-- 左侧面板：筛选与分析 -->
      <div class="panel left-panel">
        <!-- 筛选器 -->
        <div class="control-box">
          <h3 class="panel-title">筛选条件</h3>

          <div class="filter-group">
            <label>历史时期</label>
            <div class="filter-options">
              <button
                v-for="p in periods"
                :key="p.value"
                :class="['filter-btn', { active: selectedPeriod === p.value }]"
                @click="selectedPeriod = p.value"
              >
                {{ p.label }}
              </button>
            </div>
          </div>

          <div class="filter-group">
            <label>商品类别</label>
            <select v-model="selectedCategory" class="filter-select">
              <option value="">全部类别</option>
              <option v-for="c in categories" :key="c.value" :value="c.value">
                {{ c.label }}
              </option>
            </select>
          </div>

          <div class="filter-group">
            <label>出发城市</label>
            <select v-model="selectedFromCity" class="filter-select">
              <option value="">全部出发地</option>
              <option v-for="city in fromCities" :key="city" :value="city">
                {{ city }}
              </option>
            </select>
          </div>

          <div class="filter-group">
            <label>目的城市</label>
            <select v-model="selectedToCity" class="filter-select">
              <option value="">全部目的地</option>
              <option v-for="city in toCities" :key="city" :value="city">
                {{ city }}
              </option>
            </select>
          </div>

          <div class="filter-group">
            <label>贸易额范围 ({{ formatNumber(minVal) }} - {{ formatNumber(maxVal) }})</label>
            <div class="range-inputs">
              <input v-model.number="minVal" type="number" placeholder="Min" class="range-input" />
              <span class="range-sep">-</span>
              <input v-model.number="maxVal" type="number" placeholder="Max" class="range-input" />
            </div>
          </div>

          <div class="filter-group">
            <label>搜索城市/商品</label>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="输入城市或商品名称..."
              class="search-input"
            />
          </div>
        </div>

        <!-- 图表：类别占比 -->
        <div class="chart-box">
          <h3 class="chart-title">当前筛选类别占比</h3>
          <div ref="categoryChartRef" class="chart-container"></div>
        </div>
      </div>

      <!-- 中间面板：数据列表 (取代原来的地球) -->
      <div class="panel center-panel">
        <div class="panel-tabs">
          <button
            :class="['tab-btn', { active: currentView === 'list' }]"
            @click="currentView = 'list'"
          >
            数据列表
          </button>
          <button
            :class="['tab-btn', { active: currentView === 'map' }]"
            @click="currentView = 'map'"
          >
            3D 贸易流向
          </button>
          <button
            :class="['tab-btn', { active: currentView === 'network' }]"
            @click="currentView = 'network'"
          >
            贸易网络关系
          </button>
          <button
            :class="['tab-btn', { active: currentView === 'goods-network' }]"
            @click="currentView = 'goods-network'"
          >
            商品产地网络
          </button>
        </div>

        <div v-if="currentView === 'list'" class="data-list-container">
          <div class="list-header">
            <div class="col col-id">ID</div>
            <div class="col col-period">时期</div>
            <div class="col col-route">路线</div>
            <div class="col col-goods">商品</div>
            <div class="col col-amount sortable" @click="toggleSort('volume')">
              <span>数量</span>
              <span
                class="sort-icon"
                :class="{
                  active: sortKey === 'volume',
                  asc: sortKey === 'volume' && sortOrder === 'asc',
                }"
              ></span>
            </div>
            <div class="col col-value sortable" @click="toggleSort('value')">
              <span>价值</span>
              <span
                class="sort-icon"
                :class="{
                  active: sortKey === 'value',
                  asc: sortKey === 'value' && sortOrder === 'asc',
                }"
              ></span>
            </div>
          </div>

          <div class="list-body custom-scrollbar">
            <div
              v-for="record in paginatedRecords"
              :key="record.id"
              class="list-row"
              :class="{ active: currentRecord?.id === record.id }"
              @click="selectRecord(record)"
            >
              <div class="col col-id">{{ record.id }}</div>
              <div class="col col-period">
                <span :class="['tag', record.period]">{{ getPeriodLabel(record.period) }}</span>
              </div>
              <div class="col col-route">
                <div class="route-flow">
                  <span>{{ record.fromCity }}</span>
                  <span class="arrow">→</span>
                  <span>{{ record.toCity }}</span>
                </div>
              </div>
              <div class="col col-goods">
                <div class="goods-info">
                  <span class="goods-name">{{ getGoodsName(record.goods) }}</span>
                  <span class="goods-cat">{{ getGoodsCategoryLabel(record.goods) }}</span>
                </div>
              </div>
              <div class="col col-amount">{{ record.volume }}</div>
              <div class="col col-value">{{ formatMoney(record.value) }}</div>
            </div>

            <div v-if="filteredRecords.length === 0" class="no-data">
              <div class="empty-state-card">
                <div class="empty-illustration">
                  <!-- 简洁的放大镜图标 + 金色环 -->
                  <svg
                    width="88"
                    height="88"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="11"
                      stroke="#2a2a2a"
                      stroke-width="1"
                      fill="#0a0a0a"
                    />
                    <circle
                      cx="12"
                      cy="10"
                      r="6"
                      stroke="#e2c792"
                      stroke-width="2"
                      fill="rgba(226, 199, 146,0.06)"
                    />
                    <path
                      d="M16.5 16.5L21 21"
                      stroke="#e2c792"
                      stroke-width="1.5"
                      stroke-linecap="round"
                    />
                  </svg>
                </div>
                <div class="empty-texts">
                  <h3 class="empty-title">未找到匹配的记录</h3>
                  <p class="empty-desc">
                    尝试调整筛选条件或清除关键词以显示更多结果。你也可以查看所有记录或导出样例以便离线分析。
                  </p>

                  <div class="empty-actions">
                    <button class="btn btn-secondary" @click="resetFilters">重置筛选</button>
                    <button class="btn btn-primary" @click="showAllRecords">查看所有记录</button>
                    <button class="btn btn-ghost" @click="exportSample">导出样例 (JSON)</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="pagination-bar">
            <button :disabled="currentPage === 1" @click="currentPage--">上一页</button>
            <span
              >第 {{ currentPage }} / {{ totalPages }} 页 (共 {{ filteredRecords.length }} 条)</span
            >
            <button :disabled="currentPage === totalPages" @click="currentPage++">下一页</button>
          </div>
        </div>

        <div v-show="currentView === 'map'" class="chart-view-container">
          <div v-if="mapLoading" class="loading-overlay">
            <div class="spinner"></div>
            <span>正在加载 3D 地图数据...</span>
          </div>
          <div v-if="mapError" class="error-overlay">
            <span>地图加载失败，请检查网络连接</span>
            <button @click="retryLoadMap">重试</button>
          </div>
          <div v-if="!mapLoading && !mapError" class="map-control-panel">
            <div class="control-title">视角控制</div>
            <!-- 缩放滑块已移除，保留鼠标缩放操作 -->
            <div class="control-row">
              <div class="row-label">
                <span>俯仰</span>
                <span class="value">{{ globeAlpha }}°</span>
              </div>
              <input
                v-model.number="globeAlpha"
                class="map-slider"
                type="range"
                :min="pitchRange.min"
                :max="pitchRange.max"
                step="1"
              />
            </div>
          </div>
          <div ref="globeChartRef" class="full-chart"></div>
        </div>

        <div v-show="currentView === 'network'" class="chart-view-container">
          <div ref="networkChartRef" class="full-chart"></div>
        </div>

        <div v-show="currentView === 'goods-network'" class="chart-view-container">
          <div ref="goodsNetworkChartRef" class="full-chart"></div>
        </div>
      </div>

      <!-- 右侧面板：详情与统计 -->
      <div class="panel right-panel">
        <!-- 选中记录详情 -->
        <div v-if="currentRecord" class="detail-box">
          <h3 class="panel-title">交易详情</h3>
          <div class="detail-card">
            <div class="detail-header">
              <span class="detail-id">{{ currentRecord.id }}</span>
              <span :class="['tag', currentRecord.period]">{{
                getPeriodLabel(currentRecord.period)
              }}</span>
            </div>

            <div class="detail-route">
              <div class="city-node from">
                <div class="city-name">{{ currentRecord.fromCity }}</div>
                <div class="city-label">出发地</div>
              </div>
              <div class="route-line"></div>
              <div class="city-node to">
                <div class="city-name">{{ currentRecord.toCity }}</div>
                <div class="city-label">目的地</div>
              </div>
            </div>

            <div class="detail-grid">
              <div class="detail-item">
                <label>商品</label>
                <div class="value highlight">{{ getGoodsName(currentRecord.goods) }}</div>
              </div>
              <div class="detail-item">
                <label>类别</label>
                <div class="value">{{ getGoodsCategoryLabel(currentRecord.goods) }}</div>
              </div>
              <div class="detail-item">
                <label>交易量</label>
                <div class="value">{{ currentRecord.volume }}</div>
              </div>
              <div class="detail-item">
                <label>总价值</label>
                <div class="value money">{{ formatMoney(currentRecord.value) }}</div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="detail-box empty">
          <p>点击列表查看详情</p>
        </div>

        <!-- 热门商品排行 -->
        <div class="chart-box">
          <h3 class="chart-title">热门交易商品 TOP 10</h3>
          <div ref="topGoodsChartRef" class="chart-container"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import 'echarts-gl'
import tradeDataRaw from '@/assets/data/lushang_trades.json'
import citiesDataRaw from '@/assets/data/cities.json'
import exportService from '@/services/exportService'

// --- 类型定义 ---
interface TradeGood {
  id: string
  name: string
  category: string
  origin: string[]
  destination: string[]
  peakPeriod: string
}

interface TradeRecord {
  id: string
  period: string
  fromCity: string
  toCity: string
  goods: string
  volume: number
  value: number
  route: string
}

interface City {
  id: string
  name: string
  lat: number
  lng: number
}

// --- 数据准备 ---
const tradeGoods = ref<TradeGood[]>(tradeDataRaw.tradeGoods as TradeGood[])
// @ts-ignore - JSON 类型推断可能不包含 tradeRecords，但实际文件中有
const tradeRecords = ref<TradeRecord[]>(tradeDataRaw.tradeRecords || [])
const cities = ref<City[]>(citiesDataRaw.cities as City[])

// 映射表
const goodsMap = new Map(tradeGoods.value.map(g => [g.id, g]))
const categoryMap: Record<string, string> = {
  textile: '纺织品',
  ceramic: '陶瓷',
  food: '食品/香料',
  metal: '金属制品',
  craft: '工艺品',
  gem: '宝石/玉石',
  cultural: '文化用品',
  art: '艺术品',
  material: '原材料',
  livestock: '牲畜',
  luxury: '奢侈品',
  military: '军需品',
}

// 城市坐标映射
const cityCoords: Record<string, [number, number]> = {}
const cityAliases: Record<string, string> = {
  长安: '西安',
  中原: '洛阳',
  波斯: '巴格达',
  大食: '巴格达',
  欧洲: '君士坦丁堡',
  罗马: '罗马',
  天竺: '新德里',
  印度: '新德里',
}

const initCityCoords = () => {
  cities.value.forEach(city => {
    cityCoords[city.name] = [city.lng, city.lat]
  })
  // 补充坐标
  if (!cityCoords['巴格达']) cityCoords['巴格达'] = [44.361488, 33.312805]
  if (!cityCoords['君士坦丁堡']) cityCoords['君士坦丁堡'] = [28.978359, 41.008238]
  if (!cityCoords['罗马']) cityCoords['罗马'] = [12.496366, 41.902783]
  if (!cityCoords['新德里']) cityCoords['新德里'] = [77.209021, 28.613939]
  if (!cityCoords['洛阳']) cityCoords['洛阳'] = [112.4501, 34.6204]
  if (!cityCoords['景德镇']) cityCoords['景德镇'] = [117.214664, 29.29256]
  if (!cityCoords['杭州']) cityCoords['杭州'] = [120.15507, 30.274085]
  if (!cityCoords['福建']) cityCoords['福建'] = [119.2965, 26.0745]
  if (!cityCoords['苏州']) cityCoords['苏州'] = [120.585315, 31.298886]
  if (!cityCoords['江南']) cityCoords['江南'] = [120.15507, 30.274085]
  if (!cityCoords['和田']) cityCoords['和田'] = [79.922211, 37.114157]
  if (!cityCoords['缅甸']) cityCoords['缅甸'] = [96.199379, 16.871311]
  if (!cityCoords['东南亚']) cityCoords['东南亚'] = [100.501765, 13.756331]
  if (!cityCoords['中亚']) cityCoords['中亚'] = [66.974913, 39.627293]
  if (!cityCoords['西亚']) cityCoords['西亚'] = [51.389, 35.6892]
  if (!cityCoords['各地']) cityCoords['各地'] = [108.939839, 34.343147]
}

const getCityCoord = (name: string): [number, number] | null => {
  const realName = cityAliases[name] || name
  return cityCoords[realName] || null
}

const periods = [
  { label: '全部', value: '' },
  { label: '汉', value: 'han' },
  { label: '唐', value: 'tang' },
  { label: '宋', value: 'song' },
  { label: '元', value: 'yuan' },
  { label: '明', value: 'ming' },
  { label: '清', value: 'qing' },
]

import { PALETTE, STATIC_CATEGORY_COLORS } from '@/constants/colors'

const periodColors: Record<string, string> = {
  han: PALETTE[1],
  tang: PALETTE[0],
  song: PALETTE[2],
  yuan: PALETTE[3],
  ming: PALETTE[4],
  qing: PALETTE[5],
}

const categories = Object.entries(categoryMap).map(([k, v]) => ({ value: k, label: v }))

// --- 排序状态 ---
type SortKey = 'volume' | 'value' | null
type SortOrder = 'asc' | 'desc'
const sortKey = ref<SortKey>(null)
const sortOrder = ref<SortOrder>('desc')

const toggleSort = (key: SortKey) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'desc'
  }
}

// --- 状态 ---
const currentView = ref<'list' | 'map' | 'network' | 'goods-network'>('list')
const mapLoading = ref(false)
const mapError = ref(false)

const zoomRange = { min: 15, max: 200 }
const pitchRange = { min: 20, max: 80 }

// 移除滑块控制：使用鼠标滚轮/拖拽进行缩放，初始化为中间值
const globeDistance = ref(60)
const globeAlpha = ref(40)

const retryLoadMap = () => {
  mapError.value = false
  updateGlobeChart()
}
const selectedPeriod = ref('')
const selectedCategory = ref('')
const selectedFromCity = ref('')
const selectedToCity = ref('')
const minVal = ref<number | null>(null)
const maxVal = ref<number | null>(null)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = 20
const currentRecord = ref<TradeRecord | null>(null)

// Refs for charts
const categoryChartRef = ref<HTMLElement | null>(null)
const topGoodsChartRef = ref<HTMLElement | null>(null)
const globeChartRef = ref<HTMLElement | null>(null)
const networkChartRef = ref<HTMLElement | null>(null)
const goodsNetworkChartRef = ref<HTMLElement | null>(null)

let categoryChart: echarts.ECharts | null = null
let topGoodsChart: echarts.ECharts | null = null
let globeChart: echarts.ECharts | null = null
let networkChart: echarts.ECharts | null = null
let goodsNetworkChart: echarts.ECharts | null = null

const applyGlobeViewControl = () => {
  if (!globeChart) return
  globeChart.setOption({
    geo3D: {
      viewControl: {
        distance: globeDistance.value,
        alpha: globeAlpha.value,
      },
    },
  })
}

// --- 计算属性 ---

// 城市列表
const fromCities = computed(() => [...new Set(tradeRecords.value.map(r => r.fromCity))].sort())
const toCities = computed(() => [...new Set(tradeRecords.value.map(r => r.toCity))].sort())

// 过滤后的记录
const filteredRecords = computed(() => {
  const result = tradeRecords.value.filter(r => {
    const matchPeriod = !selectedPeriod.value || r.period === selectedPeriod.value

    const good = goodsMap.get(r.goods)
    const matchCategory =
      !selectedCategory.value || (good && good.category === selectedCategory.value)

    const matchFrom = !selectedFromCity.value || r.fromCity === selectedFromCity.value
    const matchTo = !selectedToCity.value || r.toCity === selectedToCity.value

    const matchMin = minVal.value === null || r.value >= minVal.value
    const matchMax = maxVal.value === null || r.value <= maxVal.value

    const query = searchQuery.value.toLowerCase()
    const goodName = good ? good.name : ''
    const matchSearch =
      !query ||
      r.fromCity.includes(query) ||
      r.toCity.includes(query) ||
      goodName.includes(query) ||
      r.id.toLowerCase().includes(query)

    return (
      matchPeriod && matchCategory && matchFrom && matchTo && matchMin && matchMax && matchSearch
    )
  })

  if (sortKey.value) {
    result.sort((a, b) => {
      const valA = a[sortKey.value!]
      const valB = b[sortKey.value!]
      return sortOrder.value === 'asc' ? valA - valB : valB - valA
    })
  }

  return result
})

// 分页
const totalPages = computed(() => Math.ceil(filteredRecords.value.length / pageSize))
const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredRecords.value.slice(start, start + pageSize)
})

// 统计
const totalRecords = computed(() => tradeRecords.value.length)
const totalValue = computed(() => filteredRecords.value.reduce((sum, r) => sum + r.value, 0))
const totalVolume = computed(() => filteredRecords.value.reduce((sum, r) => sum + r.volume, 0))

// --- 辅助函数 ---
const getGoodsName = (id: string) => goodsMap.get(id)?.name || id
const getGoodsCategoryLabel = (id: string) => {
  const cat = goodsMap.get(id)?.category
  return cat ? categoryMap[cat] || cat : '未知'
}
const getPeriodLabel = (val: string) => periods.find(p => p.value === val)?.label || val
const formatNumber = (num: number | null) => {
  if (num === null) return '-'
  return new Intl.NumberFormat('zh-CN').format(num)
}
const formatMoney = (num: number) => `🪙 ${new Intl.NumberFormat('zh-CN').format(num)}`

const selectRecord = (record: TradeRecord) => {
  currentRecord.value = record
}

// 重置筛选到默认值
const resetFilters = () => {
  selectedPeriod.value = ''
  selectedCategory.value = ''
  selectedFromCity.value = ''
  selectedToCity.value = ''
  minVal.value = null
  maxVal.value = null
  searchQuery.value = ''
  currentPage.value = 1
  currentRecord.value = null
  updateCharts()
}

// 显示所有记录（清空筛选并切换到列表）
const showAllRecords = () => {
  resetFilters()
  currentView.value = 'list'
}

// 导出示例数据（JSON）——导出前 50 条原始记录，方便用户离线查看结构
const exportSample = () => {
  try {
    const sample = tradeRecords.value.slice(0, 50)
    exportService.exportToJSON(sample, 'trade_sample')
  } catch (e) {
    console.error('导出样例失败', e)
    alert('导出样例失败，请稍后重试')
  }
}

// --- 图表逻辑 ---

const updateCharts = () => {
  if (!categoryChart || !topGoodsChart) return

  // 1. 类别占比 (基于当前过滤结果)
  const catCounts: Record<string, number> = {}
  filteredRecords.value.forEach(r => {
    const good = goodsMap.get(r.goods)
    if (good) {
      const catName = categoryMap[good.category] || good.category
      catCounts[catName] = (catCounts[catName] || 0) + r.value // 按价值统计
    }
  })

  const catData = Object.entries(catCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // 使用共享的静态类别颜色映射（从 constants 导入）

  // 反向映射：中文类别名 -> 类别 code（用于把饼图中的中文名映射到静态颜色）
  const labelToCode: Record<string, string> = {}
  Object.entries(categoryMap).forEach(([code, label]) => {
    labelToCode[label] = code
  })

  const categoryColorMap: Record<string, string> = {}
  catData.forEach(c => {
    const code = labelToCode[c.name] || 'other'
    categoryColorMap[c.name] = STATIC_CATEGORY_COLORS[code] || PALETTE[0]
  })

  categoryChart.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
      confine: true,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      borderColor: '#333',
      textStyle: { color: '#e5e5e5' },
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '50%'],
        itemStyle: { borderRadius: 5, borderColor: '#141414', borderWidth: 2 },
        label: { show: false },
        data: catData,
        color: [PALETTE[0], PALETTE[1], PALETTE[2], PALETTE[3], PALETTE[4], PALETTE[5]],
      },
    ],
  })

  // 2. 热门商品 (基于当前过滤结果)
  const goodCounts: Record<string, number> = {}
  // 聚合时同时记录商品所属类别，用于给每条柱子着色
  const goodAgg: Array<{ name: string; value: number; category: string }> = []
  const tempMap = new Map<string, { value: number; categoryCode: string }>()
  filteredRecords.value.forEach(r => {
    const goods = goodsMap.get(r.goods)
    const name = goods ? goods.name : r.goods
    const catCode = goods ? goods.category || 'other' : 'other'
    const entry = tempMap.get(name) || { value: 0, categoryCode: catCode }
    entry.value += r.volume
    tempMap.set(name, entry)
  })

  tempMap.forEach((v, k) => {
    const label = categoryMap[v.categoryCode] || v.categoryCode
    goodAgg.push({ name: k, value: v.value, category: label })
  })

  const topGoods = goodAgg.sort((a, b) => b.value - a.value).slice(0, 10)

  topGoodsChart.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      confine: true,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      borderColor: '#333',
      textStyle: { color: '#e5e5e5' },
    },
    grid: { left: '3%', right: '24%', bottom: '3%', top: '3%', containLabel: true },
    xAxis: { type: 'value', splitLine: { show: false }, axisLabel: { show: false } },
    yAxis: {
      type: 'category',
      data: topGoods.map(i => i.name).reverse(),
      axisLabel: { color: '#a3a3a3' },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        data: topGoods
          .map(i => ({
            value: i.value,
            itemStyle: { color: categoryColorMap[i.category] || PALETTE[0] },
          }))
          .reverse(),
        itemStyle: { borderRadius: [0, 6, 6, 0] },
        label: {
          show: true,
          position: 'right',
          color: '#0b0b0b',
          backgroundColor: '#e2c792',
          padding: [4, 10],
          borderRadius: 12,
          distance: 8,
        },
      },
    ],
  })

  // 3. 3D 地球 (如果可见)
  if (currentView.value === 'map' && globeChart) {
    updateGlobeChart()
  }

  // 4. 关系网络 (如果可见)
  if (currentView.value === 'network' && networkChart) {
    updateNetworkChart()
  }

  // 5. 商品产地网络 (如果可见)
  if (currentView.value === 'goods-network' && goodsNetworkChart) {
    updateGoodsNetworkChart()
  }
}

const updateGlobeChart = async () => {
  if (!globeChart) return

  // 检查是否已注册地图数据，如果没有则加载
  // @ts-ignore
  if (!echarts.getMap('world')) {
    try {
      mapLoading.value = true
      mapError.value = false
      // 使用更稳定的 CDN
      const res = await fetch('https://cdn.jsdelivr.net/npm/echarts@4.9.0/map/json/world.json')
      if (!res.ok) throw new Error('Network response was not ok')
      const worldJson = await res.json()
      echarts.registerMap('world', worldJson)
      mapLoading.value = false
    } catch (e) {
      console.error('Failed to load world map data', e)
      mapLoading.value = false
      mapError.value = true
      return
    }
  }

  const linesData: any[] = []
  const scatterData: any[] = []
  const addedCities = new Set<string>()
  const MAP_HEIGHT = 0.4 // 地图厚度（减小以匹配视觉比例）

  filteredRecords.value.forEach(r => {
    const fromCoord = getCityCoord(r.fromCity)
    const toCoord = getCityCoord(r.toCity)

    if (fromCoord && toCoord) {
      if (!addedCities.has(r.fromCity)) {
        // 节点坐标增加高度信息，紧贴地图表面（更微小的偏移）
        scatterData.push({ name: r.fromCity, value: [...fromCoord, MAP_HEIGHT + 0.0001] })
        addedCities.add(r.fromCity)
      }
      if (!addedCities.has(r.toCity)) {
        scatterData.push({ name: r.toCity, value: [...toCoord, MAP_HEIGHT + 0.0001] })
        addedCities.add(r.toCity)
      }

      // 连线坐标增加高度信息
      linesData.push({
        coords: [
          [...fromCoord, MAP_HEIGHT + 0.0001],
          [...toCoord, MAP_HEIGHT + 0.0001],
        ],
        lineStyle: {
          color: periodColors[r.period] || PALETTE[0],
          curveness: 0,
        },
      })
    }
  })

  globeChart.setOption({
    backgroundColor: 'transparent',
    geo3D: {
      map: 'world',
      shading: 'lambert',
      regionHeight: MAP_HEIGHT,
      boxHeight: 1,
      environment: '#000000', // 背景环境色设为黑色

      itemStyle: {
        color: '#141414',
        opacity: 1,
        borderWidth: 0.5,
        borderColor: '#333',
      },

      groundPlane: {
        show: false,
        color: '#000000',
      },

      light: {
        main: {
          intensity: 0.8, // 降低主光强度
          shadow: true,
          shadowQuality: 'high',
          alpha: 30,
          beta: 30,
        },
        ambient: {
          intensity: 0.2, // 降低环境光
        },
      },

      viewControl: {
        distance: globeDistance.value,
        alpha: globeAlpha.value,
        beta: 0,
        minAlpha: pitchRange.min,
        maxAlpha: pitchRange.max,
        minDistance: zoomRange.min,
        maxDistance: zoomRange.max,
        panMouseButton: 'left',
        rotateMouseButton: 'right',
        center: [10, 0, 0],
        zoomSensitivity: 2,
      },

      postEffect: {
        enable: true,
        bloom: {
          enable: false,
          bloomIntensity: 0,
        },
        SSAO: {
          enable: true,
          radius: 1.2,
          intensity: 0.5,
        },
      },
    },
    series: [
      {
        type: 'lines3D',
        coordinateSystem: 'geo3D',
        effect: {
          show: true,
          period: 4,
          trailWidth: 2,
          trailLength: 0.25,
          trailOpacity: 0.18,
          // 使用更柔和的淡金色半透明以减弱亮度
          trailColor: 'rgba(226, 199, 146, 0.12)',
        },
        // 取消叠加混合，避免亮度叠加
        blendMode: 'normal',
        lineStyle: {
          width: 1,
          // 适度提高线条可见性但仍保持柔和
          opacity: 0.45,
          curveness: 0,
        },
        data: linesData,
      },
      {
        type: 'scatter3D',
        coordinateSystem: 'geo3D',
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: {
          color: PALETTE[0],
          opacity: 1,
        },
        label: {
          show: true,
          position: 'right',
          distance: 6,
          formatter: '{b}',
          textStyle: {
            color: '#e5e5e5',
            fontSize: 12,
            backgroundColor: 'rgba(0,0,0,0.6)',
            padding: [2, 4],
            borderRadius: 2,
          },
        },
        data: scatterData,
      },
    ],
  })

  // 清除可能存在的 globe 配置
  // @ts-ignore
  globeChart.setOption({ globe: null }, { replaceMerge: ['globe'] })
}

const updateNetworkChart = () => {
  if (!networkChart) return

  const nodes: any[] = []
  const links: any[] = []
  const nodeSet = new Set<string>()
  const linkMap = new Map<string, number>()
  // 聚合数据：城市 -> 城市 的贸易量，并收集节点集合
  filteredRecords.value.forEach(r => {
    nodeSet.add(r.fromCity)
    nodeSet.add(r.toCity)
    const linkKey = `${r.fromCity}-${r.toCity}`
    linkMap.set(linkKey, (linkMap.get(linkKey) || 0) + r.volume)
  })

  // 生成 Links
  linkMap.forEach((vol, key) => {
    const [source, target] = key.split('-')
    links.push({ source, target, value: vol, lineStyle: { width: Math.min(vol / 100, 5) } })
  })

  // 计算每个节点的连接数（degree）
  const degreeMap = new Map<string, number>()
  links.forEach(l => {
    degreeMap.set(l.source, (degreeMap.get(l.source) || 0) + 1)
    degreeMap.set(l.target, (degreeMap.get(l.target) || 0) + 1)
  })

  // 生成节点数组并设置 value 为连接数，symbolSize 根据连接数调整
  nodeSet.forEach(name => {
    const degree = degreeMap.get(name) || 0
    const size = 10 + degree * 2 // 保持原先的视觉比例
    nodes.push({ name, category: 0, symbolSize: Math.max(8, size), value: degree })
  })

  networkChart.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      formatter: function (params: any) {
        if (params.dataType === 'edge')
          return `${params.data.source} → ${params.data.target}: ${params.data.value}`
        return `${params.data.name}: 连接数 ${params.data.value}`
      },
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        data: nodes,
        links: links,
        roam: true,
        label: { show: true, position: 'right', color: PALETTE[3] },
        force: { repulsion: 200, edgeLength: 100 },
        lineStyle: { color: PALETTE[0], curveness: 0.2, opacity: 0.6 },
        itemStyle: { color: PALETTE[1] },
      },
    ],
  })
}

const updateGoodsNetworkChart = () => {
  if (!goodsNetworkChart) return

  const nodes: any[] = []
  const links: any[] = []
  const addedNodes = new Set<string>()

  // 筛选商品
  const goodsToShow = tradeGoods.value.filter(g => {
    const matchCategory = !selectedCategory.value || g.category === selectedCategory.value
    const query = searchQuery.value.toLowerCase()
    const matchSearch =
      !query ||
      g.name.includes(query) ||
      g.origin.some(o => o.includes(query)) ||
      g.destination.some(d => d.includes(query))
    return matchCategory && matchSearch
  })

  goodsToShow.forEach(g => {
    // 商品节点
    const goodId = `good-${g.id}`
    if (!addedNodes.has(goodId)) {
      nodes.push({
        id: goodId,
        name: g.name,
        category: 1, // 商品
        symbol: 'diamond',
        symbolSize: 20,
        itemStyle: { color: PALETTE[0] },
        value: g.category,
      })
      addedNodes.add(goodId)
    }

    // 产地节点与连线
    g.origin.forEach(city => {
      const cityId = `city-${city}`
      if (!addedNodes.has(cityId)) {
        nodes.push({
          id: cityId,
          name: city,
          category: 0, // 城市
          symbol: 'circle',
          symbolSize: 15,
          itemStyle: { color: PALETTE[3] },
        })
        addedNodes.add(cityId)
      }
      links.push({
        source: cityId,
        target: goodId,
        value: '产出',
        lineStyle: { color: PALETTE[4], curveness: 0.1 },
      })
    })

    // 目的地节点与连线
    g.destination.forEach(city => {
      const cityId = `city-${city}`
      if (!addedNodes.has(cityId)) {
        nodes.push({
          id: cityId,
          name: city,
          category: 0, // 城市
          symbol: 'circle',
          symbolSize: 15,
          itemStyle: { color: PALETTE[3] },
        })
        addedNodes.add(cityId)
      }
      links.push({
        source: goodId,
        target: cityId,
        value: '销往',
        lineStyle: { color: PALETTE[5], curveness: 0.1 },
      })
    })
  })

  goodsNetworkChart.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      formatter: function (params: any) {
        if (params.dataType === 'edge') {
          return `${params.data.source.replace('city-', '').replace('good-', '')} ${params.data.value} ${params.data.target.replace('city-', '').replace('good-', '')}`
        }
        return `${params.data.name}`
      },
    },
    legend: {
      data: ['城市', '商品'],
      textStyle: { color: '#e5e5e5' },
      top: 10,
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        data: nodes,
        links: links,
        categories: [{ name: '城市' }, { name: '商品' }],
        roam: true,
        label: { show: true, position: 'right', color: '#e5e5e5' },
        force: {
          repulsion: 300,
          edgeLength: 120,
          gravity: 0.1,
        },
        lineStyle: {
          width: 1,
          opacity: 0.6,
        },
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: 6,
      },
    ],
  })
}

// --- 生命周期 ---
watch([globeDistance, globeAlpha], () => {
  applyGlobeViewControl()
})

watch(
  [selectedPeriod, selectedCategory, selectedFromCity, selectedToCity, minVal, maxVal, searchQuery],
  () => {
    currentPage.value = 1
    updateCharts()
  }
)

watch(currentView, async newView => {
  await nextTick()
  if (newView === 'map') {
    if (!globeChart && globeChartRef.value) {
      globeChart = echarts.init(globeChartRef.value, 'dark')
    }
    updateGlobeChart()
    globeChart?.resize()
  } else if (newView === 'network') {
    if (!networkChart && networkChartRef.value) {
      networkChart = echarts.init(networkChartRef.value, 'dark')
    }
    updateNetworkChart()
    networkChart?.resize()
  } else if (newView === 'goods-network') {
    if (!goodsNetworkChart && goodsNetworkChartRef.value) {
      goodsNetworkChart = echarts.init(goodsNetworkChartRef.value, 'dark')
    }
    updateGoodsNetworkChart()
    goodsNetworkChart?.resize()
  }
})

onMounted(async () => {
  initCityCoords()
  await nextTick()

  if (categoryChartRef.value) {
    categoryChart = echarts.init(categoryChartRef.value, 'dark')
  }
  if (topGoodsChartRef.value) {
    topGoodsChart = echarts.init(topGoodsChartRef.value, 'dark')
  }

  updateCharts()
  window.addEventListener('resize', () => {
    categoryChart?.resize()
    topGoodsChart?.resize()
    globeChart?.resize()
    networkChart?.resize()
    goodsNetworkChart?.resize()
  })
})

onUnmounted(() => {
  categoryChart?.dispose()
  topGoodsChart?.dispose()
  globeChart?.dispose()
  networkChart?.dispose()
  goodsNetworkChart?.dispose()
})
</script>

<style scoped lang="scss">
.trade-analysis-container {
  width: 100%;
  height: 100vh;
  background-color: #000000;
  color: #e5e5e5;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.page-header {
  padding: 1rem 2rem;
  background: #141414;
  border-bottom: 1px solid #333333;
  flex-shrink: 0;

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  h1 {
    margin: 0;
    font-size: 1.5rem;
    color: #e2c792;
  }

  .subtitle {
    color: #737373;
    font-size: 0.85rem;
    margin-top: 0.25rem;
  }

  .header-stats {
    display: flex;
    gap: 1rem;
  }

  .stat-pill {
    background: #1f1f1f;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    border: 1px solid #333;

    .label {
      font-size: 0.75rem;
      color: #a3a3a3;
    }
    .value {
      font-size: 1.1rem;
      font-weight: bold;
      color: #e2c792;
    }
  }
}

.dashboard-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 300px 1fr 320px;
  gap: 1px; // Grid lines via background
  background: #333333; // Border color
  min-height: 0;
}

.panel {
  background: #000000;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 1rem;
  gap: 1rem;
  overflow-y: auto;
}

.panel-title {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: #e2c792;
  font-weight: 600;
  border-left: 3px solid #e2c792;
  padding-left: 0.5rem;
}

// --- Left Panel ---
.control-box {
  background: #141414;
  padding: 1rem;
  border-radius: 8px;
}

.filter-group {
  margin-bottom: 1.25rem;

  label {
    display: block;
    font-size: 0.8rem;
    color: #a3a3a3;
    margin-bottom: 0.5rem;
  }
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-btn {
  background: #2a2a2a;
  border: 1px solid #333;
  color: #a3a3a3;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #333;
    color: #e5e5e5;
  }
  &.active {
    background: #e2c792;
    color: #000;
    border-color: #e2c792;
    font-weight: bold;
  }
}

.filter-select,
.search-input,
.range-input {
  width: 100%;
  background: #0a0a0a;
  border: 1px solid #333;
  color: #e5e5e5;
  padding: 0.5rem;
  border-radius: 4px;
  outline: none;

  &:focus {
    border-color: #e2c792;
  }
}

.range-inputs {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  .range-input {
    width: 100%;
    min-width: 0; // 防止 flex item 溢出
  }

  .range-sep {
    color: #737373;
  }
}

.chart-box {
  background: #141414;
  padding: 1rem;
  border-radius: 8px;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 250px;
  overflow: visible; /* allow chart labels to overflow slightly without being clipped */
}

.chart-title {
  font-size: 0.9rem;
  color: #e5e5e5;
  margin: 0 0 0.5rem 0;
  text-align: center;
}

.chart-container {
  flex: 1;
  width: 100%;
  padding: 0.25rem 0.5rem; /* small inner padding to keep labels clear of box edge */
  box-sizing: border-box;
  overflow: visible;
}

.panel-tabs {
  display: flex;
  gap: 1rem;
  padding: 0.5rem 1rem;
  background: #141414;
  border-bottom: 1px solid #333333;
}

.tab-btn {
  background: transparent;
  border: none;
  color: #a3a3a3;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;

  &:hover {
    color: #e5e5e5;
  }
  &.active {
    color: #e2c792;
    border-bottom-color: #e2c792;
    font-weight: bold;
  }
}

.chart-view-container {
  flex: 1;
  width: 100%;
  height: 100%;
  position: relative;
  background: #000000;
}

.full-chart {
  width: 100%;
  height: 100%;
}

.map-control-panel {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 220px;
  padding: 0.75rem 1rem;
  background: rgba(20, 20, 20, 0.95);
  border: 1px solid #333333;
  border-radius: 10px;
  z-index: 20;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
}

.map-control-panel .control-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #e2c792;
  margin-bottom: 0.5rem;
}

.map-control-panel .control-row {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 0.75rem;
}

.map-control-panel .control-row:last-child {
  margin-bottom: 0;
}

.row-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #a3a3a3;
}

.row-label .value {
  color: #e5e5e5;
  font-weight: 600;
}

.map-slider {
  width: 100%;
  height: 6px;
  background: #1f1f1f;
  border-radius: 999px;
  appearance: none;
}

.map-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #e2c792;
  border: none;
}

.map-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #e2c792;
  border: none;
}

// --- Center Panel (List) ---
.data-list-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #141414;
  border-radius: 0 0 8px 8px; // Adjust radius
  overflow: hidden;
}

.list-header {
  display: flex;
  background: #1f1f1f;
  padding: 0.75rem 1rem;
  font-weight: 600;
  font-size: 0.85rem;
  color: #e2c792;
  border-bottom: 1px solid #333333;

  .col {
    padding: 0 0.5rem;
  }
}

.list-body {
  flex: 1;
  overflow-y: auto;

  .list-row {
    display: flex;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #2a2a2a;
    cursor: pointer;
    transition: background 0.2s;
    align-items: center;
    color: #e5e5e5;

    &:hover {
      background: #1f1f1f;
    }
    &.active {
      background: rgba(226, 199, 146, 0.1);
      border-left: 3px solid #e2c792;
    }
  }
}

.no-data {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2.5rem 1rem;

  .empty-state-card {
    display: flex;
    gap: 1.5rem;
    align-items: center;
    background: linear-gradient(180deg, rgba(20, 20, 20, 0.6), rgba(10, 10, 10, 0.6));
    border: 1px solid #222;
    padding: 1.25rem 1.5rem;
    border-radius: 10px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.6);
    width: min(720px, 90%);
  }

  .empty-illustration {
    flex: 0 0 88px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(226, 199, 146, 0.04);
    border-radius: 8px;
    border: 1px solid rgba(226, 199, 146, 0.08);
  }

  .empty-texts {
    flex: 1;
  }

  .empty-title {
    margin: 0 0 0.25rem 0;
    color: #e5e5e5;
    font-size: 1.15rem;
    font-weight: 700;
  }

  .empty-desc {
    margin: 0 0 1rem 0;
    color: #a3a3a3;
    font-size: 0.95rem;
  }

  .empty-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .btn {
    padding: 0.45rem 0.8rem;
    border-radius: 6px;
    font-size: 0.9rem;
    cursor: pointer;
    border: 1px solid transparent;
  }

  .btn-primary {
    background: #e2c792;
    color: #000;
    border-color: #e2c792;
    font-weight: 700;
  }

  .btn-secondary {
    background: transparent;
    color: #e5e5e5;
    border: 1px solid #333;
  }

  .btn-ghost {
    background: transparent;
    color: #a3a3a3;
    border: 1px dashed rgba(163, 163, 163, 0.15);
  }
}

.col {
  &.col-id {
    width: 80px;
    color: #737373;
    font-size: 0.8rem;
  }
  &.col-period {
    width: 60px;
  }
  &.col-route {
    flex: 2;
  }
  &.col-goods {
    flex: 1.5;
  }
  &.col-amount {
    width: 80px;
    text-align: right;
  }
  &.col-value {
    width: 100px;
    text-align: right;
    color: #e2c792;
  }

  &.sortable {
    cursor: pointer;
    user-select: none;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;
    transition: color 0.2s;

    &:hover {
      color: #e2c792;
    }
  }
}

.sort-icon {
  display: inline-block;
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 4px solid #737373;
  vertical-align: middle;
  transition:
    transform 0.2s,
    border-top-color 0.2s;

  &.active {
    border-top-color: #e2c792;
  }

  &.asc {
    transform: rotate(180deg);
  }
}

.tag {
  font-size: 0.75rem;
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  background: #2a2a2a;
  color: #a3a3a3;
  border: 1px solid #444;

  &.han {
    border-color: #b8860b;
    color: #b8860b;
  }
  &.tang {
    border-color: #e2c792;
    color: #e2c792;
  }
  &.song {
    border-color: #8a6e2f;
    color: #8a6e2f;
  }
  &.yuan {
    border-color: #e5e5e5;
    color: #e5e5e5;
  }
  &.ming {
    border-color: #a3a3a3;
    color: #a3a3a3;
  }
  &.qing {
    border-color: #737373;
    color: #737373;
  }
}

.route-flow {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  .arrow {
    color: #737373;
  }
}

.goods-info {
  display: flex;
  flex-direction: column;
  .goods-name {
    font-weight: 500;
  }
  .goods-cat {
    font-size: 0.75rem;
    color: #737373;
  }
}

.pagination-bar {
  padding: 0.75rem;
  background: #141414;
  border-top: 1px solid #333333;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  font-size: 0.85rem;
  color: #a3a3a3;

  button {
    background: #2a2a2a;
    border: 1px solid #333333;
    color: #e5e5e5;
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    cursor: pointer;
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    &:hover:not(:disabled) {
      background: #333333;
      border-color: #e2c792;
      color: #e2c792;
    }
  }
}

// --- Right Panel ---
.detail-box {
  background: #141414;
  padding: 1rem;
  border-radius: 8px;

  &.empty {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #737373;
    height: 200px;
  }
}

.detail-card {
  background: #0a0a0a;
  border: 1px solid #333333;
  border-radius: 8px;
  padding: 1rem;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  .detail-id {
    color: #737373;
    font-family: monospace;
  }
}

.detail-route {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  position: relative;

  .route-line {
    flex: 1;
    height: 2px;
    background: #333333;
    margin: 0 1rem;
    position: relative;
    &::after {
      content: '>';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #737373;
      background: #0a0a0a;
      padding: 0 0.25rem;
    }
  }
}

.city-node {
  text-align: center;
  .city-name {
    font-size: 1.1rem;
    font-weight: bold;
    color: #e2c792;
  }
  .city-label {
    font-size: 0.75rem;
    color: #737373;
  }
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.detail-item {
  .value {
    font-size: 1rem;
    color: #e5e5e5;
  }
  .value.highlight {
    color: #e2c792;
    font-weight: bold;
  }
  .value.money {
    color: #e2c792;
  }
  label {
    font-size: 0.75rem;
    color: #737373;
    display: block;
    margin-bottom: 0.25rem;
  }
}

// Scrollbar
.custom-scrollbar {
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: #141414;
  }
  &::-webkit-scrollbar-thumb {
    background: #333333;
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: #e2c792;
  }
}

.loading-overlay,
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.8);
  z-index: 10;
  color: #e5e5e5;
  gap: 1rem;

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #333333;
    border-top-color: #e2c792;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  button {
    padding: 0.5rem 1rem;
    background: #e2c792;
    color: #000;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    &:hover {
      background: #b8860b;
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1200px) {
  .dashboard-grid {
    grid-template-columns: 250px 1fr;
    grid-template-rows: auto auto;
  }
  .right-panel {
    grid-column: 1 / -1;
    flex-direction: row;
    height: auto;
    .detail-box,
    .chart-box {
      flex: 1;
    }
  }
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  .right-panel {
    flex-direction: column;
  }
  .map-control-panel {
    width: calc(100% - 2rem);
    left: 1rem;
    right: 1rem;
    top: auto;
    bottom: 1rem;
  }
}
</style>
