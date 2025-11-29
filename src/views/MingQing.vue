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
            <h4>精准度</h4>
            <div class="legend-select-all">
              <label class="legend-item">
                <input
                  type="checkbox"
                  class="legend-checkbox"
                  :checked="allAccuracySelected"
                  @change="onAccuracySelectAll($event)"
                />
                <div class="legend-text">
                  <strong>全选</strong>
                  <span>切换全部准确度等级</span>
                </div>
              </label>
            </div>
            <ul>
              <li v-for="level in ACCURACY_LEVELS" :key="level.level">
                <label class="legend-item">
                  <input
                    type="checkbox"
                    class="legend-checkbox"
                    :checked="Boolean(accuracyFilters[level.level])"
                    @change="onAccuracyToggle(level.level, $event)"
                  />
                  <span class="swatch" :style="{ backgroundColor: level.color }" />
                  <div class="legend-text">
                    <strong>{{ level.title }}</strong>
                    <span>{{ level.description }}</span>
                  </div>
                </label>
              </li>
            </ul>
            <p class="legend-note">数据来源：丝绸之路城市数据库（明清城区复原）。</p>
          </div>
        </transition>

        <button v-if="!showLegend" class="legend-toggle" @mouseenter="showLegend = true" @focus="showLegend = true" aria-label="展开图例">准确度</button>

    <transition name="slide">
      <div class="hover-panel compact" v-if="hoverPanel.show">
        <div class="hover-top">
          <div class="icon-wrap" :style="{ borderColor: hoverPanel.props?.color || '#e67e22' }">
            <div class="icon-core" :style="{ backgroundColor: hoverPanel.props?.color || '#e67e22' }" />
          </div>
          <div class="hover-title">
            <h4 class="title">{{ hoverPanel.props?.name }}</h4>
            <div v-if="hoverPanel.props?.otherName" class="subtitle">别称：{{ hoverPanel.props?.otherName }}</div>
          </div>
          <div class="meta">
            <span class="badge small" :style="{ backgroundColor: hoverPanel.props?.color }">{{ hoverPanel.props?.accuracyLabel }}</span>
          </div>
        </div>

        <div class="hover-body">
          <div class="row">
            <div class="label">存续</div>
            <div class="value">{{ formatYear(hoverPanel.props?.beginYear) }} - {{ formatYear(hoverPanel.props?.endYear) }}</div>
          </div>
          <div class="row" v-if="hoverPanel.props?.landmark">
            <div class="label">地标</div>
            <div class="value">{{ hoverPanel.props?.landmark }}</div>
          </div>
          <div class="row" v-if="hoverPanel.props?.references">
            <div class="label">资料</div>
            <div class="value">{{ hoverPanel.props?.references }}</div>
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
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { reactive, computed } from 'vue'
import shp from 'shpjs'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import MapControls from '@/components/MapControls.vue'
import { useGestureControl } from '@/composables/useGestureControl'

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

// accuracy: 1 = most certain (green), 4 = least certain (red)
// Titles adjusted per design: 档位 1：精准, 档位 2：较准, 档位 3：推知, 档位 4：替代
const ACCURACY_LEVELS = [
  { level: 1, color: '#2ecc71', title: '精准', description: '城墙痕迹清晰，复原结果最准确' },
  { level: 2, color: '#90be6d', title: '较准', description: '部分城墙/遗迹保留，可较准确复原' },
  { level: 3, color: '#f9c74f', title: '推知', description: '遗迹稀少，辅助地标推断' },
  { level: 4, color: '#ef476f', title: '替代', description: '资料缺乏或以规则方格替代' },
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

// detail zoom used when flying to a marker (set between 14-16 per request)
// increased for closer-to-ground view
const DETAIL_ZOOM = 16

import mingqingRegionsZipUrl from '@/assets/data/mingqing/mingqing_regions.zip?url'

const MINGQING_ZIP_URL = mingqingRegionsZipUrl

const mapContainer = ref<HTMLDivElement | null>(null)
let map: any = null
let popup: any = null
let hoveredRegionId: number | null = null
let regionInteractionDisposer: (() => void) | null = null
let latestRegionGeoJSON: GeoJSON.FeatureCollection | null = null

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
      const sensitivity = 1000 
      map.panBy([-deltaX * sensitivity, -deltaY * sensitivity], { animate: false })
    }
  },
  (zoomFactor) => {
    if (map) {
      const currentZoom = map.getZoom()
      const sensitivity = 0.3
      const deltaZoom = (zoomFactor - 1) * sensitivity * 10
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
      const newPitch = currentPitch - deltaY * pitchSensitivity

      map.jumpTo({
        bearing: newBearing,
        pitch: Math.max(0, Math.min(85, newPitch))
      })
    }
  }
)

const regions = ref<MingQingRegionFeature[]>([])
const filteredRegions = ref<MingQingRegionFeature[]>([])
let popupTimer: any = null
let lastFeatureKey = ''
let pendingFeatureKey = ''
let isOverRegion = false
const hoverPanel = ref<{ show: boolean; props?: MingQingRegionProperties }>({ show: false })
const showLegend = ref(true)
const accuracyFilters = reactive<Record<number, boolean>>(ACCURACY_LEVELS.reduce((acc, level) => {
  acc[level.level] = true
  return acc
}, {} as Record<number, boolean>))

const allAccuracySelected = computed({
  get: () => ACCURACY_LEVELS.every((level) => accuracyFilters[level.level]),
  set: (value: boolean) => {
    ACCURACY_LEVELS.forEach((level) => {
      accuracyFilters[level.level] = value
    })
  }
})

const selectedMode = ref<MapMode>('flat')
const selectedStyle = ref<string>(MAP_STYLES[0]?.id ?? 'mapbox://styles/mapbox/dark-v10')

const DEFAULT_START_YEAR = 1367
const startYear = ref(DEFAULT_START_YEAR)
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

watch(regions, (list) => {
  if (!list.length) return
  if (selectedYear.value !== startYear.value) {
    selectedYear.value = startYear.value
    return
  }
  filterRegionsByYear(startYear.value)
})

watch(accuracyFilters, () => {
  filterRegionsByYear(selectedYear.value)
}, { deep: true })

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
  // debug log
  // eslint-disable-next-line no-console
  console.log('[MingQing] renderRegions called, features:', Array.isArray(features) ? features.length : 0)
  if (!mapReady() || !latestRegionGeoJSON) return

  // Prefer updating existing sources to avoid removing/adding layers which causes flicker
  try {
    if (map!.getSource('mq-regions')) {
      try { (map!.getSource('mq-regions') as any).setData(latestRegionGeoJSON) } catch (e) { /* ignore */ }
    } else {
      map!.addSource('mq-regions', { type: 'geojson', data: latestRegionGeoJSON, promoteId: 'uid' })
    }
  } catch (err) {
    // if something unexpected happens, attempt a safe recreate after removing old resources
    try {
      if (map!.getLayer('mq-regions-fill')) { map!.removeLayer('mq-regions-fill') }
      if (map!.getLayer('mq-regions-outline')) { map!.removeLayer('mq-regions-outline') }
      if (map!.getSource('mq-regions')) { map!.removeSource('mq-regions') }
      map!.addSource('mq-regions', { type: 'geojson', data: latestRegionGeoJSON, promoteId: 'uid' })
    } catch (e) { /* ignore */ }
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

  // Create/update centroid labels for regions (visible when zoomed out)
    const labelFeatures = features.map((f) => {
    const geom = f.geometry as any
    let coords: [number, number] | null = null
    if (geom && geom.type === 'Polygon') {
      const ring = (geom.coordinates && geom.coordinates[0]) || []
      if (ring.length) {
        // typescript-safe reduce: ensure values exist
        let sx = 0, sy = 0
        for (let i = 0; i < ring.length; i++) {
          const c = ring[i]
          if (c && typeof c[0] === 'number' && typeof c[1] === 'number') {
            sx += c[0]
            sy += c[1]
          }
        }
        coords = [sx / ring.length, sy / ring.length]
      }
    } else if (geom && geom.type === 'MultiPolygon') {
      // take centroid of first polygon's first ring as approximation
      const ring = ((geom.coordinates && geom.coordinates[0]) ? geom.coordinates[0][0] : []) || []
      if (ring.length) {
        let sx = 0, sy = 0
        for (let i = 0; i < ring.length; i++) {
          const c = ring[i]
          if (c && typeof c[0] === 'number' && typeof c[1] === 'number') {
            sx += c[0]
            sy += c[1]
          }
        }
        coords = [sx / ring.length, sy / ring.length]
      }
    }
    return {
      type: 'Feature',
      geometry: coords ? { type: 'Point', coordinates: coords } : null,
      properties: { uid: f.properties.uid, color: f.properties.color, accuracy: f.properties.accuracy }
    }
  }).filter((d) => d.geometry)

  const labelsGeoJSON = { type: 'FeatureCollection', features: labelFeatures }
  try {
    if (map!.getSource('mq-labels')) {
      try { (map!.getSource('mq-labels') as any).setData(labelsGeoJSON) } catch (e) { /* ignore */ }
    } else {
      map!.addSource('mq-labels', { type: 'geojson', data: labelsGeoJSON })
    }
  } catch (err) {
    // fallback: attempt safe recreate
    try {
      if (map!.getLayer('mq-labels-halo')) { map!.removeLayer('mq-labels-halo') }
      if (map!.getLayer('mq-labels-dot')) { map!.removeLayer('mq-labels-dot') }
      if (map!.getSource('mq-labels')) { map!.removeSource('mq-labels') }
      map!.addSource('mq-labels', { type: 'geojson', data: labelsGeoJSON })
    } catch (e) { /* ignore */ }
  }

  // refined marker: outer halo + colored core (no text labels)
  if (!map!.getLayer('mq-labels-halo')) {
    map!.addLayer({
      id: 'mq-labels-halo',
      type: 'circle',
      source: 'mq-labels',
      minzoom: 0,
      maxzoom: 8,
      paint: {
        // halo grows slightly with zoom to remain visible at low zooms
        'circle-radius': [
          'interpolate', ['exponential', 1.2], ['zoom'],
          0, 6,
          8, 14
        ],
        'circle-color': 'rgba(8,12,18,0.65)',
        'circle-blur': 0.6,
        'circle-opacity': 0.9
      }
    })
  }

  if (!map!.getLayer('mq-labels-dot')) {
    map!.addLayer({
      id: 'mq-labels-dot',
      type: 'circle',
      source: 'mq-labels',
      minzoom: 0,
      maxzoom: 8,
      paint: {
        'circle-radius': [
          'interpolate', ['exponential', 1.2], ['zoom'],
          0, 3,
          8, 8
        ],
        // use feature color if provided, fallback to accuracy mapping
        'circle-color': ['coalesce', ['get', 'color'], '#e67e22'],
        'circle-stroke-color': 'rgba(255,255,255,0.85)',
        'circle-stroke-width': 0.8
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
  // also react to hovering the refined marker (dot) so users can hover the point
  const labelMoveHandler = (e: any) => {
    if (!e.features || !e.features.length) return
    const labelFeature = e.features[0] as any
    const newId = labelFeature.properties.uid
    // highlight corresponding region
    if (hoveredRegionId !== null && hoveredRegionId !== newId) {
      map!.setFeatureState({ source: 'mq-regions', id: hoveredRegionId }, { hover: false })
    }
    hoveredRegionId = newId
    try { map!.setFeatureState({ source: 'mq-regions', id: hoveredRegionId }, { hover: true }) } catch (e) {}

    isOverRegion = true
    try { map.getCanvas().style.cursor = 'pointer' } catch (e) {}

    const uid = newId
    const coordArr = (labelFeature.geometry && labelFeature.geometry.type === 'Point' && labelFeature.geometry.coordinates) ? labelFeature.geometry.coordinates : null
    const coord = coordArr ? coordArr.join(',') : ''
    const featureKey = `${uid}|${coord}`

    if (featureKey === lastFeatureKey) return

    pendingFeatureKey = featureKey
    if (popupTimer) clearTimeout(popupTimer)
    popupTimer = setTimeout(() => {
      if (!isOverRegion || pendingFeatureKey !== featureKey) return
      lastFeatureKey = featureKey
      // find the full region properties by uid
      const region = (latestRegionGeoJSON && latestRegionGeoJSON.features) ? latestRegionGeoJSON.features.find((f: any) => f.properties && f.properties.uid === uid) : null
      const props = region ? (region.properties as MingQingRegionProperties) : undefined
      hoverPanel.value = { show: true, props }
    }, 120)
  }

  const labelLeaveHandler = () => {
    if (hoveredRegionId !== null) {
      try { map!.setFeatureState({ source: 'mq-regions', id: hoveredRegionId }, { hover: false }) } catch (e) {}
      hoveredRegionId = null
    }
    isOverRegion = false
    pendingFeatureKey = ''
    lastFeatureKey = ''
    if (popupTimer) { clearTimeout(popupTimer); popupTimer = null }
    hoverPanel.value = { show: false }
    try { map.getCanvas().style.cursor = '' } catch (e) {}
  }

  const labelDblClickHandler = (e: any) => {
    if (!e.features || !e.features.length) return
    const labelFeature = e.features[0] as any
    const coords = (labelFeature.geometry && labelFeature.geometry.type === 'Point' && labelFeature.geometry.coordinates) ? labelFeature.geometry.coordinates : null
    if (!coords) return
    const uid = labelFeature.properties && (labelFeature.properties.uid ?? labelFeature.properties.id)
    // fly to the marker and zoom in for a close-to-ground, oblique view
    try {
      // prevent default double-click zoom interfering
      try {
        e.originalEvent && e.originalEvent.preventDefault && e.originalEvent.preventDefault()
        e.originalEvent && e.originalEvent.stopPropagation && e.originalEvent.stopPropagation()
      } catch (err) {}

      // disable map's default doubleClickZoom behavior while we control the flight
      try { map.doubleClickZoom && map.doubleClickZoom.disable && map.doubleClickZoom.disable() } catch (err) {}

      map.flyTo({
        center: coords,
        zoom: DETAIL_ZOOM,
        pitch: 60,
        bearing: 0,
        speed: 0.9,
        curve: 1.6,
        essential: true
      })
      // after flying, open the hover panel and highlight the region; then restore doubleClickZoom
      map.once && map.once('moveend', () => {
        try {
          const region = (latestRegionGeoJSON && latestRegionGeoJSON.features) ? latestRegionGeoJSON.features.find((f: any) => f.properties && (f.properties.uid === uid || f.id === uid)) : null
          const props = region ? (region.properties as MingQingRegionProperties) : undefined
          hoverPanel.value = { show: true, props }
          if (hoveredRegionId !== null && hoveredRegionId !== uid) {
            try { map.setFeatureState({ source: 'mq-regions', id: hoveredRegionId }, { hover: false }) } catch (e) {}
          }
          if (uid !== undefined && uid !== null) {
            try { map.setFeatureState({ source: 'mq-regions', id: uid }, { hover: true }) } catch (e) {}
            hoveredRegionId = uid
          }
        } catch (err) {
          // ignore
        } finally {
          try { map.doubleClickZoom && map.doubleClickZoom.enable && map.doubleClickZoom.enable() } catch (err) {}
        }
      })
    } catch (err) {
      // fallback to easeTo if flyTo fails
      try {
        // also temporarily disable doubleClickZoom to avoid conflicts
        try { map.doubleClickZoom && map.doubleClickZoom.disable && map.doubleClickZoom.disable() } catch (err) {}
        map.easeTo({ center: coords, zoom: DETAIL_ZOOM, pitch: 60 })
        try { map.doubleClickZoom && map.doubleClickZoom.enable && map.doubleClickZoom.enable() } catch (err) {}
      } catch (e) {}
    }
  }

  map.on('mousemove', 'mq-labels-dot', labelMoveHandler)
  map.on('mouseleave', 'mq-labels-dot', labelLeaveHandler)
  map.on('dblclick', 'mq-labels-dot', labelDblClickHandler)

  regionInteractionDisposer = () => {
    map?.off('mousemove', 'mq-regions-fill', moveHandler)
    map?.off('mouseleave', 'mq-regions-fill', leaveHandler)
    map?.off('mousemove', 'mq-labels-dot', labelMoveHandler)
    map?.off('mouseleave', 'mq-labels-dot', labelLeaveHandler)
    map?.off('dblclick', 'mq-labels-dot', labelDblClickHandler)
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
  // ensure map renders once data is loaded: if map ready render now, otherwise wait for next style load
  if (map) {
    try {
      if (map.isStyleLoaded && map.isStyleLoaded()) {
        const toRender = (filteredRegions.value && filteredRegions.value.length) ? filteredRegions.value : regions.value
        renderRegions(toRender as MingQingRegionFeature[])
      } else {
        map.once && map.once('style.load', () => {
          const toRender = (filteredRegions.value && filteredRegions.value.length) ? filteredRegions.value : regions.value
          try { renderRegions(toRender as MingQingRegionFeature[]) } catch (e) {}
        })
      }
    } catch (e) {}
  }
}

function normalizeRegionFeature(feature: any, idx: number): MingQingRegionFeature | null {
  if (!feature || !feature.geometry) return null
  const raw = feature.properties || {}
  // support multiple possible DBF field names (english and chinese)
  const nameKeys = ['name', 'Name', 'NAME', 'name_zh', 'name_zh_cn', '名称', '城名', '名']
  const beginKeys = ['begin_yr', 'begin', 'Begin_yr', 'beginYear', 'start', 'start_year', '年代始', '始年', '起始年']
  const endKeys = ['end_yr', 'end', 'End_yr', 'endYear', 'stop', 'end_year', '年代止', '止年', '结束年']
  const accuracyKeys = ['accuracy', 'Accuracy', 'ACC', '准确度', '置信度']

  function firstOf(keys: string[]) {
    for (const k of keys) {
      if (raw[k] !== undefined && raw[k] !== null && String(raw[k]).trim() !== '') return raw[k]
    }
    return undefined
  }

  const beginYear = parseYear(firstOf(beginKeys))
  const endYear = parseYear(firstOf(endKeys))
  const accuracy = parseAccuracy(firstOf(accuracyKeys))

  const normalized: MingQingRegionFeature = {
    type: 'Feature',
    id: idx,
    geometry: feature.geometry,
    properties: {
      uid: idx,
      name: String(firstOf(nameKeys) ?? `未命名城池 ${idx + 1}`),
      otherName: raw.other_name ?? raw.otherName ?? raw.alias ?? raw['别名'] ?? undefined,
      beginYear,
      endYear,
      references: raw.references ?? raw.reference ?? raw.source ?? raw['参考文献'] ?? undefined,
      landmark: raw.landmark ?? raw.landmarks ?? raw['地标'] ?? undefined,
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
  return match ? match.title : '未明'
}

function filterRegionsByYear(year: number) {
  const filtered = regions.value.filter((region) => {
    const beg = typeof region.properties.beginYear === 'number' ? region.properties.beginYear : -Infinity
    const end = typeof region.properties.endYear === 'number' ? region.properties.endYear : Infinity
    if (!(beg <= year && end >= year)) return false
    const accuracy = typeof region.properties.accuracy === 'number' ? region.properties.accuracy : 4
    return accuracyFilters[accuracy] !== false
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
    if (latestRegionGeoJSON) {
      const toRender = (filteredRegions.value && filteredRegions.value.length) ? filteredRegions.value : latestRegionGeoJSON.features
      renderRegions(toRender as MingQingRegionFeature[])
    }
  })
}

function applyMapProjection(mode: MapMode) {
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
    map.setProjection('globe')
    disableTerrain()
    // 设置星空背景
    map.setFog(fogConfig)
    // 移除可能存在的 sky 层
    removeSkyLayer()
    return
  }

  map.setProjection('mercator')
  // 在 Mercator 模式下也设置 Fog
  map.setFog(fogConfig)
  // 添加 Sky layer
  ensureSkyLayer()

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
      'sky-atmosphere-sun-intensity': 15,
      'sky-atmosphere-color': '#242B4B',
      'sky-atmosphere-halo-color': '#161B33',
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

// 键盘控制状态
const keysPressed = reactive({ 
  w: false, a: false, s: false, d: false,
  q: false, e: false,
  arrowup: false, arrowdown: false, arrowleft: false, arrowright: false
})
let animationFrameId: number | null = null

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
    // Q: 下降 (Zoom In), E: 上升 (Zoom Out)
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
    const change = (arrowright ? 1 : 0) - (arrowleft ? 1 : 0)
    map.setBearing(currentBearing + change * rotateSpeed)
  }

  // 上下键控制 Pitch (俯仰角)
  if (arrowup || arrowdown) {
    const currentPitch = map.getPitch()
    const deltaP = (arrowup ? 1 : 0) - (arrowdown ? 1 : 0)
    // 限制 Pitch 范围，防止翻转
    const newPitch = Math.max(0, Math.min(85, currentPitch + deltaP * pitchSpeed))
    map.setPitch(newPitch)
  }

  animationFrameId = requestAnimationFrame(loopCameraMovement)
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
    if (latestRegionGeoJSON) {
      const toRender = (filteredRegions.value && filteredRegions.value.length) ? filteredRegions.value : latestRegionGeoJSON.features
      renderRegions(toRender as MingQingRegionFeature[])
    }
  })

  map.on('styledata', () => {
    setChineseLabels()
    // ensure labels/regions are re-rendered when style assets update
    if (latestRegionGeoJSON) {
      const toRender = (filteredRegions.value && filteredRegions.value.length) ? filteredRegions.value : (latestRegionGeoJSON.features as MingQingRegionFeature[])
      // use a short timeout to allow style layers to settle
      setTimeout(() => {
        try { renderRegions(toRender as MingQingRegionFeature[]) } catch (e) {}
      }, 60)
    }
  })
  map.on('style.load', () => {
    setChineseLabels()
    if (latestRegionGeoJSON) {
      const toRender = (filteredRegions.value && filteredRegions.value.length) ? filteredRegions.value : (latestRegionGeoJSON.features as MingQingRegionFeature[])
      setTimeout(() => {
        try { renderRegions(toRender as MingQingRegionFeature[]) } catch (e) {}
      }, 60)
    }
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

  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
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
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
})

function onAccuracyToggle(level: number, event: Event) {
  const target = event.target as HTMLInputElement | null
  accuracyFilters[level] = Boolean(target?.checked)
}

function onAccuracySelectAll(event: Event) {
  const target = event.target as HTMLInputElement | null
  allAccuracySelected.value = Boolean(target?.checked)
}
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
  color: #fff;
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

.legend-select-all {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
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

.hover-panel.compact {
  width: 300px; /* narrower */
  padding: 12px;
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(8,12,18,0.92), rgba(6,9,16,0.86));
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
  border: 1px solid rgba(255,255,255,0.06);
  box-shadow: 0 6px 18px rgba(2,6,12,0.5);
  background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.08));
}

.icon-core {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06);
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
  color: rgba(255,255,255,0.72);
  max-width: 170px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta { margin-left: auto }
.badge.small { padding: 6px 8px; font-size: 12px; border-radius: 999px; color: #06101d; font-weight: 700 }

.hover-body { margin-top: 10px; display: flex; flex-direction: column; gap: 8px }
.row { display:flex; justify-content:space-between; gap:12px; align-items:flex-start }
.label { color: rgba(255,255,255,0.62); font-size: 12px }
.value { color: rgba(255,255,255,0.92); font-size: 13px; text-align: right; max-width: 180px; overflow: hidden; text-overflow: ellipsis }


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

.gesture-controls {
  position: absolute;
  bottom: 140px;
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
</style>
