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
        </div>

        <div v-if="currentView === 'list'" class="data-list-container">
          <div class="list-header">
            <div class="col col-id">ID</div>
            <div class="col col-period">时期</div>
            <div class="col col-route">路线</div>
            <div class="col col-goods">商品</div>
            <div class="col col-amount">数量</div>
            <div class="col col-value">价值</div>
          </div>
          
          <div class="list-body custom-scrollbar">
            <div 
              v-for="record in paginatedRecords" 
              :key="record.id" 
              class="list-row"
              @click="selectRecord(record)"
              :class="{ active: currentRecord?.id === record.id }"
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
              没有找到匹配的记录
            </div>
          </div>

          <div class="pagination-bar">
            <button :disabled="currentPage === 1" @click="currentPage--">上一页</button>
            <span>第 {{ currentPage }} / {{ totalPages }} 页 (共 {{ filteredRecords.length }} 条)</span>
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
          <div ref="globeChartRef" class="full-chart"></div>
        </div>

        <div v-show="currentView === 'network'" class="chart-view-container">
          <div ref="networkChartRef" class="full-chart"></div>
        </div>
      </div>

      <!-- 右侧面板：详情与统计 -->
      <div class="panel right-panel">
        <!-- 选中记录详情 -->
        <div class="detail-box" v-if="currentRecord">
          <h3 class="panel-title">交易详情</h3>
          <div class="detail-card">
            <div class="detail-header">
              <span class="detail-id">{{ currentRecord.id }}</span>
              <span :class="['tag', currentRecord.period]">{{ getPeriodLabel(currentRecord.period) }}</span>
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
        <div class="detail-box empty" v-else>
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
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
import * as echarts from 'echarts';
import 'echarts-gl';
import tradeDataRaw from '@/assets/data/lushang_trades.json';
import citiesDataRaw from '@/assets/data/cities.json';

// --- 类型定义 ---
interface TradeGood {
  id: string;
  name: string;
  category: string;
  origin: string[];
  destination: string[];
  peakPeriod: string;
}

interface TradeRecord {
  id: string;
  period: string;
  fromCity: string;
  toCity: string;
  goods: string;
  volume: number;
  value: number;
  route: string;
}

interface City {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

// --- 数据准备 ---
const tradeGoods = ref<TradeGood[]>(tradeDataRaw.tradeGoods as TradeGood[]);
// @ts-ignore - JSON 类型推断可能不包含 tradeRecords，但实际文件中有
const tradeRecords = ref<TradeRecord[]>(tradeDataRaw.tradeRecords || []);
const cities = ref<City[]>(citiesDataRaw.cities as City[]);

// 映射表
const goodsMap = new Map(tradeGoods.value.map(g => [g.id, g]));
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
  military: '军需品'
};

// 城市坐标映射
const cityCoords: Record<string, [number, number]> = {};
const cityAliases: Record<string, string> = {
  "长安": "西安",
  "中原": "洛阳",
  "波斯": "巴格达",
  "大食": "巴格达",
  "欧洲": "君士坦丁堡",
  "罗马": "罗马",
  "天竺": "新德里",
  "印度": "新德里"
};

const initCityCoords = () => {
  cities.value.forEach(city => {
    cityCoords[city.name] = [city.lng, city.lat];
  });
  // 补充坐标
  if (!cityCoords['巴格达']) cityCoords['巴格达'] = [44.361488, 33.312805];
  if (!cityCoords['君士坦丁堡']) cityCoords['君士坦丁堡'] = [28.978359, 41.008238];
  if (!cityCoords['罗马']) cityCoords['罗马'] = [12.496366, 41.902783];
  if (!cityCoords['新德里']) cityCoords['新德里'] = [77.209021, 28.613939];
  if (!cityCoords['洛阳']) cityCoords['洛阳'] = [112.4501, 34.6204];
  if (!cityCoords['景德镇']) cityCoords['景德镇'] = [117.214664, 29.29256];
  if (!cityCoords['杭州']) cityCoords['杭州'] = [120.15507, 30.274085];
  if (!cityCoords['福建']) cityCoords['福建'] = [119.2965, 26.0745];
  if (!cityCoords['苏州']) cityCoords['苏州'] = [120.585315, 31.298886];
  if (!cityCoords['江南']) cityCoords['江南'] = [120.15507, 30.274085];
  if (!cityCoords['和田']) cityCoords['和田'] = [79.922211, 37.114157];
  if (!cityCoords['缅甸']) cityCoords['缅甸'] = [96.199379, 16.871311];
  if (!cityCoords['东南亚']) cityCoords['东南亚'] = [100.501765, 13.756331];
  if (!cityCoords['中亚']) cityCoords['中亚'] = [66.974913, 39.627293];
  if (!cityCoords['西亚']) cityCoords['西亚'] = [51.3890, 35.6892];
  if (!cityCoords['各地']) cityCoords['各地'] = [108.939839, 34.343147];
};

const getCityCoord = (name: string): [number, number] | null => {
  const realName = cityAliases[name] || name;
  return cityCoords[realName] || null;
};

const periods = [
  { label: '全部', value: '' },
  { label: '汉', value: 'han' },
  { label: '唐', value: 'tang' },
  { label: '宋', value: 'song' },
  { label: '元', value: 'yuan' },
  { label: '明', value: 'ming' },
  { label: '清', value: 'qing' },
];

const categories = Object.entries(categoryMap).map(([k, v]) => ({ value: k, label: v }));

// --- 状态 ---
const currentView = ref<'list' | 'map' | 'network'>('list');
const mapLoading = ref(false);
const mapError = ref(false);

const retryLoadMap = () => {
  mapError.value = false;
  updateGlobeChart();
};
const selectedPeriod = ref('');
const selectedCategory = ref('');
const selectedFromCity = ref('');
const selectedToCity = ref('');
const minVal = ref<number | null>(null);
const maxVal = ref<number | null>(null);
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = 20;
const currentRecord = ref<TradeRecord | null>(null);

// Refs for charts
const categoryChartRef = ref<HTMLElement | null>(null);
const topGoodsChartRef = ref<HTMLElement | null>(null);
const globeChartRef = ref<HTMLElement | null>(null);
const networkChartRef = ref<HTMLElement | null>(null);

let categoryChart: echarts.ECharts | null = null;
let topGoodsChart: echarts.ECharts | null = null;
let globeChart: echarts.ECharts | null = null;
let networkChart: echarts.ECharts | null = null;

// --- 计算属性 ---

// 城市列表
const fromCities = computed(() => [...new Set(tradeRecords.value.map(r => r.fromCity))].sort());
const toCities = computed(() => [...new Set(tradeRecords.value.map(r => r.toCity))].sort());

// 过滤后的记录
const filteredRecords = computed(() => {
  return tradeRecords.value.filter(r => {
    const matchPeriod = !selectedPeriod.value || r.period === selectedPeriod.value;
    
    const good = goodsMap.get(r.goods);
    const matchCategory = !selectedCategory.value || (good && good.category === selectedCategory.value);
    
    const matchFrom = !selectedFromCity.value || r.fromCity === selectedFromCity.value;
    const matchTo = !selectedToCity.value || r.toCity === selectedToCity.value;

    const matchMin = minVal.value === null || r.value >= minVal.value;
    const matchMax = maxVal.value === null || r.value <= maxVal.value;

    const query = searchQuery.value.toLowerCase();
    const goodName = good ? good.name : '';
    const matchSearch = !query || 
      r.fromCity.includes(query) || 
      r.toCity.includes(query) || 
      goodName.includes(query) ||
      r.id.toLowerCase().includes(query);

    return matchPeriod && matchCategory && matchFrom && matchTo && matchMin && matchMax && matchSearch;
  });
});

// 分页
const totalPages = computed(() => Math.ceil(filteredRecords.value.length / pageSize));
const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredRecords.value.slice(start, start + pageSize);
});

// 统计
const totalRecords = computed(() => tradeRecords.value.length);
const totalValue = computed(() => filteredRecords.value.reduce((sum, r) => sum + r.value, 0));
const totalVolume = computed(() => filteredRecords.value.reduce((sum, r) => sum + r.volume, 0));

// --- 辅助函数 ---
const getGoodsName = (id: string) => goodsMap.get(id)?.name || id;
const getGoodsCategoryLabel = (id: string) => {
  const cat = goodsMap.get(id)?.category;
  return cat ? (categoryMap[cat] || cat) : '未知';
};
const getPeriodLabel = (val: string) => periods.find(p => p.value === val)?.label || val;
const formatNumber = (num: number | null) => {
  if (num === null) return '-';
  return new Intl.NumberFormat('zh-CN').format(num);
};
const formatMoney = (num: number) => `🪙 ${new Intl.NumberFormat('zh-CN').format(num)}`;

const selectRecord = (record: TradeRecord) => {
  currentRecord.value = record;
};

// --- 图表逻辑 ---

const updateCharts = () => {
  if (!categoryChart || !topGoodsChart) return;

  // 1. 类别占比 (基于当前过滤结果)
  const catCounts: Record<string, number> = {};
  filteredRecords.value.forEach(r => {
    const good = goodsMap.get(r.goods);
    if (good) {
      const catName = categoryMap[good.category] || good.category;
      catCounts[catName] = (catCounts[catName] || 0) + r.value; // 按价值统计
    }
  });
  
  const catData = Object.entries(catCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  categoryChart.setOption({
    backgroundColor: 'transparent',
    tooltip: { 
      trigger: 'item', 
      formatter: '{b}: {c} ({d}%)',
      confine: true,
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      borderColor: '#334155',
      textStyle: { color: '#f1f5f9' }
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '50%'],
      itemStyle: { borderRadius: 5, borderColor: '#1e293b', borderWidth: 2 },
      label: { show: false },
      data: catData
    }]
  });

  // 2. 热门商品 (基于当前过滤结果)
  const goodCounts: Record<string, number> = {};
  filteredRecords.value.forEach(r => {
    const name = getGoodsName(r.goods);
    goodCounts[name] = (goodCounts[name] || 0) + r.volume; // 按交易量
  });

  const topGoods = Object.entries(goodCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  topGoodsChart.setOption({
    backgroundColor: 'transparent',
    tooltip: { 
      trigger: 'axis',
      confine: true,
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      borderColor: '#334155',
      textStyle: { color: '#f1f5f9' }
    },
    grid: { left: '3%', right: '10%', bottom: '3%', top: '3%', containLabel: true },
    xAxis: { type: 'value', splitLine: { show: false }, axisLabel: { show: false } },
    yAxis: { 
      type: 'category', 
      data: topGoods.map(i => i[0]).reverse(),
      axisLabel: { color: '#cbd5e1' },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: [{
      type: 'bar',
      data: topGoods.map(i => i[1]).reverse(),
      itemStyle: { color: '#3b82f6', borderRadius: [0, 4, 4, 0] },
      label: { show: true, position: 'right', color: '#fff' }
    }]
  });

  // 3. 3D 地球 (如果可见)
  if (currentView.value === 'map' && globeChart) {
    updateGlobeChart();
  }

  // 4. 关系网络 (如果可见)
  if (currentView.value === 'network' && networkChart) {
    updateNetworkChart();
  }
};

const updateGlobeChart = async () => {
  if (!globeChart) return;

  // 检查是否已注册地图数据，如果没有则加载
  // @ts-ignore
  if (!echarts.getMap('world')) {
    try {
      mapLoading.value = true;
      mapError.value = false;
      // 使用更稳定的 CDN
      const res = await fetch('https://cdn.jsdelivr.net/npm/echarts@4.9.0/map/json/world.json');
      if (!res.ok) throw new Error('Network response was not ok');
      const worldJson = await res.json();
      echarts.registerMap('world', worldJson);
      mapLoading.value = false;
    } catch (e) {
      console.error('Failed to load world map data', e);
      mapLoading.value = false;
      mapError.value = true;
      return;
    }
  }
  
  const linesData: any[] = [];
  const scatterData: any[] = [];
  const addedCities = new Set<string>();
  const MAP_HEIGHT = 0.4; // 地图厚度（减小以匹配视觉比例）

  filteredRecords.value.forEach(r => {
    const fromCoord = getCityCoord(r.fromCity);
    const toCoord = getCityCoord(r.toCity);

    if (fromCoord && toCoord) {
      if (!addedCities.has(r.fromCity)) {
        // 节点坐标增加高度信息，紧贴地图表面（更微小的偏移）
        scatterData.push({ name: r.fromCity, value: [...fromCoord, MAP_HEIGHT + 0.0001] });
        addedCities.add(r.fromCity);
      }
      if (!addedCities.has(r.toCity)) {
        scatterData.push({ name: r.toCity, value: [...toCoord, MAP_HEIGHT + 0.0001] });
        addedCities.add(r.toCity);
      }

      // 连线坐标增加高度信息
      linesData.push({
        coords: [
          [...fromCoord, MAP_HEIGHT + 0.0001], 
          [...toCoord, MAP_HEIGHT + 0.0001]
        ],
        lineStyle: {
          color: r.period === 'tang' ? '#f59e0b' : (r.period === 'han' ? '#ef4444' : '#3b82f6'),
          curveness: 0
        }
      });
    }
  });

  globeChart.setOption({
    backgroundColor: 'transparent',
    geo3D: {
      map: 'world',
      shading: 'lambert',
      regionHeight: MAP_HEIGHT,
      boxHeight: 1,
      environment: '#000000', // 背景环境色设为黑色
      
      itemStyle: {
        color: '#1e293b',
        opacity: 1,
        borderWidth: 0.5,
        borderColor: '#475569'
      },
      
      groundPlane: {
        show: false,
        color: '#000000'
      },
      
      light: {
        main: {
          intensity: 0.8, // 降低主光强度
          shadow: true,
          shadowQuality: 'high',
          alpha: 30,
          beta: 30
        },
        ambient: {
          intensity: 0.2 // 降低环境光
        }
      },
      
      viewControl: {
        distance: 80,
        alpha: 40,
        beta: 0,
        minAlpha: 20,
        maxAlpha: 80,
        panMouseButton: 'left',
        rotateMouseButton: 'right',
        center: [10, 0, 0]
      },

      postEffect: {
        enable: true,
        bloom: {
          enable: false,
          bloomIntensity: 0
        },
        SSAO: {
          enable: true,
          radius: 1.2,
          intensity: 0.5
        }
      }
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
          // 使用更柔和的淡蓝色半透明以减弱亮度
          trailColor: 'rgba(160,200,255,0.12)'
        },
        // 取消叠加混合，避免亮度叠加
        blendMode: 'normal',
        lineStyle: {
          width: 1,
          // 适度提高线条可见性但仍保持柔和
          opacity: 0.45,
          curveness: 0
        },
        data: linesData
      },
      {
        type: 'scatter3D',
        coordinateSystem: 'geo3D',
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: {
          color: '#4ade80',
          opacity: 1
        },
        label: {
          show: true,
          position: 'right',
          distance: 6,
          formatter: '{b}',
          textStyle: {
            color: '#fff',
            fontSize: 12,
            backgroundColor: 'rgba(0,0,0,0.6)',
            padding: [2, 4],
            borderRadius: 2
          }
        },
        data: scatterData
      }
    ]
  });
  
  // 清除可能存在的 globe 配置
  // @ts-ignore
  globeChart.setOption({ globe: null }, { replaceMerge: ['globe'] });
};

const updateNetworkChart = () => {
  if (!networkChart) return;

  const nodes: any[] = [];
  const links: any[] = [];
  const nodeSet = new Set<string>();
  const linkMap = new Map<string, number>();

  // 聚合数据：城市 -> 城市 的贸易量
  filteredRecords.value.forEach(r => {
    if (!nodeSet.has(r.fromCity)) {
      nodes.push({ name: r.fromCity, category: 0, symbolSize: 10, value: 0 });
      nodeSet.add(r.fromCity);
    }
    if (!nodeSet.has(r.toCity)) {
      nodes.push({ name: r.toCity, category: 0, symbolSize: 10, value: 0 });
      nodeSet.add(r.toCity);
    }

    const linkKey = `${r.fromCity}-${r.toCity}`;
    linkMap.set(linkKey, (linkMap.get(linkKey) || 0) + r.volume);
  });

  // 生成 Links
  linkMap.forEach((vol, key) => {
    const [source, target] = key.split('-');
    links.push({ source, target, value: vol, lineStyle: { width: Math.min(vol / 100, 5) } });
  });

  // 调整节点大小
  nodes.forEach(n => {
    // 简单逻辑：连接数越多越大
    const count = links.filter(l => l.source === n.name || l.target === n.name).length;
    n.symbolSize = 10 + count * 2;
  });

  networkChart.setOption({
    backgroundColor: 'transparent',
    tooltip: {},
    series: [
      {
        type: 'graph',
        layout: 'force',
        data: nodes,
        links: links,
        roam: true,
        label: { show: true, position: 'right', color: '#fff' },
        force: { repulsion: 200, edgeLength: 100 },
        lineStyle: { color: '#3b82f6', curveness: 0.2, opacity: 0.6 },
        itemStyle: { color: '#10b981' }
      }
    ]
  });
};

// --- 生命周期 ---
watch([selectedPeriod, selectedCategory, selectedFromCity, selectedToCity, minVal, maxVal, searchQuery], () => {
  currentPage.value = 1;
  updateCharts();
});

watch(currentView, async (newView) => {
  await nextTick();
  if (newView === 'map') {
    if (!globeChart && globeChartRef.value) {
      globeChart = echarts.init(globeChartRef.value, 'dark');
    }
    updateGlobeChart();
    globeChart?.resize();
  } else if (newView === 'network') {
    if (!networkChart && networkChartRef.value) {
      networkChart = echarts.init(networkChartRef.value, 'dark');
    }
    updateNetworkChart();
    networkChart?.resize();
  }
});

onMounted(async () => {
  initCityCoords();
  await nextTick();
  
  if (categoryChartRef.value) {
    categoryChart = echarts.init(categoryChartRef.value, 'dark');
  }
  if (topGoodsChartRef.value) {
    topGoodsChart = echarts.init(topGoodsChartRef.value, 'dark');
  }

  updateCharts();
  window.addEventListener('resize', () => {
    categoryChart?.resize();
    topGoodsChart?.resize();
    globeChart?.resize();
    networkChart?.resize();
  });
});

onUnmounted(() => {
  categoryChart?.dispose();
  topGoodsChart?.dispose();
  globeChart?.dispose();
  networkChart?.dispose();
});
</script>

<style scoped lang="scss">
.trade-analysis-container {
  width: 100%;
  height: 100vh;
  background-color: #0f172a;
  color: #e2e8f0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.page-header {
  padding: 1rem 2rem;
  background: #1e293b;
  border-bottom: 1px solid #334155;
  flex-shrink: 0;

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  h1 {
    margin: 0;
    font-size: 1.5rem;
    color: #f8fafc;
  }
  
  .subtitle {
    color: #94a3b8;
    font-size: 0.85rem;
    margin-top: 0.25rem;
  }

  .header-stats {
    display: flex;
    gap: 1rem;
  }

  .stat-pill {
    background: #334155;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;

    .label { font-size: 0.75rem; color: #94a3b8; }
    .value { font-size: 1.1rem; font-weight: bold; color: #60a5fa; }
  }
}

.dashboard-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 300px 1fr 320px;
  gap: 1px; // Grid lines via background
  background: #334155; // Border color
  min-height: 0;
}

.panel {
  background: #0f172a;
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
  color: #f1f5f9;
  font-weight: 600;
  border-left: 3px solid #3b82f6;
  padding-left: 0.5rem;
}

// --- Left Panel ---
.control-box {
  background: #1e293b;
  padding: 1rem;
  border-radius: 8px;
}

.filter-group {
  margin-bottom: 1.25rem;
  
  label {
    display: block;
    font-size: 0.8rem;
    color: #94a3b8;
    margin-bottom: 0.5rem;
  }
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-btn {
  background: #334155;
  border: none;
  color: #cbd5e1;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover { background: #475569; }
  &.active { background: #3b82f6; color: white; }
}

.filter-select, .search-input, .range-input {
  width: 100%;
  background: #0f172a;
  border: 1px solid #334155;
  color: white;
  padding: 0.5rem;
  border-radius: 4px;
  outline: none;
  
  &:focus { border-color: #3b82f6; }
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
    color: #94a3b8;
  }
}

.chart-box {
  background: #1e293b;
  padding: 1rem;
  border-radius: 8px;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 250px;
}

.chart-title {
  font-size: 0.9rem;
  color: #cbd5e1;
  margin: 0 0 0.5rem 0;
  text-align: center;
}

.chart-container {
  flex: 1;
  width: 100%;
}

.panel-tabs {
  display: flex;
  gap: 1rem;
  padding: 0.5rem 1rem;
  background: #1e293b;
  border-bottom: 1px solid #334155;
}

.tab-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;

  &:hover { color: #cbd5e1; }
  &.active { color: #60a5fa; border-bottom-color: #60a5fa; font-weight: bold; }
}

.chart-view-container {
  flex: 1;
  width: 100%;
  height: 100%;
  position: relative;
  background: #0f172a;
}

.full-chart {
  width: 100%;
  height: 100%;
}

// --- Center Panel (List) ---
.data-list-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #1e293b;
  border-radius: 0 0 8px 8px; // Adjust radius
  overflow: hidden;
}

.list-header {
  display: flex;
  background: #334155;
  padding: 0.75rem 1rem;
  font-weight: 600;
  font-size: 0.85rem;
  color: #e2e8f0;
  
  .col { padding: 0 0.5rem; }
}

.list-body {
  flex: 1;
  overflow-y: auto;
  
  .list-row {
    display: flex;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #334155;
    cursor: pointer;
    transition: background 0.2s;
    align-items: center;

    &:hover { background: #283548; }
    &.active { background: rgba(59, 130, 246, 0.15); border-left: 3px solid #3b82f6; }
  }
}

.col {
  &.col-id { width: 80px; color: #64748b; font-size: 0.8rem; }
  &.col-period { width: 60px; }
  &.col-route { flex: 2; }
  &.col-goods { flex: 1.5; }
  &.col-amount { width: 80px; text-align: right; }
  &.col-value { width: 100px; text-align: right; color: #fbbf24; }
}

.tag {
  font-size: 0.75rem;
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  background: #475569;
  
  &.han { background: #7f1d1d; color: #fecaca; }
  &.tang { background: #7c2d12; color: #fed7aa; }
  &.song { background: #14532d; color: #bbf7d0; }
  &.yuan { background: #1e3a8a; color: #bfdbfe; }
  &.ming { background: #4c1d95; color: #e9d5ff; }
}

.route-flow {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  .arrow { color: #64748b; }
}

.goods-info {
  display: flex;
  flex-direction: column;
  .goods-name { font-weight: 500; }
  .goods-cat { font-size: 0.75rem; color: #94a3b8; }
}

.pagination-bar {
  padding: 0.75rem;
  background: #1e293b;
  border-top: 1px solid #334155;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  font-size: 0.85rem;

  button {
    background: #334155;
    border: none;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    cursor: pointer;
    &:disabled { opacity: 0.5; cursor: not-allowed; }
    &:hover:not(:disabled) { background: #475569; }
  }
}

// --- Right Panel ---
.detail-box {
  background: #1e293b;
  padding: 1rem;
  border-radius: 8px;
  
  &.empty {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    height: 200px;
  }
}

.detail-card {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 1rem;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  .detail-id { color: #64748b; font-family: monospace; }
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
    background: #334155;
    margin: 0 1rem;
    position: relative;
    &::after {
      content: '>';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #64748b;
      background: #0f172a;
      padding: 0 0.25rem;
    }
  }
}

.city-node {
  text-align: center;
  .city-name { font-size: 1.1rem; font-weight: bold; color: #e2e8f0; }
  .city-label { font-size: 0.75rem; color: #64748b; }
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.detail-item {
  .value { font-size: 1rem; color: #e2e8f0; }
  .value.highlight { color: #60a5fa; font-weight: bold; }
  .value.money { color: #fbbf24; }
  label { font-size: 0.75rem; color: #64748b; display: block; margin-bottom: 0.25rem; }
}

// Scrollbar
.custom-scrollbar {
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: #1e293b; }
  &::-webkit-scrollbar-thumb { background: #475569; border-radius: 3px; }
  &::-webkit-scrollbar-thumb:hover { background: #64748b; }
}

.loading-overlay, .error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(15, 23, 42, 0.8);
  z-index: 10;
  color: #e2e8f0;
  gap: 1rem;

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #334155;
    border-top-color: #60a5fa;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  button {
    padding: 0.5rem 1rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    &:hover { background: #2563eb; }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
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
    .detail-box, .chart-box { flex: 1; }
  }
}

@media (max-width: 768px) {
  .dashboard-grid { grid-template-columns: 1fr; }
  .right-panel { flex-direction: column; }
}
</style>
