import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useGestureStore = defineStore('gesture', () => {
  const isCameraOpen = ref(false)
  const isDebugMode = ref(false) // 是否显示摄像头画面
  
  // 光标状态
  const cursorX = ref(0)
  const cursorY = ref(0)
  const isClicking = ref(false)
  const isHandDetected = ref(false)
  const gestureStatus = ref('初始化中...')
  
  // 双手缩放状态
  const zoomFactor = ref(1.0)
  const isZooming = ref(false)
  const zoomAction = ref<'in' | 'out' | 'none'>('none')
  
  // 骨架数据
  const landmarks = ref<any[]>([])

  // 视频流引用 (用于在全局组件中显示)
  const videoStream = ref<MediaStream | null>(null)

  const toggleCamera = () => {
    isCameraOpen.value = !isCameraOpen.value
  }

  const toggleDebug = () => {
    isDebugMode.value = !isDebugMode.value
  }

  const updateCursor = (x: number, y: number, clicking: boolean, detected: boolean) => {
    cursorX.value = x
    cursorY.value = y
    isClicking.value = clicking
    isHandDetected.value = detected
  }
  
  const updateZoom = (factor: number, zooming: boolean) => {
    zoomFactor.value = factor
    isZooming.value = zooming
  }

  const setZoomAction = (action: 'in' | 'out' | 'none') => {
    zoomAction.value = action
  }
  
  const updateLandmarks = (data: any[]) => {
    landmarks.value = data
  }

  const setStatus = (status: string) => {
    gestureStatus.value = status
  }

  const setStream = (stream: MediaStream | null) => {
    videoStream.value = stream
  }

  return {
    isCameraOpen,
    isDebugMode,
    cursorX,
    cursorY,
    isClicking,
    isHandDetected,
    gestureStatus,
    zoomFactor,
    isZooming,
    zoomAction,
    landmarks,
    videoStream,
    toggleCamera,
    toggleDebug,
    updateCursor,
    updateZoom,
    setZoomAction,
    updateLandmarks,
    setStatus,
    setStream
  }
})
