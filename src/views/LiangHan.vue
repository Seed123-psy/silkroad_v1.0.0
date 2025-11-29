<template>
  <div class="transport-view">
    <div ref="mapContainer" class="map-container" />

    <!-- 地图模式和样式切换控件（复用组件） -->
    <MapControls
      v-model:modelMode="selectedMode"
      v-model:modelStyle="selectedStyle"
      :modes="MAP_MODES"
      :styles="MAP_STYLES"
      modePlaceholder="选择显示模式"
      stylePlaceholder="选择地图样式"
    />

    <!-- 时间轴组件：居中底部，毛玻璃半透明效果 -->
    <div class="timeline-glass">
      <div class="timeline-labels">
        <span class="timeline-mark" @click="setYear(startYear)">{{ formatYearLabel(startYear) }}</span>
        <input type="range" :min="startYear" :max="endYear" v-model.number="selectedYear" class="timeline-slider" />
        <span class="timeline-mark" @click="setYear(endYear)">{{ formatYearLabel(endYear) }}</span>
        <button
          type="button"
          class="timeline-play"
          :class="{ playing: isPlaying }"
          @click="togglePlay"
          :aria-pressed="isPlaying"
          aria-label="播放/暂停两汉交通时间轴"
        >
          <span v-if="!isPlaying">▶ 播放</span>
          <span v-else>❚❚ 暂停</span>
        </button>
      </div>
      <div class="timeline-selected">当前年份：<span class="highlight">{{ formatYearLabel(selectedYear) }}</span></div>
    </div>

    <transition name="legend">
      <div class="legend-panel" v-if="showLegend" @mouseleave="showLegend = false">
        <h4>节点类型</h4>
        <div class="legend-select-all">
          <label class="legend-item">
            <input
              type="checkbox"
              class="legend-checkbox"
              :checked="allTypesSelected"
              @change="onTypeSelectAll($event)"
            />
            <div class="legend-text">
              <strong>全选类型</strong>
              <span>快速切换全部类别</span>
            </div>
          </label>
        </div>
        <ul>
          <li v-for="type in POINT_TYPE_CATEGORIES" :key="type.key">
            <label class="legend-item">
              <input
                type="checkbox"
                class="legend-checkbox"
                :checked="Boolean(typeFilters[type.key])"
                @change="onTypeToggle(type.key, $event)"
              />
              <span class="swatch" :style="{ backgroundColor: type.color }" />
              <div class="legend-text">
                <strong>{{ type.label }}</strong>
                <span>{{ type.description }}</span>
              </div>
            </label>
          </li>
        </ul>
        <p class="legend-note">数据来源：两汉交通节点。</p>
      </div>
    </transition>
    <button
      v-if="!showLegend"
      class="legend-toggle"
      @mouseenter="showLegend = true"
      @focus="showLegend = true"
      aria-label="展开节点类型图例"
    >类型</button>

    <transition name="slide">
      <div class="hover-panel compact" v-if="hoverPanel.show">
        <div class="hover-top">
          <div class="icon-wrap" :style="{ borderColor: hoverPanel.props?.color || '#e67e22' }">
            <div class="icon-core" :style="{ backgroundColor: hoverPanel.props?.color || '#e67e22' }" />
          </div>
          <div class="hover-title">
            <h4 class="title">{{ hoverPanel.props?.name }}</h4>
            <div v-if="hoverPanel.props?.subtitle" class="subtitle">{{ hoverPanel.props?.subtitle }}</div>
          </div>
          <div class="meta" v-if="hoverPanel.props?.badge">
            <span class="badge small" :style="{ backgroundColor: hoverPanel.props?.color || '#e67e22' }">{{ hoverPanel.props?.badge }}</span>
          </div>
        </div>

        <div class="hover-body">
          <div class="row" v-for="row in hoverPanel.props?.rows || []" :key="row.label">
            <div class="label">{{ row.label }}</div>
            <div class="value">{{ row.value }}</div>
          </div>
        </div>
      </div>
    </transition>
    <!-- 手势控制 UI -->
    <div class="gesture-controls">
      <button class="gesture-btn" @click="toggleCamera" :class="{ active: isCameraOpen }">
        <span class="icon">📷</span>
        {{ isCameraOpen ? '关闭手势' : '开启手势' }}
      </button>
      
      <div v-show="isCameraOpen" class="camera-wrapper">
        <video ref="videoRef" class="input_video" autoplay playsinline></video>
        <canvas ref="canvasRef" class="output_canvas"></canvas>
        <div class="gesture-status">
          <p>状态: {{ gestureStatus }}</p>
          <p class="hint">单手捏合: 移动 | 单手张开: 旋转/倾斜 | 双手开合: 缩放</p>
        </div>
      </div>
    </div>

    <!-- WASD 漫游提示 -->
    <div class="wasd-controls">
      <!-- 移动 -->
      <div class="control-section">
        <div class="key w" :class="{ active: keysPressed.w }">W</div>
        <div class="keys-row">
          <div class="key a" :class="{ active: keysPressed.a }">A</div>
          <div class="key s" :class="{ active: keysPressed.s }">S</div>
          <div class="key d" :class="{ active: keysPressed.d }">D</div>
        </div>
        <div class="label">移动</div>
      </div>
      
      <div class="divider"></div>

      <!-- 升降 -->
      <div class="control-section">
        <div class="key q" :class="{ active: keysPressed.q }">Q</div>
        <div class="key e" :class="{ active: keysPressed.e }">E</div>
        <div class="label">升降</div>
      </div>

      <div class="divider"></div>

      <!-- 旋转 -->
      <div class="control-section">
        <div class="key up" :class="{ active: keysPressed.arrowup }">↑</div>
        <div class="keys-row">
          <div class="key left" :class="{ active: keysPressed.arrowleft }">←</div>
          <div class="key down" :class="{ active: keysPressed.arrowdown }">↓</div>
          <div class="key right" :class="{ active: keysPressed.arrowright }">→</div>
        </div>
        <div class="label">旋转</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { unzipSync } from 'fflate'
import { open as openShapefile } from 'shapefile'
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useGestureControl } from '@/composables/useGestureControl'
import { liangHanRouteNarratives, type RouteNarrativeBlock } from '@/assets/data/liangHan/routeNarratives'

// 导入 Mapbox GL（需先安装 `mapbox-gl`）
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import MapControls from '@/components/MapControls.vue'
import type { HanLineFeature, HanLineProperties, HanPointFeature, HanPointProperties, HanPointRecord } from '@/types/lianghan'

// 从环境变量读取 token（Vite 要求以 VITE_ 前缀暴露给客户端）
const MAPBOX_TOKEN = (import.meta.env.VITE_MAPBOX_TOKEN as string) || ''
if (!MAPBOX_TOKEN) {
  // eslint-disable-next-line no-console
  console.warn('VITE_MAPBOX_TOKEN 未配置，Mapbox 地图可能无法正常加载。请在 .env 中设置 VITE_MAPBOX_TOKEN。')
}

const mapContainer = ref<HTMLDivElement | null>(null)
let map: any = null
let isOverPoint = false
let isMouseDown = false
// let lastFeatureKey = ''
// let popupTimer: any = null
// let pendingFeatureKey = ''
// let activeHoverSource: 'point' | 'line' | null = null

// --- 手势控制逻辑 ---
const { 
  isCameraOpen, 
  videoRef, 
  canvasRef, 
  gestureStatus, 
  toggleCamera, 
  setCallbacks 
} = useGestureControl()

setCallbacks(
  (deltaX, deltaY) => {
    if (map) {
      // 摄像头是镜像的，且 delta 是归一化坐标
      // 移动灵敏度
      const sensitivity = 1000 
      // 反转 X 轴以匹配镜像，反转 Y 轴以匹配屏幕坐标系
      map.panBy([-deltaX * sensitivity, -deltaY * sensitivity], { animate: false })
    }
  },
  (zoomFactor) => {
    if (map) {
      const currentZoom = map.getZoom()
      // 缩放灵敏度
      const sensitivity = 0.3
      const deltaZoom = (zoomFactor - 1) * sensitivity * 10 // 放大系数
      map.setZoom(currentZoom + deltaZoom)
    }
  },
  (deltaX, deltaY) => {
    if (map) {
      // 旋转灵敏度
      const rotateSensitivity = 50
      const pitchSensitivity = 50

      const currentBearing = map.getBearing()
      const currentPitch = map.getPitch()

      // deltaX > 0 (向右) -> 逆时针旋转 -> bearing 减小
      const newBearing = currentBearing - deltaX * rotateSensitivity
      
      // deltaY > 0 (向下) -> 视角变低 -> pitch 减少
      // deltaY < 0 (向上) -> 视角变高 -> pitch 增加
      const newPitch = currentPitch - deltaY * pitchSensitivity

      map.jumpTo({
        bearing: newBearing,
        pitch: Math.max(0, Math.min(85, newPitch))
      })
    }
  }
)

// 键盘控制状态
const keysPressed = reactive({ 
  w: false, a: false, s: false, d: false,
  q: false, e: false,
  arrowup: false, arrowdown: false, arrowleft: false, arrowright: false
})
let animationFrameId: number | null = null

// 地图显示模式
const MAP_MODES = [
  { id: 'flat', name: '平面' },
  { id: 'globe', name: '球形' },
  { id: 'terrain', name: '立体' },
]
// 将暗色样式放在首位，便于将两汉交通默认初始化为暗色主题
const MAP_STYLES: { id: string; name: string }[] = [
  { id: 'mapbox://styles/mapbox/dark-v10', name: '暗色' },
  { id: 'mapbox://styles/mapbox/streets-v11', name: '街道' },
  { id: 'mapbox://styles/mapbox/light-v10', name: '明亮' },
  { id: 'mapbox://styles/mapbox/satellite-v9', name: '卫星' },
  { id: 'mapbox://styles/mapbox/satellite-streets-v11', name: '卫星街道' },
  { id: 'mapbox://styles/mapbox/outdoors-v11', name: '户外' },
  { id: 'mapbox://styles/mapbox/navigation-day-v1', name: '导航（日）' },
  { id: 'mapbox://styles/mapbox/navigation-night-v1', name: '导航（夜）' },
]
const selectedMode = ref<string>('flat')
// 默认使用数组第一项（已将暗色置为第一项），保证初始化为暗色地图
const selectedStyle = ref<string>(MAP_STYLES[0]?.id || 'mapbox://styles/mapbox/dark-v10')

// 交通点和交通线数据
const westernPoints = ref<HanPointFeature[]>([])
const easternPoints = ref<HanPointFeature[]>([])
const filteredWesternPoints = ref<HanPointFeature[]>([])
const filteredEasternPoints = ref<HanPointFeature[]>([])
const hanRoutes = ref<HanLineFeature[]>([])
const datasetReady = ref(false)
const isDataLoading = ref(false)

type HanAttributeTable = { headers: string[]; records: HanPointRecord[] }
type PointPropsWithoutCoord = Omit<HanPointProperties, 'coordinates'>
interface NormalizedPointRecord {
  matchKey: string
  altKeys: string[]
  props: PointPropsWithoutCoord
}
type LayerMouseEvent = {
  features?: Array<{ properties?: any; geometry?: GeoJSON.Geometry }>
  lngLat: { lng: number; lat: number }
}

// 两汉时期：公元前202年 - 公元220年
const startYear = -202
const endYear = 220
const selectedYear = ref(startYear)
const setYear = (year: number) => {
  selectedYear.value = year
}

// 内部用于播放的浮点年份（用于平滑播放），与 `selectedYear`（用于 UI）分离
const playYear = ref<number>(selectedYear.value)

// 当用户手动通过滑块设置年份时，同步 playYear 并渲染
watch(selectedYear, (year) => {
  playYear.value = year
  filterByYear(year)
})


// 时间轴播放控制（平滑过渡）
const isPlaying = ref(false)
const playbackSpeed = ref<number>(5) // 年/秒，可根据需求暴露为 UI
let rafId: number | null = null
let lastFrameTime = 0
// 地形夸张值（设为 2.5，用于增强立体感；globe 模式将不启用地形）
const terrainExaggeration = ref<number>(2.5)

const WESTERN_POINTS_ZIP_URL = '/data/lianghan/western_han_points.zip'
const EASTERN_POINTS_ZIP_URL = '/data/lianghan/eastern_han_points.zip'
const HAN_ROUTES_ZIP_URL = '/data/lianghan/han_silk_road.zip'

const DATASET_COLOR_MAP: Record<HanPointProperties['dataset'], string> = {
  western: '#f3a712',
  eastern: '#4fa8ff'
}

const DATASET_LABEL_MAP: Record<HanPointProperties['dataset'], string> = {
  western: '西汉交通点',
  eastern: '东汉交通点'
}

const POINT_TYPE_COLOR_MAP: Record<string, string> = {
  关隘: '#ff6b6b',
  县级驻所: '#ffa62b',
  城市: '#ffd166',
  城门: '#f7d1cd',
  桥梁: '#8ecae6',
  沙漠: '#e29578',
  渡口: '#00b4d8',
  湖泊: '#118ab2',
  聚邑: '#86c06c',
  郡级驻所: '#ff9f1c',
  都城: '#f94144',
  都尉治所: '#6a4c93',
  驿站: '#2ec4b6',
  其他节点: '#f6c177'
}

const DEFAULT_POINT_TYPE_KEY = '其他节点'

const POINT_TYPE_CATEGORIES = [
  { key: '都城', label: '都城', description: '帝国首府或行在', color: POINT_TYPE_COLOR_MAP['都城'] },
  { key: '都尉治所', label: '都尉治所', description: '边防军政指挥机构', color: POINT_TYPE_COLOR_MAP['都尉治所'] },
  { key: '郡级驻所', label: '郡级驻所', description: '郡国/属国治所', color: POINT_TYPE_COLOR_MAP['郡级驻所'] },
  { key: '县级驻所', label: '县级驻所', description: '县城与行政节点', color: POINT_TYPE_COLOR_MAP['县级驻所'] },
  { key: '城市', label: '城市', description: '区域内重要城市', color: POINT_TYPE_COLOR_MAP['城市'] },
  { key: '聚邑', label: '聚邑', description: '聚落与市镇', color: POINT_TYPE_COLOR_MAP['聚邑'] },
  { key: '驿站', label: '驿站', description: '官方传递网络', color: POINT_TYPE_COLOR_MAP['驿站'] },
  { key: '关隘', label: '关隘', description: '山口与防线门户', color: POINT_TYPE_COLOR_MAP['关隘'] },
  { key: '城门', label: '城门', description: '城池出入口', color: POINT_TYPE_COLOR_MAP['城门'] },
  { key: '桥梁', label: '桥梁', description: '跨河交通节点', color: POINT_TYPE_COLOR_MAP['桥梁'] },
  { key: '渡口', label: '渡口', description: '河流/水网渡点', color: POINT_TYPE_COLOR_MAP['渡口'] },
  { key: '湖泊', label: '湖泊', description: '水域交通据点', color: POINT_TYPE_COLOR_MAP['湖泊'] },
  { key: '沙漠', label: '沙漠', description: '荒漠行经节点', color: POINT_TYPE_COLOR_MAP['沙漠'] },
  { key: '其他节点', label: '其他节点', description: '未注明或杂项节点', color: POINT_TYPE_COLOR_MAP['其他节点'] }
]

const POINT_TYPE_SYNONYM_MAP: Record<string, string> = {
  pass: '关隘',
  gate: '关隘',
  gatehouse: '城门',
  fortress: '关隘',
  stronghold: '关隘',
  border: '关隘',
  post: '驿站',
  station: '驿站',
  relay: '驿站',
  courier: '驿站',
  courierstation: '驿站',
  courier_station: '驿站',
  ferry: '渡口',
  port: '渡口',
  harbor: '渡口',
  wharf: '渡口',
  bridge: '桥梁',
  city: '城市',
  town: '聚邑',
  market: '聚邑',
  oasis: '聚邑',
  desert: '沙漠',
  dune: '沙漠',
  lake: '湖泊',
  reservoir: '湖泊',
  capital: '都城',
  metropolis: '都城',
  commandery: '郡级驻所',
  prefecture: '郡级驻所',
  county: '县级驻所',
  countyseat: '县级驻所',
  'county-seat': '县级驻所',
  countycity: '县级驻所',
  duwei: '都尉治所',
  garrison: '都尉治所',
  controloffice: '都尉治所',
  '县治': '县级驻所',
  '郡治': '郡级驻所',
  '郡府': '郡级驻所',
  '都尉': '都尉治所',
  '邮驿': '驿站',
  '津渡': '渡口',
  '水门': '渡口',
  '边塞': '关隘'
}

const typeFilters = reactive<Record<string, boolean>>(POINT_TYPE_CATEGORIES.reduce((acc, type) => {
  acc[type.key] = true
  return acc
}, {} as Record<string, boolean>))

const showLegend = ref(true)

const allTypesSelected = computed({
  get: () => POINT_TYPE_CATEGORIES.every((cat) => typeFilters[cat.key]),
  set: (value: boolean) => {
    POINT_TYPE_CATEGORIES.forEach((cat) => {
      typeFilters[cat.key] = value
    })
  }
})

watch(typeFilters, () => {
  filterByYear(selectedYear.value)
}, { deep: true })

const POINT_COLOR_EXPRESSION = buildPointColorExpression()

const ROUTE_COLOR_MAP: Record<string, string> = {
  长安萧关道: '#ff5e57',
  长安汧县道: '#ff884e',
  凤翔灵台道: '#ffa94d',
  西域南道: '#10ac84',
  丝路中段新北道: '#2e86de',
  西域北道: '#5f27cd',
  婼羌道: '#ff6b6b',
  陇关道: '#ff9f43',
  河西走廊道: '#54a0ff',
  丝路西段: '#f368e0',
  略阳道: '#1dd1a1',
  回中道: '#ffcd3c',
  萧关道: '#48dbfb',
  河湟道: '#9B6B4A'
}

const ROUTE_COLOR_PALETTE = ['#ff5e57', '#ff884e', '#ffa94d', '#ffcd3c', '#10ac84', '#9B6B4A', '#48dbfb', '#2e86de', '#5f27cd', '#f368e0', '#ff6b6b', '#1dd1a1']

const HAN_LAYER_IDS = {
  west: { source: 'han-west-points', layer: 'han-west-points-circle' },
  east: { source: 'han-east-points', layer: 'han-east-points-circle' },
  route: { source: 'han-routes', layer: 'han-routes-line' }
} as const

// 当用户调整夸张值时，实时更新 map 的 terrain 与 hillshade 表现
watch(terrainExaggeration, (val) => {
  try {
    if (map && map.setTerrain) {
      map.setTerrain({ source: 'mapbox-dem', exaggeration: val })
    }
    if (map && map.getLayer && map.getLayer('hillshade-layer')) {
      try { map.setPaintProperty('hillshade-layer', 'hillshade-exaggeration', Math.max(0.2, val * 0.8)) } catch (e) {}
    }
 
  } catch (e) {}
})

// 交互优化：在用户交互（拖动/缩放/旋转/倾斜）期间降低 hillshade 强度，交互结束后恢复
let savedHillEx: number | null = null
let interactionTimer: any = null

interface HoverPanelRow {
  label: string
  value: string
}

interface HoverPanelContent {
  name: string
  subtitle?: string
  badge?: string
  color?: string
  rows: HoverPanelRow[]
}

const hoverPanel = ref<{ show: boolean; props?: HoverPanelContent }>({ show: false })

function onTypeToggle(key: string, event: Event) {
  const target = event.target as HTMLInputElement | null
  typeFilters[key] = Boolean(target?.checked)
}

function onTypeSelectAll(event: Event) {
  const target = event.target as HTMLInputElement | null
  allTypesSelected.value = Boolean(target?.checked)
}

function reduceTerrainForInteraction() {
  if (!map) return
  try {
    if (map.getLayer && map.getLayer('hillshade-layer')) {
      try {
        if (savedHillEx === null) savedHillEx = map.getPaintProperty('hillshade-layer', 'hillshade-exaggeration') as number || 0.8
        map.setPaintProperty('hillshade-layer', 'hillshade-exaggeration', 0.18)
      } catch (e) {}
    }
  } catch (e) {}
  // 如果用户持续交互，延迟恢复会被重置
  if (interactionTimer) clearTimeout(interactionTimer)
}

function restoreTerrainAfterInteraction() {
  if (!map) return
  // 延迟一点再恢复，避免短促拖动导致频繁切换
  if (interactionTimer) clearTimeout(interactionTimer)
  interactionTimer = setTimeout(() => {
    try {
      if (map.getLayer && map.getLayer('hillshade-layer')) {
        try {
          const ex = (typeof terrainExaggeration !== 'undefined') ? terrainExaggeration.value : 0.8
          map.setPaintProperty('hillshade-layer', 'hillshade-exaggeration', Math.max(0.2, ex * 0.8))
        } catch (e) {}
      }
    } catch (e) {}
    savedHillEx = null
    interactionTimer = null
  }, 220)
}

function step(timestamp: number) {
  if (!lastFrameTime) lastFrameTime = timestamp
  const delta = timestamp - lastFrameTime
  lastFrameTime = timestamp
  const yearsToAdvance = (delta / 1000) * playbackSpeed.value

  // 使用 playYear 做浮点累加以获得平滑过渡
  playYear.value += yearsToAdvance

  // 到达末端时停止并确保到达 endYear
  if (playYear.value >= endYear) {
    playYear.value = endYear
    // 用浮点值渲染（filterByYear 支持数值比较）
    filterByYear(playYear.value)
    selectedYear.value = Math.round(playYear.value)
    stopPlayback()
    return
  }

  // 使用 playYear 驱动渲染，UI 仍显示为四舍五入的整数
  filterByYear(playYear.value)
  selectedYear.value = Math.round(playYear.value)
  rafId = requestAnimationFrame(step)
}

function startPlayback() {
  if (isPlaying.value) return
  isPlaying.value = true
  lastFrameTime = 0
  // 确保 playYear 从当前 selectedYear 开始
  playYear.value = selectedYear.value
  rafId = requestAnimationFrame(step)
}

function stopPlayback() {
  isPlaying.value = false
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  lastFrameTime = 0
}

function togglePlay() {
  if (isPlaying.value) {
    stopPlayback()
  } else {
    // 如果已到结尾，则从起点重新播放
    if (selectedYear.value >= endYear) selectedYear.value = startYear
    startPlayback()
  }
}

// 地图样式和投影
function applyMapStyle(styleId: string) {
  if (!map) return
  map.setStyle(styleId)
  map.once('style.load', () => {
    setChineseLabels()
    // 样式切换后重新应用当前投影/地形设置，确保 3（模式）×8（样式） 组合生效
    try { applyMapProjection(selectedMode.value) } catch (e) {}
    try { renderAllLayers() } catch (e) {}
  })
}

function applyMapProjection(mode: string) {
  if (!map) return
  
  // 通用的星空/深空背景配置
  const fogConfig = {
    'range': [0.5, 10],
    'color': '#242B4B',
    'high-color': '#161B33',
    'space-color': '#0B0B15',
    'star-intensity': mode === 'globe' ? 0.8 : 0.0 // 星星仅在 globe 模式下可见
  }

  if (mode === 'globe') {
    // 球形投影
    map.setProjection('globe')
    setTimeout(() => {
      if (map.getProjection().name !== 'globe') {
        map.setProjection('globe')
      }
    }, 100)
    
    // 设置星空背景
    map.setFog(fogConfig)

    // 移除可能存在的 sky 层（globe 模式下 fog 自带星空，不需要 sky layer）
    if (map.getLayer('sky')) {
      map.removeLayer('sky')
    }
  } else {
    // 平面或立体投影 (Mercator)
    map.setProjection('mercator')
    setTimeout(() => {
      if (map.getProjection().name !== 'mercator') {
        map.setProjection('mercator')
      }
    }, 100)
    
    // 在 Mercator 模式下也设置 Fog，营造深邃氛围
    map.setFog(fogConfig)

    // 添加 Sky layer 以在倾斜视角下显示深色天空
    if (!map.getLayer('sky')) {
      map.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 0.0],
          'sky-atmosphere-sun-intensity': 15,
          'sky-atmosphere-color': '#242B4B',
          'sky-atmosphere-halo-color': '#161B33',
          'sky-opacity': 1
        }
      })
    }

    // 如果是 terrain 模式，则启用地形 DEM 与阴影图层
    if (mode === 'terrain') {
      try {
        if (!map.getSource('mapbox-dem')) {
          map.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.terrain-rgb',
            tileSize: 512,
            maxzoom: 14
          })
        }
        // 使用 terrainExaggeration 的当前值以增强立体感
        const ex = (typeof terrainExaggeration !== 'undefined') ? terrainExaggeration.value : 1.2
        map.setTerrain({ source: 'mapbox-dem', exaggeration: ex })
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('地形设置失败:', e)
      }

      // 在样式加载完成时添加 hillshade 图层
      map.once('style.load', () => {
        try {
          // hillshade 层（需要 raster-dem）
          if (!map.getLayer('hillshade-layer')) {
            map.addLayer({
              id: 'hillshade-layer',
              type: 'hillshade',
              source: 'mapbox-dem',
              paint: {
                'hillshade-exaggeration': (typeof terrainExaggeration !== 'undefined') ? Math.max(0.2, terrainExaggeration.value * 0.8) : 0.8,
                'hillshade-illumination-direction': 335
              }
            })
          }

          
        } catch (innerE) {
          // eslint-disable-next-line no-console
          console.warn('添加地形图层时出错：', innerE)
        }
      })
    } else {
      // 非 terrain 模式：移除地形与相关图层
      try {
        map.setTerrain(null)
      } catch (e) {}
      if (map.getLayer && map.getLayer('hillshade-layer')) {
        try { map.removeLayer('hillshade-layer') } catch (e) {}
      }
      
      // 移除星空层（globe 专用）
      if (map.getLayer && map.getLayer('sky')) {
        try { map.removeLayer('sky') } catch (e) {}
      }
    }
  }
}

function setChineseLabels() {
  // 支持多种可能的中文字段名，优先级从左到右
  const CANDIDATE_KEYS = ['name_zh', 'name_zh_cn', 'name_zh-Hans', 'name_zh_hans', 'name_zh_CN', 'name_zh-Hant', 'name_zh_tw', 'name']
  try {
    const style = map.getStyle()
    const layers = (style && style.layers) || []
    layers.forEach((layer: any) => {
      if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
        // 构造 coalesce 表达式，依次尝试候选字段，最后回退到原始 name
        const expr: any[] = ['coalesce']
        CANDIDATE_KEYS.forEach((k) => expr.push(['get', k]))
        try {
          map.setLayoutProperty(layer.id, 'text-field', expr)
        } catch (innerErr) {
          // 某些内置符号图层可能不允许修改，忽略单个错误
        }
      }
    })
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('设置地图中文语言失败：', e)
  }
}

// 键盘控制逻辑
function handleKeyDown(e: KeyboardEvent) {
  const tagName = (e.target as HTMLElement).tagName
  if (tagName === 'INPUT' || tagName === 'TEXTAREA') return
  
  const key = e.key.toLowerCase()
  if (Object.prototype.hasOwnProperty.call(keysPressed, key)) {
    keysPressed[key as keyof typeof keysPressed] = true
    if (!animationFrameId) {
      loopCameraMovement()
    }
  }
}

function handleKeyUp(e: KeyboardEvent) {
  const key = e.key.toLowerCase()
  if (Object.prototype.hasOwnProperty.call(keysPressed, key)) {
    keysPressed[key as keyof typeof keysPressed] = false
  }
}

function loopCameraMovement() {
  if (!map) {
    animationFrameId = null
    return
  }
  
  const { w, a, s, d, q, e, arrowup, arrowdown, arrowleft, arrowright } = keysPressed
  
  // 检查是否有任意键被按下
  if (!w && !a && !s && !d && !q && !e && !arrowup && !arrowdown && !arrowleft && !arrowright) {
    animationFrameId = null
    return
  }

  // 1. 平移 (WASD)
  // 基础速度 (像素/帧)
  const panSpeed = 15
  const dx = (d ? panSpeed : 0) - (a ? panSpeed : 0)
  const dy = (s ? panSpeed : 0) - (w ? panSpeed : 0)

  if (dx !== 0 || dy !== 0) {
    map.panBy([dx, dy], { animate: false })
  }

  // 2. 升降 (Q/E) -> 对应 Zoom
  // Zoom 速度 (层级/帧)
  const zoomSpeed = 0.05
  if (q || e) {
    const currentZoom = map.getZoom()
    // Q: 下降 (Zoom In), E: 上升 (Zoom Out) - 注意：通常 Zoom In 是放大/靠近地面，Zoom Out 是缩小/远离
    // 这里定义 Q 为下降(靠近地面, Zoom In), E 为上升(远离地面, Zoom Out)
    const deltaZ = (q ? 1 : 0) - (e ? 1 : 0)
    if (deltaZ !== 0) {
      map.setZoom(currentZoom + deltaZ * zoomSpeed)
    }
  }

  // 3. 旋转 (Arrows)
  // 旋转速度 (度/帧)
  const rotateSpeed = 1.5
  const pitchSpeed = 1.0

  // 左右键控制 Bearing (水平旋转)
  if (arrowleft || arrowright) {
    const currentBearing = map.getBearing()
    // Mapbox bearing: 逆时针为负，顺时针为正。
    // 通常游戏逻辑：按左键向左转(视角左转)，即逆时针(Bearing 减小)
    // 按右键向右转(视角右转)，即顺时针(Bearing 增加)
    const change = (arrowright ? 1 : 0) - (arrowleft ? 1 : 0)
    map.setBearing(currentBearing + change * rotateSpeed)
  }

  // 上下键控制 Pitch (俯仰角)
  if (arrowup || arrowdown) {
    const currentPitch = map.getPitch()
    // 上键：抬头 (Pitch 增加? 不，Mapbox Pitch 0 是垂直向下，60-85 是平视)
    // 通常游戏逻辑：按上键(前进/抬头?) -> 这里定义为 Pitch 增加 (看向地平线)
    // 按下键 -> Pitch 减小 (看向地面)
    const deltaP = (arrowup ? 1 : 0) - (arrowdown ? 1 : 0)
    // 限制 Pitch 范围，防止翻转
    const newPitch = Math.max(0, Math.min(85, currentPitch + deltaP * pitchSpeed))
    map.setPitch(newPitch)
  }

  animationFrameId = requestAnimationFrame(loopCameraMovement)
}

onMounted(() => {
  mapboxgl.accessToken = MAPBOX_TOKEN

  if (!mapContainer.value) return

    map = new mapboxgl.Map({
      container: mapContainer.value,
      style: selectedStyle.value,
      center: [105, 35],
      zoom: 3,
      projection: selectedMode.value === 'globe' ? 'globe' : 'mercator',
      logoPosition: 'bottom-right', 
    })

    // 将 Mapbox 默认控件放置到左下角，避免与右下角的自定义控制面板冲突
    map.addControl(new mapboxgl.NavigationControl(), 'bottom-left')
    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left')

    // 交互优化事件：在交互开始降低地形效果，交互结束恢复
    map.on('movestart', reduceTerrainForInteraction)
    map.on('zoomstart', reduceTerrainForInteraction)
    map.on('rotatestart', reduceTerrainForInteraction)
    map.on('pitchstart', reduceTerrainForInteraction)

    map.on('moveend', restoreTerrainAfterInteraction)
    map.on('zoomend', restoreTerrainAfterInteraction)
    map.on('rotateend', restoreTerrainAfterInteraction)
    map.on('pitchend', restoreTerrainAfterInteraction)

    // 确保在样式数据更新时也尝试设置中文标签（应对部分样式异步添加 label 层的情况）
    map.on('styledata', () => {
      try { setChineseLabels() } catch (e) {}
    })
    // 也监听 style.load（有时 styledata 不足以覆盖首次加载）
    map.on('style.load', () => {
      try { setChineseLabels() } catch (e) {}
      try { renderAllLayers() } catch (e) {}
    })

    // 鼠标按下/松开控制抓手显示：按下显示 grabbing，松开恢复到 hover 状态（或默认）
    map.on('mousedown', () => {
      isMouseDown = true
      try { map.getCanvas().style.cursor = 'grabbing' } catch (e) {}
    })
    map.on('mouseup', () => {
      isMouseDown = false
      try { map.getCanvas().style.cursor = isOverPoint ? 'pointer' : '' } catch (e) {}
    })
    // 监听 document mouseup，防止在地图外释放鼠标导致状态未恢复
    const docUp = () => {
      isMouseDown = false
      try { if (map) map.getCanvas().style.cursor = isOverPoint ? 'pointer' : '' } catch (e) {}
    }
    document.addEventListener('mouseup', docUp)
    // 在组件卸载时移除该监听
    onUnmounted(() => document.removeEventListener('mouseup', docUp))

  // 初始化时应用样式、投影并加载数据
  map.on('load', async () => {
    applyMapStyle(selectedStyle.value)
    applyMapProjection(selectedMode.value)
    try {
      await loadLiangHanDataset()
      filterByYear(selectedYear.value)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[LiangHan] 数据加载失败', error)
    }
  })

  // 监听样式变化
  watch(selectedStyle, style => {
    applyMapStyle(style)
  })
  // 监听模式变化
  watch(selectedMode, mode => {
    applyMapProjection(mode)
  })

  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

onUnmounted(() => {
  if (map) {
    const pointLayers = [HAN_LAYER_IDS.west.layer, HAN_LAYER_IDS.east.layer]
    pointLayers.forEach((layerId) => {
      try { map.off('mousemove', layerId, handlePointMove) } catch (e) {}
      try { map.off('mouseleave', layerId, handlePointLeave) } catch (e) {}
    })
    try { map.off('mousemove', HAN_LAYER_IDS.route.layer, handleLineMove) } catch (e) {}
    try { map.off('mouseleave', HAN_LAYER_IDS.route.layer, handleLineLeave) } catch (e) {}

    map.remove()
    map = null
  }
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
})

// 移除交互事件监听，确保卸载时清理
onUnmounted(() => {
  try {
    if (map) {
      map.off('movestart', reduceTerrainForInteraction)
      map.off('zoomstart', reduceTerrainForInteraction)
      map.off('rotatestart', reduceTerrainForInteraction)
      map.off('pitchstart', reduceTerrainForInteraction)
      map.off('moveend', restoreTerrainAfterInteraction)
      map.off('zoomend', restoreTerrainAfterInteraction)
      map.off('rotateend', restoreTerrainAfterInteraction)
      map.off('pitchend', restoreTerrainAfterInteraction)
    }
  } catch (e) {}
})

// 组件卸载时确保停止播放并释放 RAF
onUnmounted(() => {
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
})

// 组件卸载时移除可能残留的地形相关源/图层
onUnmounted(() => {
  try {
    if (map) {
      if (map.getLayer && map.getLayer('hillshade-layer')) map.removeLayer('hillshade-layer')
      if (map.getSource && map.getSource('mapbox-dem')) map.removeSource('mapbox-dem')
    }
  } catch (e) {}
})

async function loadLiangHanDataset() {
  if (datasetReady.value || isDataLoading.value) {
    renderAllLayers()
    return
  }
  isDataLoading.value = true
  try {
    const attributeModules = (await Promise.all([
      import('@/assets/data/liangHan/westernHanPoints.json'),
      import('@/assets/data/liangHan/easternHanPoints.json')
    ])) as Array<{ default: HanAttributeTable }>
    const westernAttrModule = attributeModules[0]
    const easternAttrModule = attributeModules[1]
    if (!westernAttrModule || !easternAttrModule) {
      throw new Error('两汉交通点属性表缺失')
    }

    const [westernRaw, easternRaw, routeRaw] = await Promise.all([
      loadShapefileZip(WESTERN_POINTS_ZIP_URL),
      loadShapefileZip(EASTERN_POINTS_ZIP_URL),
      loadShapefileZip(HAN_ROUTES_ZIP_URL)
    ])

    westernPoints.value = buildPointFeatures(westernRaw, westernAttrModule.default.records, 'western')
    easternPoints.value = buildPointFeatures(easternRaw, easternAttrModule.default.records, 'eastern')
    hanRoutes.value = buildLineFeatures(routeRaw)
    filteredWesternPoints.value = westernPoints.value
    filteredEasternPoints.value = easternPoints.value
    datasetReady.value = true
    renderAllLayers()
  } catch (error) {
    alert('两汉交通数据加载失败，请确认数据文件是否完整。')
    throw error
  } finally {
    isDataLoading.value = false
  }
}

async function loadShapefileZip(zipUrl: string): Promise<GeoJSON.Feature[]> {
  const response = await fetch(zipUrl)
  if (!response.ok) {
    throw new Error(`获取数据失败：${zipUrl} (${response.status})`)
  }

  const archive = unzipSync(new Uint8Array(await response.arrayBuffer()))
  const entries = Object.keys(archive)
  const shpName = entries.find((name) => name.toLowerCase().endsWith('.shp'))
  const dbfName = entries.find((name) => name.toLowerCase().endsWith('.dbf'))

  if (!shpName || !dbfName) {
    throw new Error('数据包缺少 shp/dbf 文件，无法解析。')
  }

  const shpEntry = archive[shpName]
  const dbfEntry = archive[dbfName]
  if (!shpEntry || !dbfEntry) {
    throw new Error('无法读取 shp/dbf 二进制内容')
  }

  const encoding = detectEncodingFromArchive(entries, archive)

  const source: any = await openShapefile(
    sliceEntryBuffer(shpEntry),
    sliceEntryBuffer(dbfEntry),
    { encoding }
  )

  const features: GeoJSON.Feature[] = []
  try {
    while (true) {
      const result = await source.read()
      if (!result || result.done) break
      if (result.value) features.push(result.value as GeoJSON.Feature)
    }
  } finally {
    if (source && typeof source.cancel === 'function') {
      try { source.cancel() } catch (_) {}
    }
  }

  return features
}

function sliceEntryBuffer(entry: Uint8Array): ArrayBuffer {
  return entry.buffer.slice(entry.byteOffset, entry.byteOffset + entry.byteLength) as ArrayBuffer
}

function detectEncodingFromArchive(entries: string[], archive: Record<string, Uint8Array>): string {
  const cpgName = entries.find((name) => name.toLowerCase().endsWith('.cpg'))
  if (!cpgName) return 'utf-8'
  const cpgEntry = archive[cpgName]
  if (!cpgEntry) return 'utf-8'
  try {
    const text = new TextDecoder('utf-8').decode(cpgEntry).trim().toLowerCase()
    if (!text) return 'utf-8'
    const NORMALIZED: Record<string, string> = {
      'utf-8': 'utf-8',
      'utf8': 'utf-8',
      'utf-16': 'utf-16le',
      'utf16': 'utf-16le',
      'gbk': 'gbk',
      'gb2312': 'gb2312',
      'gb18030': 'gb18030'
    }
    return NORMALIZED[text] || text
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[LiangHan] 无法解析 cpg 文件编码，退回 UTF-8', error)
    return 'utf-8'
  }
}

function buildPointFeatures(
  rawFeatures: GeoJSON.Feature[],
  records: HanPointRecord[],
  dataset: HanPointProperties['dataset']
): HanPointFeature[] {
  const index = createRecordIndex(records, dataset)
  return rawFeatures
    .filter((feature): feature is GeoJSON.Feature<GeoJSON.Point> => Boolean(feature.geometry) && feature.geometry.type === 'Point')
    .map((feature, idx) => {
      const geometry = feature.geometry as GeoJSON.Point
      const coords = geometry.coordinates as [number, number]
      const rawName = typeof feature.properties?.Name === 'string' ? feature.properties.Name : ''
      const normalizedKey = normalizeName(rawName)
      const attr = index.get(normalizedKey)
      const fallbackName = rawName || `未命名交通点 ${idx + 1}`
      const base: PointPropsWithoutCoord = attr
        ? { ...attr }
        : {
            id: `${dataset}-${idx}`,
            dataset,
            dynasty: dataset === 'western' ? '西汉' : '东汉',
            nameZh: fallbackName,
            nameEn: undefined,
            type: undefined,
            classification: undefined,
            province: undefined,
            prefecture: undefined,
            county: undefined,
            town: undefined,
            village: undefined,
            site: undefined,
            locationCode: undefined,
            beginYear: undefined,
            endYear: undefined,
            postalCode: undefined,
            color: DATASET_COLOR_MAP[dataset]
          }
      if (!base.dynasty) {
        base.dynasty = dataset === 'western' ? '西汉' : '东汉'
      }
      base.typeKey = resolvePointTypeKey(base)
      return {
        type: 'Feature',
        id: base.id,
        geometry,
        properties: {
          ...base,
          color: base.color || DATASET_COLOR_MAP[dataset],
          coordinates: coords
        }
      }
    })
}

function createRecordIndex(
  records: HanPointRecord[],
  dataset: HanPointProperties['dataset']
): Map<string, PointPropsWithoutCoord> {
  const mapIndex = new Map<string, PointPropsWithoutCoord>()
  records.forEach((record) => {
    const normalized = normalizePointRecord(record, dataset)
    if (!normalized) return
    const keys = new Set([normalized.matchKey, ...normalized.altKeys])
    keys.forEach((key) => {
      if (key) {
        mapIndex.set(key, normalized.props)
      }
    })
  })
  return mapIndex
}

function normalizePointRecord(
  record: HanPointRecord,
  dataset: HanPointProperties['dataset']
): NormalizedPointRecord | null {
  const nameZh = sanitize(record.Name_Chine) || sanitize(record.Name_Engli)
  if (!nameZh) return null

  const props: PointPropsWithoutCoord = {
    id: safeNumber(record.OBJECTID) ?? `${dataset}-${nameZh}`,
    dataset,
    dynasty: sanitize(record.Dynasty ?? record.dynasty) || (dataset === 'western' ? '西汉' : '东汉'),
    nameZh,
    nameEn: sanitize(record.Name_Engli),
    type: sanitize(record.type),
    classification: sanitize(record.class),
    province: sanitize(record.Province),
    prefecture: sanitize(record.PL_City),
    county: sanitize(record.County ?? record.Country),
    town: sanitize(record.Town),
    village: sanitize(record.Village),
    site: sanitize(record.Site),
    locationCode: safeNumber(record.Location),
    beginYear: safeNumber(record.beg_year),
    endYear: safeNumber(record.end_year),
    postalCode: sanitize(record.Postal_cod),
    color: DATASET_COLOR_MAP[dataset]
  }

  props.typeKey = resolvePointTypeKey(props)

  const alt = sanitize(record.Name_Engli)
  return {
    matchKey: normalizeName(nameZh),
    altKeys: alt ? [normalizeName(alt)] : [],
    props
  }
}

function sanitize(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined
  const text = String(value).trim()
  return text ? text : undefined
}

function safeNumber(value: unknown): number | undefined {
  const num = Number(value)
  return Number.isFinite(num) ? num : undefined
}

function normalizeName(value: unknown): string {
  return String(value ?? '')
    .trim()
    .replace(/[\s·•\.\-（）()，,]/g, '')
    .toLowerCase()
}

function resolvePointTypeKey(props: HanPointProperties | PointPropsWithoutCoord): string {
  if (props.typeKey && POINT_TYPE_COLOR_MAP[props.typeKey]) return props.typeKey
  const candidates = [props.type, props.classification]
  for (const candidate of candidates) {
    const normalized = normalizePointTypeValue(candidate)
    if (normalized) return normalized
  }
  return DEFAULT_POINT_TYPE_KEY
}

function normalizePointTypeValue(value?: string | null): string | undefined {
  if (!value) return undefined
  const text = String(value).trim()
  if (!text) return undefined
  if (POINT_TYPE_COLOR_MAP[text]) return text
  if (POINT_TYPE_SYNONYM_MAP[text]) return POINT_TYPE_SYNONYM_MAP[text]
  const lowered = text.toLowerCase()
  if (POINT_TYPE_COLOR_MAP[lowered]) return lowered
  return POINT_TYPE_SYNONYM_MAP[lowered]
}

function buildLineFeatures(rawFeatures: GeoJSON.Feature[]): HanLineFeature[] {
  return rawFeatures
    .filter(
      (feature): feature is GeoJSON.Feature<GeoJSON.LineString | GeoJSON.MultiLineString> =>
        Boolean(feature.geometry) && (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString')
    )
    .map((feature, idx) => {
      const rawProps = (feature.properties || {}) as Record<string, unknown>
      const lengthValue = safeNumber(rawProps.Shape_Leng)
      const name = typeof rawProps.Name === 'string' && rawProps.Name.trim() ? rawProps.Name : `未命名路线 ${idx + 1}`
      return {
        type: 'Feature',
        id: name,
        geometry: feature.geometry,
        properties: {
          id: name,
          name,
          folderPath: typeof rawProps.FolderPath === 'string' ? rawProps.FolderPath : undefined,
          length: lengthValue ? lengthValue * 111 : undefined,
          color: normalizeColorToHex(getRouteColor(name, rawProps.FolderPath as string | undefined))
        }
      }
    })
}

function filterByYear(year: number) {
  if (!datasetReady.value) return
  const withinRange = (feature: HanPointFeature) => {
    const start = typeof feature.properties.beginYear === 'number' ? feature.properties.beginYear : -Infinity
    const end = typeof feature.properties.endYear === 'number' ? feature.properties.endYear : Infinity
    return year >= start && year <= end
  }
  const matchesFilters = (feature: HanPointFeature) => withinRange(feature) && isPointTypeEnabled(feature)
  filteredWesternPoints.value = westernPoints.value.filter(matchesFilters)
  filteredEasternPoints.value = easternPoints.value.filter(matchesFilters)
  renderAllLayers()
}

function isPointTypeEnabled(feature: HanPointFeature): boolean {
  const key = resolvePointTypeKey(feature.properties)
  feature.properties.typeKey = key
  return typeFilters[key] !== false
}

function renderAllLayers() {
  if (!map || !datasetReady.value) return
  if (map.isStyleLoaded && !map.isStyleLoaded()) {
    map.once('style.load', () => {
      try { renderAllLayers() } catch (_) {}
    })
    return
  }

  upsertGeoJsonSource(HAN_LAYER_IDS.west.source, filteredWesternPoints.value as unknown as GeoJSON.Feature[])
  upsertGeoJsonSource(HAN_LAYER_IDS.east.source, filteredEasternPoints.value as unknown as GeoJSON.Feature[])
  upsertGeoJsonSource(HAN_LAYER_IDS.route.source, hanRoutes.value as unknown as GeoJSON.Feature[])
  ensureHanLayers()
  bindHanLayerInteractions()
}

function upsertGeoJsonSource(sourceId: string, features: GeoJSON.Feature[]) {
  if (!map) return
  const data: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features
  }
  const existing = map.getSource(sourceId) as any
  if (existing && typeof existing.setData === 'function') {
    try { existing.setData(data) } catch (_) {}
    return
  }
  map.addSource(sourceId, { type: 'geojson', data, promoteId: 'id' })
}

function ensureHanLayers() {
  if (!map) return
  if (!map.getLayer(HAN_LAYER_IDS.west.layer)) {
    map.addLayer({
      id: HAN_LAYER_IDS.west.layer,
      type: 'circle',
      source: HAN_LAYER_IDS.west.source,
      paint: {
        'circle-color': POINT_COLOR_EXPRESSION,
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 3, 4.5, 6, 7, 9, 11, 12, 16],
        'circle-stroke-width': 1.2,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.88
      }
    })
  }

  if (!map.getLayer(HAN_LAYER_IDS.east.layer)) {
    map.addLayer({
      id: HAN_LAYER_IDS.east.layer,
      type: 'circle',
      source: HAN_LAYER_IDS.east.source,
      paint: {
        'circle-color': POINT_COLOR_EXPRESSION,
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 3, 4.5, 6, 7, 9, 11, 12, 16],
        'circle-stroke-width': 1.2,
        'circle-stroke-color': '#0b1c2c',
        'circle-opacity': 0.9
      }
    })
  }

  if (!map.getLayer(HAN_LAYER_IDS.route.layer)) {
    map.addLayer({
      id: HAN_LAYER_IDS.route.layer,
      type: 'line',
      source: HAN_LAYER_IDS.route.source,
      paint: {
        'line-color': ['get', 'color'],
        'line-width': ['interpolate', ['linear'], ['zoom'], 3, 1.2, 5, 2.2, 8, 4, 12, 7],
        'line-opacity': 0.8,
        'line-blur': 0.2
      }
    })
  }
}

function bindHanLayerInteractions() {
  if (!map) return
  const pointLayers = [HAN_LAYER_IDS.west.layer, HAN_LAYER_IDS.east.layer]
  pointLayers.forEach((layerId) => {
    try { map.off('mousemove', layerId, handlePointMove) } catch (_) {}
    try { map.off('mouseleave', layerId, handlePointLeave) } catch (_) {}
    map.on('mousemove', layerId, handlePointMove)
    map.on('mouseleave', layerId, handlePointLeave)
  })

  try { map.off('mousemove', HAN_LAYER_IDS.route.layer, handleLineMove) } catch (_) {}
  try { map.off('mouseleave', HAN_LAYER_IDS.route.layer, handleLineLeave) } catch (_) {}
  map.on('mousemove', HAN_LAYER_IDS.route.layer, handleLineMove)
  map.on('mouseleave', HAN_LAYER_IDS.route.layer, handleLineLeave)
}

function handlePointMove(e: LayerMouseEvent) {
  if (!map) return
  const feature = e.features && e.features[0]
  if (!feature) return
  isOverPoint = true
  const props = feature.properties as HanPointProperties | undefined
  if (!props) return
  hoverPanel.value = { show: true, props: buildPointHoverContent(props) }
  try { map.getCanvas().style.cursor = 'pointer' } catch (_) {}
}

function handlePointLeave() {
  isOverPoint = false
  hoverPanel.value = { show: false }
  try {
    if (!isMouseDown && map) {
      map.getCanvas().style.cursor = ''
    }
  } catch (_) {}
}

function handleLineMove(e: LayerMouseEvent) {
  if (!map) return
  const feature = e.features && e.features[0]
  if (!feature) return
  const props = feature.properties as HanLineProperties | undefined
  if (!props) return
  hoverPanel.value = { show: true, props: buildLineHoverContent(props) }
  try { map.getCanvas().style.cursor = 'pointer' } catch (_) {}
}

function handleLineLeave() {
  hoverPanel.value = { show: false }
  try {
    if (!isMouseDown && map) {
      map.getCanvas().style.cursor = ''
    }
  } catch (_) {}
}

function buildPointHoverContent(props: HanPointProperties): HoverPanelContent {
  const datasetLabel = DATASET_LABEL_MAP[props.dataset] || '两汉交通点'
  const accentColor = getPointTypeColor(props.typeKey || props.type || props.classification, props.dataset, props.color)
  const rows: HoverPanelRow[] = []

  rows.push({ label: '数据集', value: datasetLabel })

  if (props.dynasty) {
    rows.push({ label: '所属朝代', value: props.dynasty })
  }

  if (props.nameEn) {
    rows.push({ label: '英文名称', value: props.nameEn })
  }

  const typeParts = [props.typeKey, props.type, props.classification]
    .filter((value, index, self): value is string => Boolean(value) && self.indexOf(value) === index)
  if (typeParts.length) {
    rows.push({ label: '交通类别', value: typeParts.join(' · ') })
  }

  rows.push({ label: '时间跨度', value: formatYearRange(props.beginYear, props.endYear) })

  const locationFields: Array<[string, string | undefined]> = [
    ['省份', props.province],
    ['府州', props.prefecture],
    ['郡县', props.county],
    ['乡镇', props.town],
    ['村落', props.village]
  ]
  locationFields.forEach(([label, value]) => {
    if (value) rows.push({ label, value })
  })

  if (props.site) {
    rows.push({ label: '遗址', value: props.site })
  }

  if (props.postalCode) {
    rows.push({ label: '邮编', value: props.postalCode })
  }

  if (props.locationCode !== undefined) {
    rows.push({ label: '交通编码', value: String(props.locationCode) })
  }

  const coordinateText = formatCoordinate(props.coordinates)
  if (coordinateText) {
    rows.push({ label: '空间坐标', value: coordinateText })
  }

  return {
    name: props.nameZh,
    subtitle: [props.dynasty || datasetLabel, props.nameEn].filter(Boolean).join(' · '),
    badge: datasetLabel,
    color: accentColor,
    rows
  }
}

function buildLineHoverContent(props: HanLineProperties): HoverPanelContent {
  const rows: HoverPanelRow[] = []
  if (props.folderPath) {
    rows.push({ label: '路线分组', value: props.folderPath })
  }
  if (props.length) {
    rows.push({ label: '估算长度', value: `${props.length.toFixed(1)} km` })
  }
  const narrativeSummary = formatNarrativeSummary(resolveRouteNarratives(props))
  if (narrativeSummary) {
    rows.push({ label: '路线说明', value: narrativeSummary })
  }
  return {
    name: props.name,
    subtitle: '两汉交通线',
    badge: '交通线',
    color: normalizeColorToHex((props.color && String(props.color).trim()) || getRouteColor(props.name || '', props.folderPath)),
    rows
  }
}

function formatYearLabel(year: number): string {
  if (year < 0) return `公元前${Math.abs(year)}年`
  return `公元${year}年`
}

function formatYearRange(start?: number, end?: number): string {
  const startLabel = typeof start === 'number' ? formatYearLabel(start) : '不详'
  const endLabel = typeof end === 'number' ? formatYearLabel(end) : '不详'
  if (startLabel === endLabel) return startLabel
  return `${startLabel} - ${endLabel}`
}

function formatCoordinate(coords?: [number, number]): string {
  if (!Array.isArray(coords) || coords.length < 2) return ''
  const [lng, lat] = coords
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return ''
  const lngLabel = lng >= 0 ? '东经' : '西经'
  const latLabel = lat >= 0 ? '北纬' : '南纬'
  return `${lngLabel}${Math.abs(lng).toFixed(2)}° · ${latLabel}${Math.abs(lat).toFixed(2)}°`
}

function resolveRouteNarratives(props: HanLineProperties): RouteNarrativeBlock[] {
  const directKey = props.name?.trim()
  if (directKey && liangHanRouteNarratives[directKey]) {
    return liangHanRouteNarratives[directKey]
  }

  const folderPath = props.folderPath || ''
  if (!folderPath) return []
  const segments = folderPath
    .split('/')
    .map((segment) => segment.replace(/\.kmz$/i, '').trim())
    .filter(Boolean)

  for (const candidate of [...segments].reverse()) {
    if (liangHanRouteNarratives[candidate]) {
      return liangHanRouteNarratives[candidate]
    }
  }

  return []
}

function formatNarrativeSummary(blocks: RouteNarrativeBlock[]): string {
  if (!blocks.length) return ''
  const pieces: string[] = []
  blocks.forEach((block) => {
    if (block.title || block.content?.length) {
      const contentText = (block.content || []).join(' ')
      if (block.title && contentText) {
        pieces.push(`${block.title}：${contentText}`)
      } else if (block.title) {
        pieces.push(block.title)
      } else {
        pieces.push(contentText)
      }
    }
    if (block.children?.length) {
      block.children.forEach((child) => {
        const childText = (child.content || []).join(' ')
        if (child.title && childText) {
          pieces.push(`${child.title}：${childText}`)
        } else if (child.title) {
          pieces.push(child.title)
        } else if (childText) {
          pieces.push(childText)
        }
      })
    }
  })
  return pieces.join(' ｜ ')
}

function getRouteColor(name: string, folderPath?: string): string {
  const directColor = ROUTE_COLOR_MAP[name.trim()] || (folderPath ? ROUTE_COLOR_MAP[folderPath.trim()] : undefined)
  if (directColor) return directColor
  const key = folderPath || name
  const hash = [...key].reduce((acc, char) => acc + char.charCodeAt(0), 0)
  if (!ROUTE_COLOR_PALETTE.length) return '#e67e22'
  const paletteColor = ROUTE_COLOR_PALETTE[hash % ROUTE_COLOR_PALETTE.length]
  return paletteColor ?? '#e67e22'
}

function normalizeColorToHex(input: unknown, fallback = '#e67e22'): string {
  if (!input && input !== '') return fallback
  // already a hex string
  if (typeof input === 'string') {
    const s = input.trim()
    // basic hex check
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s)) return s.toLowerCase()
    // try to parse rgb(...) or rgba(...)
    const rgbMatch = s.match(/rgba?\(([^)]+)\)/)
    const inner = rgbMatch?.[1]
    if (typeof inner === 'string') {
      const partsRaw = inner.split(',').map(p => p.trim())
      if (partsRaw.length >= 3) {
        const rNum = Number(partsRaw[0])
        const gNum = Number(partsRaw[1])
        const bNum = Number(partsRaw[2])
        if (Number.isFinite(rNum) && Number.isFinite(gNum) && Number.isFinite(bNum)) {
          const r = Math.round(rNum)
          const g = Math.round(gNum)
          const b = Math.round(bNum)
          return rgbToHex(r, g, b)
        }
      }
    }
    // fallback try to look up in ROUTE_COLOR_MAP
    const mapVal = ROUTE_COLOR_MAP[s]
    if (mapVal) return mapVal.toLowerCase()
    return fallback
  }
  // numeric value (0xRRGGBB)
  if (typeof input === 'number' && Number.isFinite(input)) {
    const num = input as number
    const r = (num >> 16) & 255
    const g = (num >> 8) & 255
    const b = num & 255
    return rgbToHex(r, g, b)
  }
  return fallback
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function getPointTypeColor(type?: string, dataset?: HanPointProperties['dataset'], fallback?: string): string {
  if (type && POINT_TYPE_COLOR_MAP[type]) return POINT_TYPE_COLOR_MAP[type]
  if (dataset && DATASET_COLOR_MAP[dataset]) return DATASET_COLOR_MAP[dataset]
  if (fallback) return fallback
  return '#e67e22'
}

function buildPointColorExpression(): any[] {
  const expr: any[] = ['match', ['coalesce', ['get', 'typeKey'], ['get', 'type'], ['get', 'classification']]]
  Object.entries(POINT_TYPE_COLOR_MAP).forEach(([typeKey, color]) => {
    expr.push(typeKey, color)
  })
  expr.push(['coalesce', ['get', 'color'], '#f6c177'])
  return expr
}

</script>

<style scoped>
.transport-view {
  position: relative;
  width: 100%;
  height: 100%;
}

.map-container {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}

/* MapControls.vue 提供统一的选择器样式，不在此文件重复定义 */

/* 时间轴样式（与明清一致） */
.timeline-glass {
  position: absolute;
  left: 50%;
  bottom: 32px;
  transform: translateX(-50%);
  min-width: 340px;
  max-width: 620px;
  background: rgba(12, 20, 30, 0.68);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(18px) saturate(180%);
  padding: 18px 28px 12px 28px;
  z-index: 2100;
  display: flex;
  flex-direction: column;
  color: #f4f7ff;
}

.timeline-labels {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.timeline-slider {
  flex: 1;
  height: 4px;
  margin: 0 8px;
  accent-color: #e67e22;
}

.timeline-mark {
  cursor: pointer;
  color: #a8c5ff;
  font-weight: 600;
  font-size: 15px;
  padding: 4px 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  transition: background 0.2s, color 0.2s;
  user-select: none;
}

.timeline-mark:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.timeline-play {
  border: none;
  border-radius: 999px;
  padding: 6px 16px;
  font-size: 14px;
  cursor: pointer;
  background: linear-gradient(120deg, #ff9966, #ff5e62);
  color: #fff;
  transition: transform 0.15s;
}

.timeline-play.playing {
  background: linear-gradient(120deg, #4facfe, #00f2fe);
}

.timeline-play:active {
  transform: scale(0.98);
}

.timeline-selected {
  margin-top: 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.82);
}

.timeline-selected .highlight {
  color: #ffdd99;
  font-size: 18px;
  margin-left: 4px;
}

.legend-panel {
  position: absolute;
  top: 24px;
  right: 24px;
  width: 280px;
  padding: 16px;
  background: rgba(9, 15, 25, 0.76);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  color: #eef2ff;
  z-index: 2000;
}

.legend-select-all {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.legend-panel h4 {
  margin: 0 0 12px;
  font-size: 16px;
}

.legend-panel ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.legend-panel li {
  display: flex;
  align-items: center;
  gap: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  cursor: pointer;
}

.legend-checkbox {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid rgba(94, 234, 152, 0.45);
  background: rgba(0, 0, 0, 0.2);
  position: relative;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.legend-checkbox:checked {
  background: linear-gradient(120deg, #34d399, #059669);
  border-color: transparent;
}

.legend-checkbox:checked::after {
  content: '\2713';
  color: #fff;
  font-size: 12px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -58%);
}

.swatch {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.4);
}

.legend-text {
  display: flex;
  flex-direction: column;
  font-size: 13px;
  line-height: 1.4;
}

.legend-text strong {
  color: #fff;
}

.legend-note {
  margin-top: 14px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.legend-toggle {
  position: absolute;
  top: 24px;
  right: 24px;
  background: rgba(6, 9, 16, 0.82);
  color: #eef2ff;
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 8px 10px;
  border-radius: 12px;
  z-index: 2000;
  cursor: pointer;
}

.legend-enter-active,
.legend-leave-active {
  transition: transform 220ms cubic-bezier(.2, .9, .2, 1), opacity 180ms ease;
}

.legend-enter-from,
.legend-leave-to {
  transform: translateX(12px);
  opacity: 0;
}

.legend-enter-to,
.legend-leave-from {
  transform: translateX(0);
  opacity: 1;
}

.hover-panel {
  position: absolute;
  left: 24px;
  top: 72px;
  width: 360px;
  padding: 18px;
  background: rgba(6, 9, 16, 0.88);
  border-radius: 14px;
  color: #f2f6ff;
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.45);
  z-index: 3000;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}

.hover-panel.compact {
  width: 360px;
  padding: 12px;
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(8, 12, 18, 0.92), rgba(6, 9, 16, 0.86));
  backdrop-filter: blur(6px) saturate(120%);
}

.hover-top {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 6px 18px rgba(2, 6, 12, 0.5);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(0, 0, 0, 0.08));
}

.icon-core {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.hover-title .title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  line-height: 1.1;
  max-width: 170px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.hover-title .subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.72);
  max-width: 170px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta {
  margin-left: auto;
}

.badge.small {
  padding: 6px 8px;
  font-size: 12px;
  border-radius: 999px;
  color: #06101d;
  font-weight: 700;
}

.hover-body {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.label {
  color: rgba(255, 255, 255, 0.62);
  font-size: 12px;
}

.value {
  color: rgba(255, 255, 255, 0.92);
  font-size: 13px;
  text-align: right;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 220ms cubic-bezier(.2, .9, .2, 1), opacity 180ms ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-12px);
  opacity: 0;
}

.slide-enter-to,
.slide-leave-from {
  transform: translateX(0);
  opacity: 1;
}

.wasd-controls {
  position: absolute;
  bottom: 24px; /* 固定到最右下角，和底部居中时间轴错开 */
  right: 24px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px; /* 缩小间距，避免过大占用可视面积 */
  background: rgba(12, 20, 30, 0.56);
  padding: 10px; /* 更紧凑，减少遮挡 */
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(3px);
  z-index: 1000; /* 保持低于时间轴与信息面板，避免遮挡重要 UI */
  pointer-events: none; /* 不阻塞底层交互 */
  opacity: 0.7;
  transition: opacity 0.2s;
}

.wasd-controls:hover {
  opacity: 1;
}

.control-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.divider {
  width: 1px;
  background: rgba(255, 255, 255, 0.15);
  align-self: stretch;
}

.key {
  width: 28px;
  height: 28px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
  transition: all 0.1s;
}

.key.active {
  background: #e67e22;
  border-color: #e67e22;
  color: #000;
  transform: scale(0.95);
}

.keys-row {
  display: flex;
  gap: 6px;
}

.wasd-controls .label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 4px;
  text-align: center;
  white-space: nowrap;
}

.gesture-controls {
  position: absolute;
  bottom: 140px; /* 位于 WASD 上方 */
  right: 24px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.gesture-btn {
  background: rgba(12, 20, 30, 0.68);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 8px 16px;
  border-radius: 30px;
  cursor: pointer;
  font-family: inherit;
  backdrop-filter: blur(5px);
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.gesture-btn:hover {
  background: rgba(12, 20, 30, 0.88);
  transform: translateY(-2px);
}

.gesture-btn.active {
  background: rgba(74, 158, 255, 0.3);
  border-color: #4a9eff;
  color: #4a9eff;
}

.camera-wrapper {
  position: relative;
  width: 200px;
  height: 150px;
  background: #000;
  border: 2px solid #333;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
}

.input_video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
}

.output_canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform: scaleX(-1);
}

.gesture-status {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: rgba(0,0,0,0.7);
  color: #fff;
  padding: 6px;
  text-align: center;
  font-size: 11px;
}

.gesture-status p {
  margin: 0;
}

.gesture-status .hint {
  font-size: 9px;
  color: #aaa;
  margin-top: 2px;
}
</style>
