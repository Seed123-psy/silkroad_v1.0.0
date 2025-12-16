<template>
  <div 
    v-if="store.isCameraOpen && store.isHandDetected"
    class="gesture-cursor"
    :class="{ 'is-clicking': store.isClicking }"
    :style="{ 
      left: `${store.cursorX}px`, 
      top: `${store.cursorY}px` 
    }"
  >
    <div class="cursor-ring"></div>
    <div class="cursor-dot"></div>
  </div>
  
  <!-- 摄像头视图 (右下角) -->
  <div v-if="store.isCameraOpen" class="gesture-camera-view">
    <video ref="cameraVideo" autoplay playsinline muted></video>
    <canvas ref="skeletonCanvas" class="skeleton-canvas"></canvas>
    <div class="status-overlay">
      <div class="status-text">{{ store.gestureStatus }}</div>
      <div class="status-hint">
        <span v-if="store.isZooming">👐 双手缩放</span>
        <span v-else-if="store.isClicking">👌 捏合拖拽</span>
        <span v-else>☝️ 食指移动</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, ref, onMounted } from 'vue'
import { useGestureStore } from '@/stores/gesture'

const store = useGestureStore()
const cameraVideo = ref<HTMLVideoElement | null>(null)
const skeletonCanvas = ref<HTMLCanvasElement | null>(null)

// 模拟鼠标事件状态
let isMouseDown = false

// 监听光标位置变化 -> 模拟 mousemove
watch([() => store.cursorX, () => store.cursorY], ([x, y]) => {
  if (!store.isHandDetected) return
  
  const target = document.elementFromPoint(x, y)
  if (target) {
    const event = new MouseEvent('mousemove', {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      buttons: isMouseDown ? 1 : 0
    })
    target.dispatchEvent(event)
  }
})

// 监听点击状态 -> 模拟 mousedown / mouseup / click
watch(() => store.isClicking, (clicking) => {
  const target = document.elementFromPoint(store.cursorX, store.cursorY) as HTMLElement
  if (!target) return

  if (clicking) {
    // 按下
    isMouseDown = true
    const downEvent = new MouseEvent('mousedown', {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: store.cursorX,
      clientY: store.cursorY,
      buttons: 1
    })
    target.dispatchEvent(downEvent)
    target.focus()
  } else {
    // 抬起
    if (isMouseDown) {
      isMouseDown = false
      const upEvent = new MouseEvent('mouseup', {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: store.cursorX,
        clientY: store.cursorY,
        buttons: 0
      })
      target.dispatchEvent(upEvent)
      
      // 触发点击
      target.click()
    }
  }
})

// 监听缩放状态变化，重置基准值
// NOTE: we don't need to track a separate lastZoomFactor here — zoomAction drives zoom events

// 监听缩放动作 -> 持续触发 wheel
let zoomInterval: number | null = null

watch(() => store.zoomAction, (action) => {
  if (zoomInterval) {
     cancelAnimationFrame(zoomInterval)
     zoomInterval = null
  }
  
  if (action === 'none') return
  
  const performZoom = () => {
      const target = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2)
      if (target) {
          // in: 放大 (滚轮向上, deltaY < 0)
          // out: 缩小 (滚轮向下, deltaY > 0)
          // 降低速度: 20 -> 8
          const deltaY = action === 'in' ? -8 : 8 
          
          const wheelEvent = new WheelEvent('wheel', {
            view: window,
            bubbles: true,
            cancelable: true,
            deltaY: deltaY, 
            clientX: window.innerWidth / 2,
            clientY: window.innerHeight / 2
          })
          target.dispatchEvent(wheelEvent)
      }
      if (store.zoomAction === action) {
          zoomInterval = requestAnimationFrame(performZoom)
      }
  }
  
  performZoom()
})

// 绘制骨架
const drawSkeleton = () => {
  const canvas = skeletonCanvas.value
  const video = cameraVideo.value
  if (!canvas || !video) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 匹配视频尺寸
  if (video.videoWidth && canvas.width !== video.videoWidth) {
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // 镜像翻转绘制
  ctx.save()
  ctx.scale(-1, 1)
  ctx.translate(-canvas.width, 0)

  if (store.landmarks) {
    for (const landmarks of store.landmarks) {
      drawConnectors(ctx, landmarks, canvas.width, canvas.height)
      drawLandmarks(ctx, landmarks, canvas.width, canvas.height)
    }
  }
  
  ctx.restore()
}

// 辅助绘制函数
const drawLandmarks = (ctx: CanvasRenderingContext2D, landmarks: any[], w: number, h: number) => {
  for (const point of landmarks) {
    ctx.beginPath()
    ctx.arc(point.x * w, point.y * h, 3, 0, 2 * Math.PI)
    ctx.fillStyle = '#00FF00'
    ctx.fill()
    ctx.lineWidth = 1
    ctx.strokeStyle = '#FFFFFF'
    ctx.stroke()
  }
}

const drawConnectors = (ctx: CanvasRenderingContext2D, landmarks: any[], w: number, h: number) => {
  // 运行时守护：确保传入的是数组
  if (!landmarks || !landmarks.length) return

  const connections: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 4], // 拇指
    [0, 5], [5, 6], [6, 7], [7, 8], // 食指
    [5, 9], [9, 10], [10, 11], [11, 12], // 中指
    [9, 13], [13, 14], [14, 15], [15, 16], // 无名指
    [13, 17], [0, 17], [17, 18], [18, 19], [19, 20] // 小指
  ]

  ctx.lineWidth = 2
  ctx.strokeStyle = '#00FF00'

  for (const [start, end] of connections) {
    const p1 = landmarks[start]
    const p2 = landmarks[end]
    if (p1 && p2) {
      ctx.beginPath()
      ctx.moveTo(p1.x * w, p1.y * h)
      ctx.lineTo(p2.x * w, p2.y * h)
      ctx.stroke()
    }
  }
}

// 监听 landmarks 变化进行绘制
watch(() => store.landmarks, () => {
  requestAnimationFrame(drawSkeleton)
})

// 监听视频流变化
watch(() => store.videoStream, (stream) => {
  if (cameraVideo.value && stream) {
    cameraVideo.value.srcObject = stream
  }
})

// 确保组件挂载时也能获取流
onMounted(() => {
  if (store.videoStream && cameraVideo.value) {
    cameraVideo.value.srcObject = store.videoStream
  }
})
</script>

<style scoped lang="scss">
.gesture-cursor {
  position: fixed;
  z-index: 9999;
  pointer-events: none; /* 关键：让事件穿透光标 */
  transform: translate(-50%, -50%);
  transition: transform 0.05s linear; /* 稍微平滑一点的移动 */
  
  .cursor-ring {
    width: 40px;
    height: 40px;
    border: 2px solid rgba(255, 215, 0, 0.8); /* 金色 */
    border-radius: 50%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    transition: all 0.2s;
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
  }
  
  .cursor-dot {
    width: 8px;
    height: 8px;
    background-color: #FFD700;
    border-radius: 50%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  
  &.is-clicking {
    .cursor-ring {
      width: 20px;
      height: 20px;
      background-color: rgba(255, 215, 0, 0.5);
      border-color: #FFD700;
    }
  }
}

.gesture-camera-view {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 240px;
  height: 180px;
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid rgba(255, 215, 0, 0.3);
  z-index: 9998;
  border-radius: 12px;
  overflow: hidden;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  transition: all 0.3s ease;
  
  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scaleX(-1); /* 镜像 */
  }
  
  .skeleton-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  
  .status-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0));
    padding: 8px;
    color: white;
    text-align: center;
  }
  
  .status-text {
    font-size: 14px;
    font-weight: bold;
    color: #FFD700;
    margin-bottom: 4px;
  }
  
  .status-hint {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.8);
    display: flex;
    justify-content: center;
    gap: 8px;
  }
}
</style>
