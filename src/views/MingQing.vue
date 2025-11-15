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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import MapControls from '@/components/MapControls.vue'

const mapContainer = ref<HTMLDivElement | null>(null)
let map: any = null

const MAP_MODES = [
  { id: 'flat', name: '平面' },
  { id: 'globe', name: '球形' },
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

const selectedMode = ref<string>('flat')
const selectedStyle = ref<string>(MAP_STYLES[0]?.id ?? '')

const sampleCities = ref([
  { id: 1, name: '南京', note: '明朝一度为都城', coord: [118.7969, 32.0603] },
  { id: 2, name: '北京', note: '清朝都城', coord: [116.4074, 39.9042] },
  { id: 3, name: '苏州', note: '江南重要城市', coord: [120.5853, 31.2989] },
])

// sampleCities 用于地图上的示例点；无额外加载逻辑

function applyMapStyle(styleId: string) {
  if (!map) return
  map.setStyle(styleId)
  map.once('style.load', () => {
    try { setChineseLabels() } catch (e) {}
  })
}

function applyMapProjection(mode: string) {
  if (!map) return
  try {
    if (mode === 'globe') {
      map.setProjection && map.setProjection('globe')
    } else {
      map.setProjection && map.setProjection('mercator')
    }
  } catch (e) {
    // ignore if not supported
  }
}

onMounted(() => {
  mapboxgl.accessToken = (import.meta.env.VITE_MAPBOX_TOKEN as string) || ''
  if (!mapContainer.value) return

  map = new mapboxgl.Map({
    container: mapContainer.value,
    style: selectedStyle.value,
    center: [116, 34],
    zoom: 4,
    projection: selectedMode.value === 'globe' ? 'globe' : 'mercator',
  })

  map.addControl(new mapboxgl.NavigationControl(), 'bottom-right')

  map.on('load', () => {
    // add sample cities source & layer
    const features = sampleCities.value.map((c: any) => ({
      type: 'Feature',
      properties: { name: c.name },
      geometry: { type: 'Point', coordinates: c.coord },
    }))

    if (!map.getSource('cities')) {
      map.addSource('cities', { type: 'geojson', data: { type: 'FeatureCollection', features } })
    }

    if (!map.getLayer('cities-layer')) {
      map.addLayer({
        id: 'cities-layer',
        type: 'circle',
        source: 'cities',
        paint: {
          'circle-radius': 6,
          'circle-color': '#e67e22',
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff',
        },
      })
    }
    // ensure Chinese labels after style has loaded
    try { setChineseLabels() } catch (e) {}
  })

  // react to style and projection changes
  watch(selectedStyle, (s) => applyMapStyle(s))
  watch(selectedMode, (m) => applyMapProjection(m))

  // attempt to set Chinese labels on styledata/style.load like Transport.vue
  map.on('styledata', () => {
    try { setChineseLabels() } catch (e) {}
  })
  map.on('style.load', () => {
    try { setChineseLabels() } catch (e) {}
  })
})

onUnmounted(() => {
  if (map) {
    try { map.remove() } catch (e) {}
    map = null
  }
})

// 把 Transport.vue 中用于替换 label 字段以显示中文的逻辑复制到此处
function setChineseLabels() {
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
        } catch (innerErr) {
          // ignore layers that cannot be modified
        }
      }
    })
  } catch (e) {
    // ignore
  }
}
</script>

<style scoped lang="scss">
.mingqing-page {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.page-title {
  margin: 0;
  font-size: 24px;
}

.page-subtitle {
  margin: 6px 0 0 0;
  color: rgba(234, 246, 251, 0.78);
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hero {
  display: flex;
  gap: 16px;
}

.map-container {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}

/* 拷贝自 Transport.vue 的选择器样式，置于左上角 */
/* MapControls.vue 提供统一的选择器样式，不在此文件重复定义 */

.image-placeholder {
  flex: 1;
  min-height: 260px;
  background: linear-gradient(135deg, #0b1724, #071022);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9fb8d6;
  border: 1px dashed rgba(255, 255, 255, 0.06);
}

.info {
  width: 360px;
  background: rgba(255, 255, 255, 0.03);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.cards {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.card {
  flex: 1 1 220px;
  background: rgba(255, 255, 255, 0.04);
  padding: 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

button {
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  border: none;
  cursor: pointer;
}

button:active {
  transform: translateY(1px);
}
</style>
