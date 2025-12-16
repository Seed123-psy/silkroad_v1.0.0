import { watch, onUnmounted } from 'vue'
import { FilesetResolver, HandLandmarker, type HandLandmarkerResult } from '@mediapipe/tasks-vision'
import { useGestureStore } from '@/stores/gesture'

export function useGlobalGesture() {
  const store = useGestureStore()

  let handLandmarker: HandLandmarker | undefined
  let animationFrameId: number | null = null
  let lastVideoTime = -1

  // 平滑处理
  const smoothFactor = 0.3
  let smoothedX = 0.5 // 初始在中心
  let smoothedY = 0.5

  // 视频元素
  const videoElement = document.createElement('video')
  videoElement.autoplay = true
  videoElement.playsInline = true
  // 隐藏视频元素
  videoElement.style.display = 'none'
  document.body.appendChild(videoElement)

  const startCamera = async () => {
    store.setStatus('加载模型...')

    try {
      const vision = await FilesetResolver.forVisionTasks('/wasm')
      const modelPath = '/models/hand_landmarker.task'

      handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: modelPath,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 2, // 允许检测两只手
      })

      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      videoElement.srcObject = stream
      store.setStream(stream)
      
      videoElement.addEventListener('loadeddata', predictWebcam)
      store.setStatus('准备就绪')
    } catch (error) {
      console.error(error)
      store.setStatus('启动失败: ' + (error instanceof Error ? error.message : String(error)))
      store.isCameraOpen = false
    }
  }

  const stopCamera = () => {
    if (videoElement.srcObject) {
      const stream = videoElement.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoElement.srcObject = null
      store.setStream(null)
    }
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }
    handLandmarker = undefined
    store.updateCursor(0, 0, false, false)
  }

  const predictWebcam = async () => {
    if (!handLandmarker || !store.isCameraOpen) return

    const startTimeMs = performance.now()
    if (lastVideoTime !== videoElement.currentTime && videoElement.videoWidth > 0) {
      lastVideoTime = videoElement.currentTime
      const results = handLandmarker.detectForVideo(videoElement, startTimeMs)
      processResults(results)
    }

    animationFrameId = requestAnimationFrame(predictWebcam)
  }

  const processResults = (results: HandLandmarkerResult) => {
    const landmarks = results.landmarks
    store.updateLandmarks(landmarks) // 更新骨架数据

    if (landmarks && landmarks.length > 0) {
      // 双手检测：缩放
      if (landmarks.length === 2) {
        const hand1 = landmarks[0] as any[] | undefined
        const hand2 = landmarks[1] as any[] | undefined

        const getPinchDist = (hand?: any[]) => {
          if (!hand || hand.length <= 8) return Infinity
          const a = hand[4]
          const b = hand[8]
          return Math.hypot((a.x ?? 0) - (b.x ?? 0), (a.y ?? 0) - (b.y ?? 0))
        }

        const dist1 = getPinchDist(hand1)
        const dist2 = getPinchDist(hand2)
        
        // 阈值
        const PINCH_THRESHOLD = 0.05
        const OPEN_THRESHOLD = 0.1
        
        if (dist1 < PINCH_THRESHOLD && dist2 < PINCH_THRESHOLD) {
             store.setZoomAction('out')
             store.setStatus('双手捏合 (缩小)')
        } else if (dist1 > OPEN_THRESHOLD && dist2 > OPEN_THRESHOLD) {
             store.setZoomAction('in')
             store.setStatus('双手张开 (放大)')
        } else {
             store.setZoomAction('none')
             store.setStatus('双手检测中')
        }
        store.isZooming = true // 保持这个状态用于UI显示
        return
      } else {
        store.isZooming = false
        store.setZoomAction('none')
      }

      // 单手检测：光标移动与点击
      const hand = landmarks[0] as any[] | undefined
      const indexTip = hand?.[8]
      const thumbTip = hand?.[4]

      if (indexTip && thumbTip) {
        // 坐标转换: MediaPipe 返回 0-1 的归一化坐标
        // x 轴镜像翻转
        const rawX = 1 - indexTip.x
        const rawY = indexTip.y
        
        // 平滑处理
        smoothedX = smoothedX + (rawX - smoothedX) * smoothFactor
        smoothedY = smoothedY + (rawY - smoothedY) * smoothFactor
        
        // 映射到屏幕坐标
        const screenX = smoothedX * window.innerWidth
        const screenY = smoothedY * window.innerHeight
        
        // 检测捏合 (点击/拖拽)
        const distance = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y)
        const isClicking = distance < 0.06 
        
        store.updateCursor(screenX, screenY, isClicking, true)
        
        if (isClicking) {
            store.setStatus('捏合/拖拽中')
        } else {
            store.setStatus('移动中')
        }
      }
    } else {
      store.updateCursor(store.cursorX, store.cursorY, false, false)
      store.updateZoom(1.0, false)
      store.setZoomAction('none')
      store.setStatus('未检测到手势')
    }
  }

  // 监听 store 变化
  watch(() => store.isCameraOpen, (isOpen) => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
    }
  })

  onUnmounted(() => {
    stopCamera()
    if (videoElement.parentNode) {
      videoElement.parentNode.removeChild(videoElement)
    }
  })

  // 如果初始化时已经是开启状态
  if (store.isCameraOpen) {
    startCamera()
  }
}
