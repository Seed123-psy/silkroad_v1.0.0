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
import { ref, onMounted, onUnmounted } from 'vue'
import Globe3D from '@/components/Globe3D.vue'
import CityInfoPanel from '@/components/CityInfoPanel.vue'
import { dataService } from '@/services/dataService'
import type { City, Route } from '@/types'
import { FilesetResolver, HandLandmarker, type HandLandmarkerResult } from '@mediapipe/tasks-vision'

const cities = ref<City[]>([])
const routes = ref<Route[]>([])
const hoveredCity = ref<City | null>(null)
const globeRef = ref<any>(null)
const autoRotate = ref(true)
let hoverResetTimer: number | null = null

// --- 手势控制逻辑 ---
const isCameraOpen = ref(false)
const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const gestureStatus = ref('初始化中...')
let handLandmarker: HandLandmarker | undefined
let animationFrameId: number
let lastVideoTime = -1

// 手势状态追踪
let lastPinchCenter = { x: 0, y: 0 }
let isPinching = false
let lastTwoHandDist = 0

const toggleCamera = async () => {
  if (isCameraOpen.value) {
    stopCamera()
  } else {
    await startCamera()
  }
}

const startCamera = async () => {
  isCameraOpen.value = true
  autoRotate.value = false // 开启手势时关闭自动旋转
  gestureStatus.value = '加载模型...'

  try {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
    )
    
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numHands: 2
    })

    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    if (videoRef.value) {
      videoRef.value.srcObject = stream
      videoRef.value.addEventListener('loadeddata', predictWebcam)
    }
    gestureStatus.value = '准备就绪'
  } catch (error) {
    console.error(error)
    gestureStatus.value = '启动失败: ' + error
    isCameraOpen.value = false
  }
}

const stopCamera = () => {
  isCameraOpen.value = false
  autoRotate.value = true // 关闭手势时恢复自动旋转
  if (videoRef.value && videoRef.value.srcObject) {
    const stream = videoRef.value.srcObject as MediaStream
    stream.getTracks().forEach(track => track.stop())
    videoRef.value.srcObject = null
  }
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  handLandmarker = undefined
}

const predictWebcam = async () => {
  if (!handLandmarker || !videoRef.value || !canvasRef.value) return

  const video = videoRef.value
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  
  if (video.videoWidth > 0 && canvas.width !== video.videoWidth) {
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
  }

  let startTimeMs = performance.now()
  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime
    const results = handLandmarker.detectForVideo(video, startTimeMs)
    
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      drawHands(ctx, results)
    }
    
    handleGestures(results)
  }

  if (isCameraOpen.value) {
    animationFrameId = requestAnimationFrame(predictWebcam)
  }
}

const drawHands = (ctx: CanvasRenderingContext2D, results: HandLandmarkerResult) => {
  if (results.landmarks) {
    for (const landmarks of results.landmarks) {
      for (const point of landmarks) {
        ctx.beginPath()
        ctx.arc(point.x * ctx.canvas.width, point.y * ctx.canvas.height, 3, 0, 2 * Math.PI)
        ctx.fillStyle = "#00FF00"
        ctx.fill()
      }
    }
  }
}

const handleGestures = (results: HandLandmarkerResult) => {
  const landmarks = results.landmarks
  
  if (!landmarks || landmarks.length === 0) {
    gestureStatus.value = '未检测到手势'
    isPinching = false
    lastTwoHandDist = 0
    return
  }

  // 双手逻辑：缩放
  if (landmarks.length === 2 && landmarks[0] && landmarks[1]) {
    const hand1 = landmarks[0][9]
    const hand2 = landmarks[1][9]
    
    if (!hand1 || !hand2) return

    const dist = Math.hypot(hand1.x - hand2.x, hand1.y - hand2.y)
    
    if (lastTwoHandDist > 0) {
      const delta = dist - lastTwoHandDist
      if (Math.abs(delta) > 0.005) {
        const zoomFactor = 1 + delta * 2
        if (globeRef.value) {
          globeRef.value.handleGestureZoom(zoomFactor)
        }
        gestureStatus.value = delta > 0 ? '放大中' : '缩小中'
      }
    }
    lastTwoHandDist = dist
    isPinching = false
  } 
  // 单手逻辑：旋转 (捏合手势)
  else if (landmarks.length === 1 && landmarks[0]) {
    lastTwoHandDist = 0
    const hand = landmarks[0]
    const thumbTip = hand[4]
    const indexTip = hand[8]
    
    if (!thumbTip || !indexTip) return

    const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y)
    const isCurrentlyPinching = pinchDist < 0.08

    const centerX = (thumbTip.x + indexTip.x) / 2
    const centerY = (thumbTip.y + indexTip.y) / 2

    if (isCurrentlyPinching) {
      if (isPinching) {
        const deltaX = (centerX - lastPinchCenter.x)
        const deltaY = (centerY - lastPinchCenter.y)
        
        if (globeRef.value) {
          // 传递移动增量给地球组件
          globeRef.value.handleGestureRotate(deltaX, deltaY)
        }
        gestureStatus.value = '旋转地球'
      }
      isPinching = true
      lastPinchCenter = { x: centerX, y: centerY }
    } else {
      isPinching = false
      gestureStatus.value = '手掌张开 (停止旋转)'
    }
  }
}

onUnmounted(() => {
  stopCamera()
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
