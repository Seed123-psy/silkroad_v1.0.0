<template>
  <div class="home">
    <Globe3D
      ref="globeRef"
      :cities="cities"
      :routes="routes"
      :auto-rotate="autoRotate"
      class="globe-container"
      @city-hover="handleCityHover"
    />
    <CityInfoPanel :city="hoveredCity" @close="handleClosePanel" />

    <!-- 手势控制 UI -->
    <div class="gesture-controls">
      <button class="gesture-btn" @click="toggleCamera" :class="{ active: isCameraOpen }">
        <span class="icon">📷</span>
        {{ isCameraOpen ? '关闭手势控制' : '开启手势控制' }}
      </button>
      
      <div v-show="isCameraOpen" class="camera-wrapper">
        <video ref="videoRef" class="input_video" autoplay playsinline></video>
        <canvas ref="canvasRef" class="output_canvas"></canvas>
        <div class="gesture-status">
          <p>状态: {{ gestureStatus }}</p>
          <p class="hint">单手捏合: 旋转地球 | 双手开合: 缩放地球</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Globe3D from '@/components/Globe3D.vue'
import CityInfoPanel from '@/components/CityInfoPanel.vue'
import { dataService } from '@/services/dataService'
import type { City, Route } from '@/types'
import { useGestureControl } from '@/composables/useGestureControl'

const cities = ref<City[]>([])
const routes = ref<Route[]>([])
const hoveredCity = ref<City | null>(null)
const globeRef = ref<any>(null)
const autoRotate = ref(true)
let hoverResetTimer: number | null = null

// --- 手势控制逻辑 ---
const { 
  isCameraOpen, 
  videoRef, 
  canvasRef, 
  gestureStatus, 
  toggleCamera, 
  setCallbacks 
} = useGestureControl()

// 设置手势回调
setCallbacks(
  (deltaX, deltaY) => {
    if (globeRef.value) {
      globeRef.value.handleGestureRotate(deltaX, deltaY)
    }
  },
  (zoomFactor) => {
    if (globeRef.value) {
      globeRef.value.handleGestureZoom(zoomFactor)
    }
  }
)

// 监听摄像头开关状态，控制自动旋转
import { watch } from 'vue'
watch(isCameraOpen, (isOpen) => {
  autoRotate.value = !isOpen
})

const handleCityHover = (city: City | null) => {
  if (hoverResetTimer) {
    window.clearTimeout(hoverResetTimer)
    hoverResetTimer = null
  }

  if (city) {
    hoveredCity.value = city
  } else {
    hoverResetTimer = window.setTimeout(() => {
      hoveredCity.value = null
      hoverResetTimer = null
    }, 150)
  }
}

const handleClosePanel = () => {
  console.log('关闭城市信息面板')
  if (hoverResetTimer) {
    window.clearTimeout(hoverResetTimer)
    hoverResetTimer = null
  }
  hoveredCity.value = null
}

onMounted(async () => {
  try {
    console.log('开始加载数据...')
    cities.value = await dataService.loadCities()
    console.log('城市数据加载成功:', cities.value.length, '个城市')

    routes.value = await dataService.loadRoutes()
    console.log('路线数据加载成功:', routes.value.length, '条路线')
  } catch (err) {
    console.error('Failed to load data:', err)
  }
})
</script>

<style scoped lang="scss">
.home {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.globe-container {
  width: 100%;
  height: 100%;
}

.gesture-controls {
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;

  .gesture-btn {
    background: rgba(0, 0, 0, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #fff;
    padding: 10px 20px;
    border-radius: 30px;
    cursor: pointer;
    font-family: inherit;
    backdrop-filter: blur(5px);
    transition: all 0.3s;
    display: flex;
    align-items: center;
    gap: 8px;

    &:hover {
      background: rgba(0, 0, 0, 0.8);
      transform: translateY(-2px);
    }

    &.active {
      background: rgba(74, 158, 255, 0.3);
      border-color: #4a9eff;
      color: #4a9eff;
    }
  }

  .camera-wrapper {
    position: relative;
    width: 240px;
    height: 180px;
    background: #000;
    border: 2px solid #333;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);

    .input_video {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform: scaleX(-1); /* Mirror effect */
    }

    .output_canvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      transform: scaleX(-1); /* Mirror effect */
    }

    .gesture-status {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      background: rgba(0,0,0,0.7);
      color: #fff;
      padding: 8px;
      text-align: center;
      font-size: 12px;

      p {
        margin: 0;
        &.hint {
          font-size: 10px;
          color: #aaa;
          margin-top: 2px;
        }
      }
    }
  }
}
</style>
