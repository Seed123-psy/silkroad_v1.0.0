<template>
  <div class="transport-view">
    <div ref="mapContainer" class="map-container" />

    <!-- 地图模式和样式切换控件 -->
    <div class="map-style-selector" v-if="MAP_STYLES && MAP_STYLES.length">
      <select v-model="selectedMode" aria-label="地图显示模式" style="margin-right:8px;">
        <option v-for="m in MAP_MODES" :key="m.id" :value="m.id">{{ m.name }}</option>
      </select>
      <select v-model="selectedStyle" aria-label="地图样式">
        <option v-for="s in MAP_STYLES" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
// 导入 Mapbox GL（需先安装 `mapbox-gl`）
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// 从环境变量读取 token（Vite 要求以 VITE_ 前缀暴露给客户端）
const MAPBOX_TOKEN = (import.meta.env.VITE_MAPBOX_TOKEN as string) || ''
if (!MAPBOX_TOKEN) {
  // eslint-disable-next-line no-console
  console.warn('VITE_MAPBOX_TOKEN 未配置，Mapbox 地图可能无法正常加载。请在 .env 中设置 VITE_MAPBOX_TOKEN。')
}

const mapContainer = ref<HTMLDivElement | null>(null)
let map: any = null

// 地图显示模式
const MAP_MODES = [
  { id: 'flat', name: '平面' },
  { id: 'globe', name: '球形' },
]
const MAP_STYLES: { id: string; name: string }[] = [
  { id: 'mapbox://styles/mapbox/streets-v11', name: '街道' },
  { id: 'mapbox://styles/mapbox/light-v10', name: '明亮' },
  { id: 'mapbox://styles/mapbox/dark-v10', name: '暗色' },
  { id: 'mapbox://styles/mapbox/satellite-v9', name: '卫星' },
]
const selectedMode = ref<string>('flat')
const selectedStyle = ref<string>(MAP_STYLES[0]?.id || 'mapbox://styles/mapbox/streets-v11')

function applyMapStyle(styleId: string) {
  if (!map) return
  map.setStyle(styleId)
  map.once('style.load', () => {
    setChineseLabels()
  })
}

function applyMapProjection(mode: string) {
  if (!map) return
  if (mode === 'globe') {
    map.setProjection('globe')
    setTimeout(() => {
      if (map.getProjection().name !== 'globe') {
        map.setProjection('globe')
      }
    }, 100)
    try {
      if (!map.getSource('mapbox-dem')) {
        map.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.terrain-rgb',
          tileSize: 512,
          maxzoom: 14
        })
      }
      map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.2 })
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('地形设置失败:', e)
    }
    // 添加星空背景层
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
    map.setProjection('mercator')
    setTimeout(() => {
      if (map.getProjection().name !== 'mercator') {
        map.setProjection('mercator')
      }
    }, 100)
    try {
      map.setTerrain(null)
    } catch (e) {}
    // 移除星空层
    if (map.getLayer && map.getLayer('sky')) {
      try { map.removeLayer('sky') } catch (e) {}
    }
  }
}

function setChineseLabels() {
  const MAP_LANG = 'zh'
  try {
    const layers = map.getStyle().layers || []
    layers.forEach((layer: any) => {
      if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
        const localized = ['coalesce', ['get', `name_${MAP_LANG}`], ['get', 'name']]
        map.setLayoutProperty(layer.id, 'text-field', localized)
      }
    })
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('设置地图中文语言失败：', e)
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
  })

  map.addControl(new mapboxgl.NavigationControl())
  map.addControl(new mapboxgl.ScaleControl({ maxWidth: 100, unit: 'metric' }))

  // 初始化时应用样式和投影
  map.on('load', () => {
    applyMapStyle(selectedStyle.value)
    applyMapProjection(selectedMode.value)
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
</script>

<style scoped>
.transport-view {
  height: 100%;
  position: relative;
}

.map-container {
  position: absolute;
  inset: 0; /* top:0; right:0; bottom:0; left:0 */
  width: 100%;
  height: 100%;
  border-radius: 0;
  overflow: hidden;
}

/* 地图样式切换控件 */
.map-style-selector {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2000;
  background: rgba(255, 255, 255, 0.9);
  color: #111;
  border-radius: 6px;
  padding: 6px 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  font-size: 13px;
}
.map-style-selector select {
  border: none;
  background: transparent;
  outline: none;
  font-size: 13px;
}
</style>
