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
        <span class="timeline-mark active" @click="setYear(startYear)">{{ startYear }}</span>
        <input type="range" :min="startYear" :max="endYear" v-model.number="selectedYear" class="timeline-slider" />
        <span class="timeline-mark active" @click="setYear(endYear)">{{ endYear }}</span>
        <button
          type="button"
          class="timeline-play"
          :class="{ playing: isPlaying }"
          @click="togglePlay"
          :aria-pressed="isPlaying"
          aria-label="播放/暂停时间轴"
        >
          <span v-if="!isPlaying">▶ 播放</span>
          <span v-else>❚❚ 暂停</span>
        </button>
      </div>
      <div class="timeline-selected">当前年份：<span class="highlight">{{ selectedYear }}</span></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as shapefile from 'shapefile'
import { ref, onMounted, onUnmounted, watch } from 'vue'

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

// 交互优化：在用户交互（拖动/缩放/旋转/倾斜）期间降低 hillshade 强度，交互结束后恢复
let savedHillEx: number | null = null
let interactionTimer: any = null

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
  if (mode === 'globe') {
    // 球形投影：不启用地形放大效果，仅设置 globe 投影并添加天空层
    map.setProjection('globe')
    setTimeout(() => {
      if (map.getProjection().name !== 'globe') {
        map.setProjection('globe')
      }
    }, 100)
    // 仅添加 sky 层以增强球形视觉，但不添加 raster-dem / setTerrain
    map.once('style.load', () => {
      if (!map.getLayer('sky')) {
        map.addLayer({
          id: 'sky',
          type: 'sky',
          paint: {
            'sky-type': 'atmosphere',
            'sky-atmosphere-sun': [0.0, 0.0],
            'sky-atmosphere-sun-intensity': 15,
            'sky-atmosphere-color': '#101020',
            'sky-atmosphere-halo-color': '#222244',
            'sky-opacity': 1
          }
        })
      }
    })
  } else {
    // 默认平面（mercator）或立体（terrain）都使用 mercator 投影
    map.setProjection('mercator')
    setTimeout(() => {
      if (map.getProjection().name !== 'mercator') {
        map.setProjection('mercator')
      }
    }, 100)
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

// 加载 Shapefile 数据，支持指定编码
async function loadShapefileWithEncoding(filePath: string, encoding: string = 'utf-8'): Promise<any> {
  try {
    const source = await shapefile.open(filePath, undefined, { encoding });
    const features = [];
    let result = await source.read();
    while (!result.done) {
      features.push(result.value);
      result = await source.read();
    }
    return { type: 'FeatureCollection', features };
  } catch (error) {
    console.error(`加载 Shapefile 文件失败: ${filePath}`, error);
    throw error;
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
  const pointsData = { type: 'FeatureCollection', features: filteredPoints }
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
        'circle-radius': 6,
        'circle-color': '#e67e22',
        'circle-stroke-width': 1.5,
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
        'line-width': 3,
        'line-color': '#2980b9'
      }
    })
  }

  // 绑定一次弹窗事件，避免重复绑定；对 hitbox 层使用 mousemove/mouseleave
  map.off('mousemove', 'points-hitbox')
  map.off('mouseleave', 'points-hitbox')
  let popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    anchor: 'top',
    className: 'custom-popup'
  })
  // 更新弹窗内容生成逻辑，移除省字段
  function generatePopupContent(properties: TangPointProperties): string {
    const {
      Name_CH, Name_EN, Type, PL_City, County, Town, Site, Beg_year, End_year
    } = properties;

    return `
      <h3>${Name_CH || Name_EN || '未知名称'}</h3>
      <p>
        ${Type ? `<strong>类型：</strong>${Type}<br/>` : '<strong>类型：</strong>未知<br/>'}
        ${PL_City || County || Town 
          ? `<strong>市县镇：</strong>${PL_City || ''} ${County || ''} ${Town || ''}<br/>`
          : '<strong>市县镇：</strong>未知<br/>'}
        ${Site ? `<strong>遗址：</strong>${Site}<br/>` : '<strong>遗址：</strong>未知<br/>'}
        ${(Beg_year || End_year) 
          ? `<strong>起讫年：</strong>${Beg_year || '未知'} - ${End_year || '未知'}`
          : '<strong>起讫年：</strong>未知'}
      </p>
    `;
  }

  // 优化弹窗事件绑定逻辑：在 hitbox 图层上使用 mousemove 更新弹窗，避免闪烁
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
    if (featureKey === lastFeatureKey) {
      // 始终把弹窗定位到要素的经纬度（比鼠标位置更稳定）
      if (coordArr) popup.setLngLat(coordArr)
      return
    }

    // 不同要素：使用短延迟（debounce）再显示，避免快速切换导致闪烁
    pendingFeatureKey = featureKey
    if (popupTimer) clearTimeout(popupTimer)
    popupTimer = setTimeout(() => {
      // 如果用户已经离开或又到别的要素，取消
      if (!isOverPoint || pendingFeatureKey !== featureKey) return
      lastFeatureKey = featureKey
      const content = generatePopupContent(feat.properties)
      if (coordArr) popup.setLngLat(coordArr).setHTML(content).addTo(map)
      else popup.setLngLat(e.lngLat).setHTML(content).addTo(map)
    }, 120) // 120ms 延迟，可调整
  })

  map.on('mouseleave', 'points-hitbox', () => {
    isOverPoint = false
    pendingFeatureKey = ''
    lastFeatureKey = ''
    if (popupTimer) { clearTimeout(popupTimer); popupTimer = null }
    map.getCanvas().style.cursor = isMouseDown ? 'grabbing' : ''
    popup.remove()
  })

  // 为路线图层添加弹窗（线的 tooltip）
  map.off('mousemove', 'lines')
  map.off('mouseleave', 'lines')
  const popupLine = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, anchor: 'top', className: 'custom-popup' })
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
    if (featureKey === lastLineKey) {
      popupLine.setLngLat(e.lngLat)
      return
    }

    pendingLineKey = featureKey
    if (lineTimer) clearTimeout(lineTimer)
    lineTimer = setTimeout(() => {
      if (pendingLineKey !== featureKey) return
      lastLineKey = featureKey
      const info = `<h3>${name || '未知路线'}</h3><p>${(beg || end) ? `<strong>起讫年：</strong>${beg || '未知'} - ${end || '未知'}` : '<strong>起讫年：</strong>未知'}</p>`
      popupLine.setLngLat(e.lngLat).setHTML(info).addTo(map)
    }, 120)
  })

  map.on('mouseleave', 'lines', () => {
    pendingLineKey = ''
    lastLineKey = ''
    if (lineTimer) { clearTimeout(lineTimer); lineTimer = null }
    popupLine.remove()
  })
}

// 地图弹窗显示逻辑
let popup: any = null
if (typeof window !== 'undefined' && window.mapboxgl) {
  popup = new window.mapboxgl.Popup({closeButton: false, closeOnClick: false})
  if (map) {
    map.on('showPopup', (e: any) => {
      popup.setLngLat(e.lngLat).setHTML(e.info).addTo(map)
    })
    map.on('hidePopup', () => {
      popup.remove()
    })
  }
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

    map.addControl(new mapboxgl.NavigationControl(), 'bottom-right') // 移动导航控件到右下角
    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 100, unit: 'metric' }))

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
      const nodesData = await loadShapefileWithEncoding('/data/tang/nodes.shp', 'gbk')
      if (!nodesData || !nodesData.features) {
        throw new Error('nodes.zip 解析失败或无 features')
      }
      points.value = nodesData.features
    } catch (e) {
      console.error('交通点数据加载失败', e)
      alert('交通点数据加载失败，请检查文件内容和路径！')
      points.value = []
    }
    try {
      const routesData = await loadShapefileWithEncoding('/data/tang/routes.shp', 'gbk')
      if (!routesData || !routesData.features) {
        throw new Error('routes.zip 解析失败或无 features')
      }
      lines.value = routesData.features
    } catch (e) {
      console.error('交通线数据加载失败', e)
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
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
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

/* 时间轴样式 */
.timeline-glass {
  position: absolute;
  left: 50%;
  bottom: 32px;
  transform: translateX(-50%);
  min-width: 340px;
  max-width: 600px;
  background: rgba(255,255,255,0.35);
  border-radius: 18px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.18);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  padding: 18px 32px 12px 32px;
  z-index: 2100;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.timeline-labels {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  width: 100%;
  margin-bottom: 8px;
}
.timeline-mark {
  cursor: pointer;
  color: #2980b9;
  font-size: 16px;
  padding: 4px 14px;
  border-radius: 8px;
  font-weight: bold;
  background: rgba(255,255,255,0.18);
  transition: background 0.2s, color 0.2s;
  user-select: none;
}
.timeline-mark.active {
  background: #eaf6fb;
  color: #e67e22;
}
.timeline-slider {
  flex: 1;
  width: 320px;
  height: 4px;
  margin: 0 12px;
  accent-color: #2980b9;
  transition: box-shadow 0.2s;
}
.timeline-slider:active {
  box-shadow: 0 0 0 4px rgba(41,128,185,0.12);
}
.timeline-selected {
  margin-top: 6px;
  font-size: 15px;
  color: #222;
  letter-spacing: 1px;
}
.timeline-selected .highlight {
  color: #e67e22;
  font-weight: bold;
  font-size: 18px;
}
.timeline-play {
  margin-left: 12px;
  padding: 4px 12px;
  font-size: 14px;
  color: #fff;
  background: #2980b9;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.3s;
}
.timeline-play:hover {
  background: #3498db;
}

/* 自定义弹窗样式 - 全局样式以确保生效 */
.custom-popup .mapboxgl-popup-content {
  background: rgba(255, 255, 255, 0.28) !important;
  color: #333 !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12) !important;
  backdrop-filter: blur(8px) !important;
  -webkit-backdrop-filter: blur(8px) !important;
  padding: 12px 16px !important;
  line-height: 1.6 !important;
  font-family: 'Microsoft YaHei', Arial, sans-serif !important;
  border: none !important;
  box-sizing: border-box !important;
}

.custom-popup .mapboxgl-popup {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.custom-popup h3 {
  margin: 0 !important;
  color: #e67e22 !important;
  font-size: 16px !important;
}

.custom-popup p {
  margin: 8px 0 0 !important;
  font-size: 14px !important;
}
</style>

<!-- 全局样式：为 Mapbox 弹窗添加不受 scoped 限制的样式，确保毛玻璃与圆角生效 -->
<style>
/* global popup overrides (must be global so it applies to DOM appended to body) */
.custom-popup.mapboxgl-popup {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}
.custom-popup.mapboxgl-popup .mapboxgl-popup-content {
  background: rgba(255,255,255,0.28) !important;
  color: #333 !important;
  border-radius: 12px !important;
  box-shadow: 0 6px 18px rgba(0,0,0,0.12) !important;
  backdrop-filter: blur(8px) !important;
  -webkit-backdrop-filter: blur(8px) !important;
  padding: 12px 16px !important;
  line-height: 1.6 !important;
  font-family: 'Microsoft YaHei', Arial, sans-serif !important;
  border: none !important;
  box-sizing: border-box !important;
}
.custom-popup.mapboxgl-popup .mapboxgl-popup-tip {
  display: none !important;
}
.custom-popup.mapboxgl-popup h3 { color: #e67e22 !important; margin:0 !important; }
.custom-popup.mapboxgl-popup p { margin:8px 0 0 !important; }
</style>

<!-- global default for map canvas cursor: neutral default until we set inline styles -->
<style>
.mapboxgl-canvas { cursor: default; }
</style>
