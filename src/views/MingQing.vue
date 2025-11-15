<template>
  <div class="mingqing-page">
    <div ref="mapContainer" class="map-container" />

    <MapControls
      v-model:modelMode="selectedMode"
      v-model:modelStyle="selectedStyle"
      :modes="MAP_MODES"
      :styles="MAP_STYLES"
      modePlaceholder="选择显示模式"
      stylePlaceholder="选择地图样式"
    />

    <div class="timeline-glass">
      <div class="timeline-labels">
        <span class="timeline-mark" @click="setYear(startYear)">{{ startYear }}</span>
        <input
          class="timeline-slider"
          type="range"
          :min="startYear"
          :max="endYear"
          v-model.number="selectedYear"
        />
        <span class="timeline-mark" @click="setYear(endYear)">{{ endYear }}</span>
        <button
          type="button"
          class="timeline-play"
          :class="{ playing: isPlaying }"
          @click="togglePlay"
          :aria-pressed="isPlaying"
          aria-label="播放/暂停明清城池时间轴"
        >
          <span v-if="!isPlaying">▶ 播放</span>
          <span v-else>❚❚ 暂停</span>
        </button>
      </div>
      <div class="timeline-selected">
        当前年份：<span class="highlight">{{ selectedYear }}</span>
      </div>
    </div>

    <transition name="legend">
      <div class="legend-panel" :class="{ collapsed: !showLegend }" v-if="showLegend" @mouseleave="showLegend = false">
        <h4>准确度档位</h4>
      <ul>
        <li v-for="level in ACCURACY_LEVELS" :key="level.level">
          <span class="swatch" :style="{ backgroundColor: level.color }" />
          <div class="legend-text">
            <strong>{{ level.title }}</strong>
            <span>{{ level.description }}</span>
          </div>
        </li>
      </ul>
      <p class="legend-note">数据来源：丝绸之路城市数据库（明清城区复原）。</p>
      </div>
    </transition>

    <button v-if="!showLegend" class="legend-toggle" @mouseenter="showLegend = true" @focus="showLegend = true" aria-label="展开图例">准确度</button>

    <transition name="slide">
      <div class="hover-panel" v-if="hoverPanel.show">
      <div class="hover-header">
        <div>
          <h3>{{ hoverPanel.props?.name }}</h3>
          <p v-if="hoverPanel.props?.otherName" class="info-sub">别称：{{ hoverPanel.props?.otherName }}</p>
        </div>
        <span class="badge" :style="{ backgroundColor: hoverPanel.props?.color }">{{ hoverPanel.props?.accuracyLabel }}</span>
      </div>
      <ul class="info-list">
        <li>
          <span>存续</span>
          <strong>{{ formatYear(hoverPanel.props?.beginYear) }} - {{ formatYear(hoverPanel.props?.endYear) }}</strong>
        </li>
        <li v-if="hoverPanel.props?.landmark">
          <span>地标依据</span>
          <strong>{{ hoverPanel.props?.landmark }}</strong>
        </li>
        <li v-if="hoverPanel.props?.references">
          <span>参考文献</span>
          <strong>{{ hoverPanel.props?.references }}</strong>
        </li>
      </ul>
      </div>
    </transition>

  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import shp from 'shpjs'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import MapControls from '@/components/MapControls.vue'

type MapMode = 'flat' | 'globe' | 'terrain'

interface MingQingRegionProperties {
  uid: number
  name: string
  otherName?: string
  beginYear?: number
  endYear?: number
  references?: string
  landmark?: string
  accuracy: number
  accuracyLabel: string
  color: string
}

type MingQingRegionFeature = GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon, MingQingRegionProperties> & {
  id: number
}

const ACCURACY_LEVELS = [
  { level: 1, color: '#f94144', title: '档位 1', description: '城墙痕迹清晰，复原结果最准确' },
  { level: 2, color: '#f3722c', title: '档位 2', description: '部分城墙/遗迹保留，可较准确复原' },
  { level: 3, color: '#f9c74f', title: '档位 3', description: '遗迹稀少，辅助地标推断' },
  { level: 4, color: '#90be6d', title: '档位 4', description: '资料缺乏或以规则方格替代' },
]

const ACCURACY_COLOR_MAP = ACCURACY_LEVELS.reduce<Record<number, string>>((acc, level) => {
  acc[level.level] = level.color
  return acc
}, {})

const MAP_MODES = [
  { id: 'flat', name: '平面' },
  { id: 'globe', name: '球形' },
  { id: 'terrain', name: '立体' },
]

const MAP_STYLES = [
  { id: 'mapbox://styles/mapbox/dark-v10', name: '暗色' },
  { id: 'mapbox://styles/mapbox/streets-v11', name: '街道' },
  { id: 'mapbox://styles/mapbox/light-v10', name: '明亮' },
  { id: 'mapbox://styles/mapbox/satellite-v9', name: '卫星' },
  { id: 'mapbox://styles/mapbox/satellite-streets-v11', name: '卫星街道' },
  { id: 'mapbox://styles/mapbox/outdoors-v11', name: '户外' },
  { id: 'mapbox://styles/mapbox/navigation-day-v1', name: '导航（日）' },
  { id: 'mapbox://styles/mapbox/navigation-night-v1', name: '导航（夜）' },
]

const MINGQING_ZIP_URL = new URL('../assets/data/mingqing/mingqing_regions.zip', import.meta.url).href

const mapContainer = ref<HTMLDivElement | null>(null)
let map: any = null
let popup: any = null
let hoveredRegionId: number | null = null
let regionInteractionDisposer: (() => void) | null = null
let latestRegionGeoJSON: GeoJSON.FeatureCollection | null = null

const regions = ref<MingQingRegionFeature[]>([])
const filteredRegions = ref<MingQingRegionFeature[]>([])
let popupTimer: any = null
let lastFeatureKey = ''
let pendingFeatureKey = ''
let isOverRegion = false
const hoverPanel = ref<{ show: boolean; props?: MingQingRegionProperties }>({ show: false })
const showLegend = ref(true)

const selectedMode = ref<MapMode>('flat')
const selectedStyle = ref<string>(MAP_STYLES[0]?.id ?? 'mapbox://styles/mapbox/dark-v10')

const startYear = ref(1368)
const endYear = ref(1912)
const selectedYear = ref(startYear.value)
const playYear = ref(selectedYear.value)
const isPlaying = ref(false)
const playbackSpeed = ref(20)
let rafId: number | null = null
let lastFrameTime = 0

let savedHillEx: number | null = null
let interactionTimer: any = null

watch(selectedYear, (year) => {
  playYear.value = year
  filterRegionsByYear(year)
})

watch(selectedStyle, (style) => applyMapStyle(style))
watch(selectedMode, (mode) => applyMapProjection(mode))

function setYear(year: number) {
  selectedYear.value = year
}

function step(timestamp: number) {
  if (!lastFrameTime) lastFrameTime = timestamp
  const delta = timestamp - lastFrameTime
  lastFrameTime = timestamp
  playYear.value += (delta / 1000) * playbackSpeed.value

  if (playYear.value >= endYear.value) {
    playYear.value = endYear.value
    filterRegionsByYear(playYear.value)
    selectedYear.value = Math.round(playYear.value)
    stopPlayback()
    return
  }

  filterRegionsByYear(playYear.value)
  selectedYear.value = Math.round(playYear.value)
  rafId = requestAnimationFrame(step)
}

function startPlayback() {
  if (isPlaying.value) return
  isPlaying.value = true
  lastFrameTime = 0
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
    if (selectedYear.value >= endYear.value) selectedYear.value = startYear.value
    startPlayback()
  }
}

function mapReady(): boolean {
  return Boolean(map && map.isStyleLoaded())
}

function renderRegions(features: MingQingRegionFeature[]) {
  latestRegionGeoJSON = { type: 'FeatureCollection', features }
  if (!mapReady() || !latestRegionGeoJSON) return

  if (!map!.getSource('mq-regions')) {
    map!.addSource('mq-regions', {
      type: 'geojson',
      data: latestRegionGeoJSON,
      promoteId: 'uid'
    })
  } else {
    const source = map!.getSource('mq-regions') as any
    source?.setData(latestRegionGeoJSON)
  }

  if (!map!.getLayer('mq-regions-fill')) {
    map!.addLayer({
      id: 'mq-regions-fill',
      type: 'fill',
      source: 'mq-regions',
      paint: {
        'fill-color': ['match', ['coalesce', ['get', 'accuracy'], 4], 1, ACCURACY_COLOR_MAP[1], 2, ACCURACY_COLOR_MAP[2], 3, ACCURACY_COLOR_MAP[3], 4, ACCURACY_COLOR_MAP[4], '#8d99ae'],
        'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.85, 0.62]
      }
    })
    // eslint-disable-next-line no-console
    console.log('[MingQing] mq-regions-fill layer added')
  }

  if (!map!.getLayer('mq-regions-outline')) {
    map!.addLayer({
      id: 'mq-regions-outline',
      type: 'line',
      source: 'mq-regions',
      paint: {
        'line-color': '#f5f8fb',
        'line-width': 0.6,
        'line-opacity': 0.65
      }
    })
  }

  attachRegionInteractions()
}

function attachRegionInteractions() {
  if (!map) return
  if (regionInteractionDisposer) regionInteractionDisposer()

  const moveHandler = (e: any) => {
    if (!e.features || !e.features.length) return
    const feature = e.features[0] as any
    const newId = feature.properties.uid
    if (hoveredRegionId !== null && hoveredRegionId !== newId) {
      map!.setFeatureState({ source: 'mq-regions', id: hoveredRegionId }, { hover: false })
    }
    hoveredRegionId = newId
    map!.setFeatureState({ source: 'mq-regions', id: hoveredRegionId }, { hover: true })

    // set region-over flag and cursor
    isOverRegion = true
    try { map.getCanvas().style.cursor = 'pointer' } catch (e) {}

    // debounce/show with small delay to avoid flicker
    const name = feature.properties && (feature.properties.name || '')
    const coordArr = (feature.geometry && feature.geometry.type === 'Point' && feature.geometry.coordinates) ? feature.geometry.coordinates : null
    const coord = coordArr ? coordArr.join(',') : ''
    const featureKey = `${newId}|${coord}|${name}`

    // same feature -> nothing to do (panel already showing)
    if (featureKey === lastFeatureKey) {
      return
    }

    pendingFeatureKey = featureKey
    if (popupTimer) clearTimeout(popupTimer)
    popupTimer = setTimeout(() => {
      if (!isOverRegion || pendingFeatureKey !== featureKey) return
      lastFeatureKey = featureKey
      // show left-side hover panel with more info
      hoverPanel.value = { show: true, props: feature.properties }
    }, 120)
  }

  const leaveHandler = () => {
    if (hoveredRegionId !== null) {
      map!.setFeatureState({ source: 'mq-regions', id: hoveredRegionId }, { hover: false })
      hoveredRegionId = null
    }
    // cancel pending timer and hide left panel
    isOverRegion = false
    pendingFeatureKey = ''
    lastFeatureKey = ''
    if (popupTimer) { clearTimeout(popupTimer); popupTimer = null }
    hoverPanel.value = { show: false }
    try { map.getCanvas().style.cursor = '' } catch (e) {}
  }

  map.on('mousemove', 'mq-regions-fill', moveHandler)
  map.on('mouseleave', 'mq-regions-fill', leaveHandler)

  regionInteractionDisposer = () => {
    map?.off('mousemove', 'mq-regions-fill', moveHandler)
    map?.off('mouseleave', 'mq-regions-fill', leaveHandler)
  }
}

// popup HTML helper removed; using left-side hover panel instead

function formatYear(year?: number) {
  if (typeof year === 'number' && Number.isFinite(year)) return `${Math.round(year)}年`
  return '未知'
}

async function loadMingQingRegions() {
  try {
    const response = await fetch(MINGQING_ZIP_URL)
    if (!response.ok) throw new Error(`获取明清城区数据失败：${response.status}`)
    const buffer = await response.arrayBuffer()
    const dataset = await shp(buffer)
    const collections = Array.isArray(dataset) ? dataset : [dataset]
    const features = collections.flatMap((collection) => collection?.features || [])

    const normalized = features
      .map((feature, idx) => normalizeRegionFeature(feature, idx))
      .filter(Boolean) as MingQingRegionFeature[]

    regions.value = normalized
    const allYears = normalized.flatMap((f) => [f.properties.beginYear, f.properties.endYear].filter((yr): yr is number => typeof yr === 'number' && Number.isFinite(yr)))
    if (allYears.length) {
      startYear.value = Math.min(...allYears)
      endYear.value = Math.max(...allYears)
      selectedYear.value = startYear.value
      playYear.value = startYear.value
    }
    filterRegionsByYear(selectedYear.value)
  } catch (error) {
    console.error('加载明清城区数据失败', error)
    alert('明清城区数据加载失败，请确认数据文件是否完整。')
  }
}

function normalizeRegionFeature(feature: any, idx: number): MingQingRegionFeature | null {
  if (!feature || !feature.geometry) return null
  const raw = feature.properties || {}
  const beginYear = parseYear(raw.begin_yr ?? raw.begin ?? raw.Begin_yr ?? raw.beginYear)
  const endYear = parseYear(raw.end_yr ?? raw.end ?? raw.End_yr ?? raw.endYear)
  const accuracy = parseAccuracy(raw.accuracy ?? raw.Accuracy ?? raw.ACCURACY)

  const normalized: MingQingRegionFeature = {
    type: 'Feature',
    id: idx,
    geometry: feature.geometry,
    properties: {
      uid: idx,
      name: String(raw.name ?? raw.Name ?? raw.NAME ?? `未命名城池 ${idx + 1}`),
      otherName: raw.other_name ?? raw.otherName ?? raw.alias ?? undefined,
      beginYear,
      endYear,
      references: raw.references ?? raw.reference ?? raw.source ?? undefined,
      landmark: raw.landmark ?? raw.landmarks ?? undefined,
      accuracy,
      accuracyLabel: getAccuracyLabel(accuracy),
      color: getAccuracyColor(accuracy)
    }
  }
  return normalized
}

function parseYear(input: unknown): number | undefined {
  const num = Number(input)
  return Number.isFinite(num) ? num : undefined
}

function parseAccuracy(input: unknown): number {
  const num = Number(input)
  if (num >= 1 && num <= 4) return Math.round(num)
  return 4
}

function getAccuracyColor(level: number) {
  return ACCURACY_COLOR_MAP[level] || '#8d99ae'
}

function getAccuracyLabel(level: number) {
  const match = ACCURACY_LEVELS.find((item) => item.level === level)
  return match ? match.title : '档位未明'
}

function filterRegionsByYear(year: number) {
  const filtered = regions.value.filter((region) => {
    const beg = typeof region.properties.beginYear === 'number' ? region.properties.beginYear : -Infinity
    const end = typeof region.properties.endYear === 'number' ? region.properties.endYear : Infinity
    return beg <= year && end >= year
  })
  filteredRegions.value = filtered
  renderRegions(filtered)
}


function applyMapStyle(styleId: string) {
  if (!map) return
  map.setStyle(styleId)
  map.once('style.load', () => {
    setChineseLabels()
    applyMapProjection(selectedMode.value)
    if (latestRegionGeoJSON) renderRegions(filteredRegions.value)
  })
}

function applyMapProjection(mode: MapMode) {
  if (!map) return
  if (mode === 'globe') {
    map.setProjection('globe')
    disableTerrain()
    ensureSkyLayer()
    return
  }

  map.setProjection('mercator')
  removeSkyLayer()

  if (mode === 'terrain') {
    enableTerrain()
  } else {
    disableTerrain()
  }
}

function enableTerrain() {
  if (!map) return
  try {
    if (!map.getSource('mapbox-dem')) {
      map.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.terrain-rgb',
        tileSize: 512,
        maxzoom: 14
      })
    }
    map.setTerrain({ source: 'mapbox-dem', exaggeration: 2.5 })
    if (!map.getLayer('hillshade-layer')) {
      map.addLayer({
        id: 'hillshade-layer',
        type: 'hillshade',
        source: 'mapbox-dem',
        paint: { 'hillshade-exaggeration': 0.8 }
      })
    }
  } catch (error) {
    console.warn('启用地形失败', error)
  }
}

function disableTerrain() {
  if (!map) return
  try { map.setTerrain(null) } catch (e) {}
  if (map.getLayer('hillshade-layer')) {
    try { map.removeLayer('hillshade-layer') } catch (e) {}
  }
  if (map.getSource('mapbox-dem')) {
    try { map.removeSource('mapbox-dem') } catch (e) {}
  }
}

function ensureSkyLayer() {
  if (!map || map.getLayer('sky')) return
  map.addLayer({
    id: 'sky',
    type: 'sky',
    paint: {
      'sky-type': 'atmosphere',
      'sky-atmosphere-sun': [0.0, 0.0],
      'sky-atmosphere-sun-intensity': 12,
      'sky-atmosphere-color': '#101020',
      'sky-atmosphere-halo-color': '#1f2a44',
      'sky-opacity': 1
    }
  })
}

function removeSkyLayer() {
  if (map && map.getLayer('sky')) {
    try { map.removeLayer('sky') } catch (e) {}
  }
}

function reduceTerrainForInteraction() {
  if (!map) return
  try {
    if (map.getLayer('hillshade-layer')) {
      if (savedHillEx === null) {
        savedHillEx = map.getPaintProperty('hillshade-layer', 'hillshade-exaggeration') as number || 0.8
      }
      map.setPaintProperty('hillshade-layer', 'hillshade-exaggeration', 0.2)
    }
  } catch (e) {}
  if (interactionTimer) clearTimeout(interactionTimer)
}

function restoreTerrainAfterInteraction() {
  if (!map) return
  if (interactionTimer) clearTimeout(interactionTimer)
  interactionTimer = setTimeout(() => {
    try {
      if (map.getLayer('hillshade-layer') && savedHillEx !== null) {
        map.setPaintProperty('hillshade-layer', 'hillshade-exaggeration', savedHillEx)
      }
    } catch (e) {}
    savedHillEx = null
    interactionTimer = null
  }, 220)
}

function setChineseLabels() {
  if (!map) return
  const CANDIDATE_KEYS = ['name_zh', 'name_zh_cn', 'name_zh-Hans', 'name_zh_hans', 'name_zh_CN', 'name_zh-Hant', 'name_zh_tw', 'name']
  try {
    const style = map.getStyle()
    const layers = (style && style.layers) || []
    layers.forEach((layer: any) => {
      if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
        const expr: any[] = ['coalesce']
        CANDIDATE_KEYS.forEach((k) => expr.push(['get', k]))
        try {
          map.setLayoutProperty(layer.id, 'text-field', expr)
        } catch (innerErr) {}
      }
    })
  } catch (error) {
    console.warn('设置中文标签失败', error)
  }
}

onMounted(() => {
  mapboxgl.accessToken = (import.meta.env.VITE_MAPBOX_TOKEN as string) || ''
  if (!mapContainer.value) return

  map = new mapboxgl.Map({
    container: mapContainer.value,
    style: selectedStyle.value,
    center: [112, 35],
    zoom: 3.6,
    projection: selectedMode.value === 'globe' ? 'globe' : 'mercator'
  })

  popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, anchor: 'top', className: 'custom-popup' })
  // debug: ensure popup instance exists
  // eslint-disable-next-line no-console
  console.log('[MingQing] popup initialized', !!popup)

  map.addControl(new mapboxgl.NavigationControl(), 'bottom-right')
  map.addControl(new mapboxgl.ScaleControl({ maxWidth: 120, unit: 'metric' }))

  map.on('load', () => {
    setChineseLabels()
    applyMapProjection(selectedMode.value)
    if (latestRegionGeoJSON && filteredRegions.value.length) {
      renderRegions(filteredRegions.value)
    }
  })

  map.on('styledata', () => {
    setChineseLabels()
  })
  map.on('style.load', () => {
    setChineseLabels()
  })

  map.on('movestart', reduceTerrainForInteraction)
  map.on('zoomstart', reduceTerrainForInteraction)
  map.on('rotatestart', reduceTerrainForInteraction)
  map.on('pitchstart', reduceTerrainForInteraction)
  map.on('moveend', restoreTerrainAfterInteraction)
  map.on('zoomend', restoreTerrainAfterInteraction)
  map.on('rotateend', restoreTerrainAfterInteraction)
  map.on('pitchend', restoreTerrainAfterInteraction)

  void loadMingQingRegions()
})

onUnmounted(() => {
  stopPlayback()
  if (regionInteractionDisposer) regionInteractionDisposer()
  if (map) {
    map.off('movestart', reduceTerrainForInteraction)
    map.off('zoomstart', reduceTerrainForInteraction)
    map.off('rotatestart', reduceTerrainForInteraction)
    map.off('pitchstart', reduceTerrainForInteraction)
    map.off('moveend', restoreTerrainAfterInteraction)
    map.off('zoomend', restoreTerrainAfterInteraction)
    map.off('rotateend', restoreTerrainAfterInteraction)
    map.off('pitchend', restoreTerrainAfterInteraction)
    map.remove()
    map = null
  }
  popup?.remove()
})
</script>

<style scoped lang="scss">
.mingqing-page {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.map-container {
  position: absolute;
  inset: 0;
}

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

.legend-panel.collapsed {
  width: 48px;
  padding: 8px;
  overflow: hidden;
}

.legend-close {
  position: absolute;
  top: 8px;
  right: 8px;
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.7);
  cursor: pointer;
  font-size: 14px;
}

.legend-toggle {
  position: absolute;
  top: 24px;
  right: 24px;
  background: rgba(6,9,16,0.82);
  color: #eef2ff;
  border: 1px solid rgba(255,255,255,0.06);
  padding: 8px 10px;
  border-radius: 12px;
  z-index: 2000;
  cursor: pointer;
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

.hover-panel {
  position: absolute;
  left: 24px;
  top: 72px; /* 下移，避免遮挡左上角下拉控件 */
  width: 360px;
  padding: 18px;
  background: rgba(6, 9, 16, 0.88);
  border-radius: 14px;
  color: #f2f6ff;
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 12px 36px rgba(0,0,0,0.45);
  z-index: 3000;
}

.hover-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.hover-header h3 { margin: 0; font-size: 18px }
.info-sub { margin: 2px 0 0; font-size: 13px; color: rgba(255,255,255,0.78) }
.badge { padding: 6px 12px; border-radius: 999px; font-size: 12px; color: #06101d; font-weight: 700 }

.info-list { list-style: none; padding: 0; margin: 14px 0 0; display:flex; flex-direction:column; gap:10px }
.info-list li { display:flex; justify-content:space-between; font-size:13px; border-bottom:1px solid rgba(255,255,255,0.04); padding-bottom:6px }

/* Slide transition for hover panel */
.slide-enter-active, .slide-leave-active {
  transition: transform 220ms cubic-bezier(.2,.9,.2,1), opacity 180ms ease;
}
.slide-enter-from, .slide-leave-to {
  transform: translateX(-12px);
  opacity: 0;
}
.slide-enter-to, .slide-leave-from {
  transform: translateX(0);
  opacity: 1;
}

/* Legend slide-right transition: enter from right, leave to right */
.legend-enter-active, .legend-leave-active {
  transition: transform 220ms cubic-bezier(.2,.9,.2,1), opacity 180ms ease;
}
.legend-enter-from, .legend-leave-to {
  transform: translateX(12px);
  opacity: 0;
}
.legend-enter-to, .legend-leave-from {
  transform: translateX(0);
  opacity: 1;
}


@media (max-width: 900px) {
  .legend-panel {
    position: static;
    margin: 12px;
    width: auto;
  }

  .timeline-glass {
    left: 12px;
    right: 12px;
    transform: none;
  }
}
</style>
