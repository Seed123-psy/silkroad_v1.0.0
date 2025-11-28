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
        <span class="timeline-mark" @click="setYear(startYear)">{{ startYear }}</span>
        <input type="range" :min="startYear" :max="endYear" v-model.number="selectedYear" class="timeline-slider" />
        <span class="timeline-mark" @click="setYear(endYear)">{{ endYear }}</span>
        <button
          type="button"
          class="timeline-play"
          :class="{ playing: isPlaying }"
          @click="togglePlay"
          :aria-pressed="isPlaying"
          aria-label="播放/暂停唐代交通时间轴"
        >
          <span v-if="!isPlaying">▶ 播放</span>
          <span v-else>❚❚ 暂停</span>
        </button>
      </div>
      <div class="timeline-selected">当前年份：<span class="highlight">{{ selectedYear }}</span></div>
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
              <span>切换全部节点显示</span>
            </div>
          </label>
        </div>
        <ul>
          <li v-for="type in TYPE_CATEGORIES" :key="type.key">
            <label class="legend-item">
              <input
                type="checkbox"
                :checked="Boolean(typeFilters[type.key])"
                @change="onTypeToggle(type.key, $event)"
                class="legend-checkbox"
              />
              <span class="swatch" :style="{ backgroundColor: type.color }" />
              <div class="legend-text">
                <strong>{{ type.label }}</strong>
                <span>{{ type.description }}</span>
              </div>
            </label>
          </li>
        </ul>
        <p class="legend-note">数据来源：唐代交通点位。</p>
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
          <p class="hint">单手捏合: 移动地图 | 双手开合: 缩放地图</p>
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

interface TangPointProperties {
  Name_CH: string
  Name_EN: string
  Type: string
  Provice: string
  PL_City: string
  County: string
  Town: string
  Site: string
  Beg_year: number
  End_year: number
}
interface TangLineProperties {
  Name: string
  Beg_year: number
  End_year: number
  __routeColor?: string
  __routeName?: string
}
type TangPointFeature = {
  type: 'Feature'
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
  properties: TangPointProperties
}
type TangLineFeature = {
  type: 'Feature'
  geometry: {
    type: 'LineString'
    coordinates: [number, number][]
  }
  properties: TangLineProperties
}
// 导入 Mapbox GL（需先安装 `mapbox-gl`）
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import MapControls from '@/components/MapControls.vue'

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
let lastFeatureKey = ''
let popupTimer: any = null
let pendingFeatureKey = ''
let activeHoverSource: 'point' | 'line' | null = null

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
      const sensitivity = 2000 
      // 反转 X 轴以匹配镜像，反转 Y 轴以匹配屏幕坐标系
      map.panBy([-deltaX * sensitivity, -deltaY * sensitivity], { animate: false })
    }
  },
  (zoomFactor) => {
    if (map) {
      const currentZoom = map.getZoom()
      // 缩放灵敏度
      const sensitivity = 0.4
      const deltaZoom = (zoomFactor - 1) * sensitivity * 10 // 放大系数
      map.setZoom(currentZoom + deltaZoom)
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

const TYPE_CATEGORIES = [
  { key: '古城', label: '古城', description: '早期大型城址', color: '#f1c40f' },
  { key: '县城', label: '县城', description: '县级行政中心', color: '#ff9f43' },
  { key: '桥梁', label: '桥梁', description: '跨越河谷的交通节点', color: '#4dabf7' },
  { key: '驿站', label: '驿站', description: '官方传递节点', color: '#ff6b6b' },
  { key: '地名', label: '地名', description: '地理位置或区域称谓', color: '#a29bfe' },
  { key: '关隘', label: '关隘', description: '战略要地或山口', color: '#c27ba0' },
  { key: '城堡', label: '城堡', description: '军事驻守据点', color: '#9b59b6' },
  { key: '镇城', label: '镇城', description: '镇级或更小城镇', color: '#e67e22' },
  { key: '湖泊', label: '湖泊', description: '水域交通节点', color: '#1abc9c' },
  { key: '堡寨', label: '堡寨', description: '小型防御聚落', color: '#d35400' },
  { key: '军城', label: '军城', description: '军队驻扎城池', color: '#e84393' },
  { key: '都城', label: '都城', description: '朝廷或区域首府', color: '#2ecc71' }
]

const TYPE_SYNONYM_MAP: Record<string, string> = {
  station: '驿站',
  post: '驿站',
  'post station': '驿站',
  courier: '驿站',
  bridge: '桥梁',
  pass: '关隘',
  gate: '关隘',
  castle: '城堡',
  fort: '堡寨',
  fortress: '堡寨',
  town: '镇城',
  city: '县城',
  county: '县城',
  countycity: '县城',
  depot: '驿站',
  placename: '地名',
  name: '地名',
  lake: '湖泊',
  military: '军城',
  garrison: '军城',
  capital: '都城',
  metropolis: '都城',
  ancientcity: '古城',
  oldcity: '古城'
}

const DEFAULT_TYPE_KEY = '地名'

const TYPE_COLOR_MAP = TYPE_CATEGORIES.reduce<Record<string, string>>((acc, type) => {
  acc[type.key] = type.color
  return acc
}, {})

const TYPE_COLOR_EXPRESSION: any[] = ['match', ['coalesce', ['get', '__typeKey'], DEFAULT_TYPE_KEY]]
TYPE_CATEGORIES.forEach((cat) => {
  TYPE_COLOR_EXPRESSION.push(cat.key)
  TYPE_COLOR_EXPRESSION.push(cat.color)
})
TYPE_COLOR_EXPRESSION.push(TYPE_COLOR_MAP[DEFAULT_TYPE_KEY] || '#e67e22')

const DEFAULT_ROUTE_COLOR = '#2980b9'
const ROUTE_COLOR_PALETTE = ['#ff5e57', '#ff884e', '#ffa94d', '#ffcd3c', '#10ac84', '#00d2d3', '#48dbfb', '#2e86de', '#5f27cd', '#f368e0', '#ff6b6b', '#1dd1a1']
const ROUTE_TONE_BASE = '#1f2835'
const ROUTE_TONE_RATIO = 0.28
const routeColorCache = new Map<string, string>()
function getRouteColorExpression(): any[] {
  return ['coalesce', ['get', '__routeColor'], DEFAULT_ROUTE_COLOR]
}

const typeFilters = reactive<Record<string, boolean>>(TYPE_CATEGORIES.reduce((acc, type) => {
  acc[type.key] = true
  return acc
}, {} as Record<string, boolean>))

const allTypesSelected = computed({
  get: () => TYPE_CATEGORIES.every((cat) => typeFilters[cat.key]),
  set: (value: boolean) => {
    TYPE_CATEGORIES.forEach((cat) => {
      typeFilters[cat.key] = value
    })
  }
})

// 地图显示模式
const MAP_MODES = [
  { id: 'flat', name: '平面' },
  { id: 'globe', name: '球形' },
  { id: 'terrain', name: '立体' },
]
// 将暗色样式放在首位，便于将唐代交通默认初始化为暗色主题
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
const points = ref<TangPointFeature[]>([])
const lines = ref<TangLineFeature[]>([])
// 保证拖动滑块和点击首尾年份时都实时渲染
const startYear = 618
const endYear = 907
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
const playbackSpeed = ref<number>(1) // 年/秒，可根据需求暴露为 UI
let rafId: number | null = null
let lastFrameTime = 0
// 地形夸张值（设为 2.5，用于增强立体感；globe 模式将不启用地形）
const terrainExaggeration = ref<number>(2.5)

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

watch(typeFilters, () => {
  filterByYear(selectedYear.value)
}, { deep: true })

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
const showLegend = ref(true)

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
    // After style change, re-render current data so points/lines and hitboxes are restored
    try { filterByYear(selectedYear.value) } catch (e) {}
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

// 按年份筛选
// 按年份筛选（健壮处理属性为字符串或缺失的情况）
function filterByYear(year: number) {
  function inRange(props: any) {
    // 解析 Beg_year / End_year 为整数，若无法解析则认为无穷（Beg -> -Infinity, End -> +Infinity）
    const rawBeg = props && props.Beg_year
    const rawEnd = props && props.End_year
    const beg = Number.isFinite(Number(rawBeg)) ? Number(rawBeg) : -Infinity
    const end = Number.isFinite(Number(rawEnd)) ? Number(rawEnd) : Infinity
    return beg <= year && end >= year
  }

  const filteredPoints = points.value.filter((p) => inRange(p.properties || {}))
  const filteredLines = lines.value.filter((l) => inRange(l.properties || {}))
  renderToMap(filteredPoints, filteredLines)
}

// 渲染到地图
function renderToMap(filteredPoints: TangPointFeature[], filteredLines: TangLineFeature[]) {
  if (!map) return

  // 使用 setData 更新已有 source，避免删除/重建导致的依赖冲突
  const normalizedPoints = preparePointFeatures(filteredPoints).filter((feature) => {
    const typeKey = (feature.properties as any)?.__typeKey as string | undefined
    return isTypeEnabled(typeKey)
  })
  const pointsData = { type: 'FeatureCollection', features: normalizedPoints }
  if (map.getSource('points')) {
    try {
      ;(map.getSource('points') as any).setData(pointsData)
    } catch (e) {
      // fallback: if setData fails, remove layer(s) that depend on source then recreate
      if (map.getLayer('points')) map.removeLayer('points')
      if (map.getLayer('points-hitbox')) map.removeLayer('points-hitbox')
      if (map.getSource('points')) map.removeSource('points')
      map.addSource('points', { type: 'geojson', data: pointsData })
    }
  } else {
    map.addSource('points', { type: 'geojson', data: pointsData })
  }

  // 添加点可视图层（仅在不存在时添加）
  if (!map.getLayer('points')) {
    map.addLayer({
      id: 'points',
      type: 'circle',
      source: 'points',
      paint: {
        'circle-radius': 3.5,
        'circle-color': TYPE_COLOR_EXPRESSION,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#fff'
      }
    })
  }

  // 添加/确保 hitbox 图层存在（透明的交互层）
  if (!map.getLayer('points-hitbox')) {
    map.addLayer({
      id: 'points-hitbox',
      type: 'circle',
      source: 'points',
      paint: {
        'circle-radius': 16,
        'circle-color': '#ffffff',
        'circle-opacity': 0
      }
    })
  }

  // 使用 setData 更新或添加 lines 源与图层
  const linesData = { type: 'FeatureCollection', features: filteredLines }
  if (map.getSource('lines')) {
    try {
      ;(map.getSource('lines') as any).setData(linesData)
    } catch (e) {
      if (map.getLayer('lines')) map.removeLayer('lines')
      if (map.getSource('lines')) map.removeSource('lines')
      map.addSource('lines', { type: 'geojson', data: linesData })
    }
  } else {
    map.addSource('lines', { type: 'geojson', data: linesData })
  }

  if (!map.getLayer('lines')) {
    map.addLayer({
      id: 'lines',
      type: 'line',
      source: 'lines',
      paint: {
        'line-width': ['interpolate', ['linear'], ['zoom'], 3, 1.2, 5, 2.2, 8, 4, 12, 7],
        'line-color': getRouteColorExpression()
      }
    })
  } else {
    try {
      map.setPaintProperty('lines', 'line-color', getRouteColorExpression())
    } catch (e) {
      // 忽略偶发的样式更新错误
    }
  }

  // 绑定一次 hover 事件，避免重复绑定；对 hitbox 层使用 mousemove/mouseleave
  map.off('mousemove', 'points-hitbox')
  map.off('mouseleave', 'points-hitbox')

  map.on('mousemove', 'points-hitbox', (e: any) => {
    isOverPoint = true
    map.getCanvas().style.cursor = isMouseDown ? 'grabbing' : 'pointer'
    if (!(e.features && e.features.length > 0)) return
    const feat = e.features[0]
    const coordArr = feat.geometry && feat.geometry.coordinates ? feat.geometry.coordinates : null
    const coord = coordArr ? coordArr.join(',') : ''
    const name = (feat.properties && (feat.properties.Name_CH || feat.properties.Name_EN)) || ''
    const featureKey = `${coord}|${name}`

    // 如果是同一要素，仅更新位置（避免重新渲染内容）
    if (featureKey === lastFeatureKey && activeHoverSource === 'point') {
      return
    }

    // 不同要素：使用短延迟（debounce）再显示，避免快速切换导致闪烁
    pendingFeatureKey = featureKey
    if (popupTimer) clearTimeout(popupTimer)
    popupTimer = setTimeout(() => {
      // 如果用户已经离开或又到别的要素，取消
      if (!isOverPoint || pendingFeatureKey !== featureKey) return
      lastFeatureKey = featureKey
      activeHoverSource = 'point'
      hoverPanel.value = { show: true, props: buildPointPanel(feat.properties) }
    }, 120) // 120ms 延迟，可调整
  })

  map.on('mouseleave', 'points-hitbox', () => {
    isOverPoint = false
    pendingFeatureKey = ''
    lastFeatureKey = ''
    if (popupTimer) { clearTimeout(popupTimer); popupTimer = null }
    map.getCanvas().style.cursor = isMouseDown ? 'grabbing' : ''
    if (activeHoverSource === 'point') {
      hoverPanel.value = { show: false }
      activeHoverSource = null
    }
  })

  // 为路线图层添加弹窗（线的 tooltip）
  map.off('mousemove', 'lines')
  map.off('mouseleave', 'lines')
  let lastLineKey = ''
  let lineTimer: any = null
  let pendingLineKey = ''

  map.on('mousemove', 'lines', (e: any) => {
    // 仅当有 feature 时处理
    if (!(e.features && e.features.length > 0)) return
    const feat = e.features[0]
    const name = (feat.properties && feat.properties.Name) || ''
    const beg = feat.properties && feat.properties.Beg_year
    const end = feat.properties && feat.properties.End_year
    const featureKey = `${name}|${beg}|${end}`

    // 如果是同一条路线，仅移动位置
    if (featureKey === lastLineKey && activeHoverSource === 'line') {
      return
    }

    pendingLineKey = featureKey
    if (lineTimer) clearTimeout(lineTimer)
    lineTimer = setTimeout(() => {
      if (pendingLineKey !== featureKey) return
      lastLineKey = featureKey
      activeHoverSource = 'line'
      hoverPanel.value = { show: true, props: buildLinePanel(feat.properties) }
    }, 120)
  })

  map.on('mouseleave', 'lines', () => {
    pendingLineKey = ''
    lastLineKey = ''
    if (lineTimer) { clearTimeout(lineTimer); lineTimer = null }
    if (activeHoverSource === 'line') {
      hoverPanel.value = { show: false }
      activeHoverSource = null
    }
  })
}

const RAW_BASE_URL = import.meta.env.BASE_URL ?? '/'
const NORMALIZED_BASE_URL = RAW_BASE_URL.endsWith('/') ? RAW_BASE_URL : `${RAW_BASE_URL}/`
const buildPublicDataUrl = (path: string) => `${NORMALIZED_BASE_URL}${path.replace(/^\/+/, '')}`
const TANG_NODES_ZIP_URL = buildPublicDataUrl('data/tang/nodes.zip')
const TANG_ROUTES_ZIP_URL = buildPublicDataUrl('data/tang/routes.zip')

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

  // 初始化时应用样式和投影
  map.on('load', () => {
    applyMapStyle(selectedStyle.value)
    applyMapProjection(selectedMode.value)
  })

  // 确保地图样式加载完成后再添加数据源和图层，避免 Style is not done loading 报错
  map.on('load', async () => {
    try {
      const nodesData = await loadTangZipData(TANG_NODES_ZIP_URL)
      if (!nodesData.length) {
        throw new Error('交通点数据包内无 features')
      }
      points.value = nodesData as TangPointFeature[]
    } catch (e) {
      console.error(`[Transport] 交通点数据加载失败 (${TANG_NODES_ZIP_URL})`, e)
      alert('交通点数据加载失败，请检查文件内容和路径！')
      points.value = []
    }
    try {
      const routesData = await loadTangZipData(TANG_ROUTES_ZIP_URL)
      if (!routesData.length) {
        throw new Error('交通线数据包内无 features')
      }
      lines.value = assignRouteColors(routesData as TangLineFeature[])
    } catch (e) {
      console.error(`[Transport] 交通线数据加载失败 (${TANG_ROUTES_ZIP_URL})`, e)
      alert('交通线数据加载失败，请检查文件内容和路径！')
      lines.value = []
    }
    filterByYear(selectedYear.value)
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

function formatYear(year?: number): string {
  if (typeof year === 'number' && Number.isFinite(year)) return `${Math.round(year)}年`
  return '未知'
}

function buildPointPanel(properties: TangPointProperties): HoverPanelContent {
  const name = properties?.Name_CH || properties?.Name_EN || '未知交通点'
  const subtitle = properties?.Name_EN && properties.Name_EN !== properties.Name_CH ? properties.Name_EN : undefined
  const typeKey = (properties as any)?.__typeKey ? String((properties as any).__typeKey) : normalizeType(properties?.Type)
  const readableType = TYPE_CATEGORIES.find((item) => item.key === typeKey)?.label || typeKey || '未知类型'
  const location = [properties?.PL_City, properties?.County, properties?.Town].filter(Boolean).join(' / ') || '未知'
  const site = properties?.Site || '未知'
  const typeColor = getTypeColor(typeKey)

  const rows: HoverPanelRow[] = [
    { label: '类型', value: readableType },
    { label: '位置', value: location },
    { label: '遗址', value: site },
    { label: '存续', value: `${formatYear(properties?.Beg_year)} - ${formatYear(properties?.End_year)}` }
  ]

  return {
    name,
    subtitle,
    badge: readableType,
    color: typeColor,
    rows
  }
}

async function loadTangZipData(zipUrl: string) {
  const response = await fetch(zipUrl)
  if (!response.ok) {
    throw new Error(`获取数据失败：${response.status} ${response.statusText}`)
  }

  const archive = unzipSync(new Uint8Array(await response.arrayBuffer()))
  const entries = Object.keys(archive)
  const findEntry = (ext: string) => entries.find((name) => name.toLowerCase().endsWith(ext))
  const shpName = findEntry('.shp')
  const dbfName = findEntry('.dbf')
  if (!shpName || !dbfName) {
    throw new Error('数据压缩包缺少 shp/dbf 文件，无法解析')
  }

  const shpEntry = archive[shpName]
  const dbfEntry = archive[dbfName]
  if (!shpEntry || !dbfEntry) {
    throw new Error('无法读取 shp/dbf 二进制内容')
  }

  const shpBuffer = sliceArrayBuffer(shpEntry)
  const dbfBuffer = sliceArrayBuffer(dbfEntry)
  const source: any = await openShapefile(shpBuffer, dbfBuffer, { encoding: 'gb18030' })
  const features: GeoJSON.Feature[] = []

  try {
    while (true) {
      const result = await source.read()
      if (!result || result.done) break
      if (result.value) features.push(result.value as GeoJSON.Feature)
    }
  } finally {
    if (source && typeof source.cancel === 'function') {
      try { source.cancel() } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[Transport] 关闭 shapefile 读取器失败', err)
      }
    }
  }

  return features
}

function sliceArrayBuffer(entry: Uint8Array): ArrayBuffer {
  return entry.buffer.slice(entry.byteOffset, entry.byteOffset + entry.byteLength) as ArrayBuffer
}

function buildLinePanel(properties: TangLineProperties): HoverPanelContent {
  const routeName = properties?.__routeName || properties?.Name || '未知路线'
  const rows: HoverPanelRow[] = [
    { label: '存续', value: `${formatYear(properties?.Beg_year)} - ${formatYear(properties?.End_year)}` }
  ]

  return {
    name: routeName,
    subtitle: '唐代交通线',
    badge: '交通线',
    color: properties?.__routeColor || DEFAULT_ROUTE_COLOR,
    rows
  }
}

function normalizeType(type?: string): string {
  if (!type) return DEFAULT_TYPE_KEY
  const raw = String(type).trim()
  if (!raw) return DEFAULT_TYPE_KEY
  const direct = TYPE_CATEGORIES.find((cat) => cat.key === raw)
  if (direct) return direct.key
  const synonym = TYPE_SYNONYM_MAP[raw.toLowerCase()]
  if (synonym) return synonym
  return DEFAULT_TYPE_KEY
}

function getTypeColor(typeKey?: string): string {
  if (!typeKey) return TYPE_COLOR_MAP[DEFAULT_TYPE_KEY] || '#e67e22'
  return TYPE_COLOR_MAP[typeKey] || TYPE_COLOR_MAP[DEFAULT_TYPE_KEY] || '#e67e22'
}

function preparePointFeatures(features: TangPointFeature[]): TangPointFeature[] {
  return features.map((feature) => {
    const typeKey = normalizeType(feature?.properties?.Type)
    return {
      ...feature,
      properties: {
        ...feature.properties,
        __typeKey: typeKey
      }
    }
  })
}

function assignRouteColors(features: TangLineFeature[]): TangLineFeature[] {
  return features.map((feature, index) => {
    const routeName = resolveRouteName(feature?.properties?.Name, index)
    const routeColor = getOrCreateRouteColor(routeName)
    return {
      ...feature,
      properties: {
        ...feature.properties,
        Name: feature?.properties?.Name || routeName,
        __routeName: routeName,
        __routeColor: routeColor
      }
    }
  })
}

function resolveRouteName(rawName?: string, index?: number): string {
  const trimmed = typeof rawName === 'string' ? rawName.trim() : ''
  if (trimmed) return trimmed
  return `路线${(typeof index === 'number' ? index : 0) + 1}`
}

function getOrCreateRouteColor(routeName: string): string {
  if (!routeColorCache.has(routeName)) {
    routeColorCache.set(routeName, generateRouteColor(routeName))
  }
  return routeColorCache.get(routeName) || DEFAULT_ROUTE_COLOR
}

function generateRouteColor(routeName: string): string {
  const index = Math.abs(hashString(routeName)) % ROUTE_COLOR_PALETTE.length
  const paletteColor = ROUTE_COLOR_PALETTE[index] || DEFAULT_ROUTE_COLOR
  return toneDownColor(paletteColor, ROUTE_TONE_BASE, ROUTE_TONE_RATIO)
}

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0
  }
  return hash
}

function toneDownColor(hex: string, mixHex: string, ratio: number): string {
  const base = hexToRgb(hex)
  const mix = hexToRgb(mixHex)
  if (!base || !mix) return hex
  const blended = base.map((channel, idx) => {
    const mixChannel = (Array.isArray(mix) && typeof mix[idx] === 'number') ? mix[idx] : 0
    return Math.round(channel * (1 - ratio) + mixChannel * ratio)
  }) as [number, number, number]
  return rgbToHex(blended[0], blended[1], blended[2])
}

function hexToRgb(hex: string): [number, number, number] | null {
  const normalized = hex.replace('#', '')
  if (!(normalized.length === 6 || normalized.length === 3)) return null
  const expanded = normalized.length === 3
    ? normalized.split('').map((char) => `${char}${char}`).join('')
    : normalized
  const num = Number.parseInt(expanded, 16)
  if (Number.isNaN(num)) return null
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return [r, g, b]
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (value: number) => Math.max(0, Math.min(255, value))
  const toHex = (value: number) => clamp(value).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function isTypeEnabled(typeKey?: string | null): boolean {
  const key = typeKey && TYPE_CATEGORIES.some((item) => item.key === typeKey) ? typeKey : DEFAULT_TYPE_KEY
  return typeFilters[key] !== false
}

function onTypeToggle(key: string, event: Event) {
  const target = event.target as HTMLInputElement | null
  typeFilters[key] = Boolean(target?.checked)
}

function onTypeSelectAll(event: Event) {
  const target = event.target as HTMLInputElement | null
  allTypesSelected.value = Boolean(target?.checked)
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
}

.hover-panel.compact {
  width: 300px;
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
