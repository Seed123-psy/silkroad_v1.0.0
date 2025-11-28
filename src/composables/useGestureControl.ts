import { ref, onUnmounted } from 'vue';
import { FilesetResolver, HandLandmarker, type HandLandmarkerResult } from '@mediapipe/tasks-vision';

export function useGestureControl() {
  const isCameraOpen = ref(false);
  const videoRef = ref<HTMLVideoElement | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const gestureStatus = ref('初始化中...');
  
  let handLandmarker: HandLandmarker | undefined;
  let animationFrameId: number;
  let lastVideoTime = -1;
  
  // 状态追踪
  let lastPinchCenter = { x: 0, y: 0 };
  let isPinching = false;

  // 回调函数
  let onMoveCallback: ((dx: number, dy: number) => void) | null = null;
  let onZoomCallback: ((factor: number) => void) | null = null;

  const setCallbacks = (
    onMove: (dx: number, dy: number) => void,
    onZoom: (factor: number) => void
  ) => {
    onMoveCallback = onMove;
    onZoomCallback = onZoom;
  };

  const startCamera = async () => {
    isCameraOpen.value = true;
    gestureStatus.value = '加载模型...';

    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
      );
      
      handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 2
      });

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.value) {
        videoRef.value.srcObject = stream;
        videoRef.value.addEventListener('loadeddata', predictWebcam);
      }
      gestureStatus.value = '准备就绪';
    } catch (error) {
      console.error(error);
      gestureStatus.value = '启动失败: ' + error;
      isCameraOpen.value = false;
    }
  };

  const stopCamera = () => {
    isCameraOpen.value = false;
    if (videoRef.value && videoRef.value.srcObject) {
      const stream = videoRef.value.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.value.srcObject = null;
    }
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    handLandmarker = undefined;
  };

  const toggleCamera = async () => {
    if (isCameraOpen.value) {
      stopCamera();
    } else {
      await startCamera();
    }
  };

  const predictWebcam = async () => {
    if (!handLandmarker || !videoRef.value || !canvasRef.value) return;

    const video = videoRef.value;
    const canvas = canvasRef.value;
    const ctx = canvas.getContext('2d');
    
    if (video.videoWidth > 0 && canvas.width !== video.videoWidth) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    let startTimeMs = performance.now();
    if (lastVideoTime !== video.currentTime) {
      lastVideoTime = video.currentTime;
      const results = handLandmarker.detectForVideo(video, startTimeMs);
      
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawHands(ctx, results);
      }
      
      handleGestures(results);
    }

    if (isCameraOpen.value) {
      animationFrameId = requestAnimationFrame(predictWebcam);
    }
  };

  const drawHands = (ctx: CanvasRenderingContext2D, results: HandLandmarkerResult) => {
    if (results.landmarks) {
      for (const landmarks of results.landmarks) {
        for (const point of landmarks) {
          ctx.beginPath();
          ctx.arc(point.x * ctx.canvas.width, point.y * ctx.canvas.height, 3, 0, 2 * Math.PI);
          ctx.fillStyle = "#00FF00";
          ctx.fill();
        }
      }
    }
  };

  const isHandPinching = (landmarks: any[]) => {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    // 拇指和食指距离小于阈值，视为捏合
    return Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y) < 0.08;
  };

  const isHandOpen = (landmarks: any[]) => {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    // 拇指和食指距离大于阈值，视为张开
    return Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y) > 0.12;
  };

  const handleGestures = (results: HandLandmarkerResult) => {
    const landmarks = results.landmarks;
    
    if (!landmarks || landmarks.length === 0) {
      gestureStatus.value = '未检测到手势';
      isPinching = false;
      return;
    }

    // 双手逻辑：缩放 (基于手势状态)
    if (landmarks.length === 2 && landmarks[0] && landmarks[1]) {
      const hand1 = landmarks[0];
      const hand2 = landmarks[1];
      
      const isPinch1 = isHandPinching(hand1);
      const isPinch2 = isHandPinching(hand2);
      
      const isOpen1 = isHandOpen(hand1);
      const isOpen2 = isHandOpen(hand2);

      if (isPinch1 && isPinch2) {
        // 双手捏合 -> 持续缩小
        if (onZoomCallback) onZoomCallback(0.98); 
        gestureStatus.value = '双手捏合 (缩小)';
      } else if (isOpen1 && isOpen2) {
        // 双手张开 -> 持续放大
        if (onZoomCallback) onZoomCallback(1.02);
        gestureStatus.value = '双手张开 (放大)';
      } else {
        gestureStatus.value = '双手检测中...';
      }
      
      // 重置单手状态
      isPinching = false;
    } 
    // 单手逻辑：移动 (捏合手势)
    else if (landmarks.length === 1 && landmarks[0]) {
      const hand = landmarks[0];
      const thumbTip = hand[4];
      const indexTip = hand[8];
      
      if (!thumbTip || !indexTip) return;

      const isCurrentlyPinching = isHandPinching(hand);

      const centerX = (thumbTip.x + indexTip.x) / 2;
      const centerY = (thumbTip.y + indexTip.y) / 2;

      if (isCurrentlyPinching) {
        if (isPinching) {
          // 摄像头是镜像的，原始 x 坐标向左移动是减小。
          // 为了符合屏幕视觉（手向右移，屏幕上手向右移），我们需要反转 x 轴的变化量。
          // 这样 deltaX > 0 代表向右移动，deltaX < 0 代表向左移动。
          const deltaX = (centerX - lastPinchCenter.x) * -1;
          const deltaY = (centerY - lastPinchCenter.y);
          
          if (onMoveCallback) onMoveCallback(deltaX, deltaY);
          gestureStatus.value = '移动中';
        }
        isPinching = true;
        lastPinchCenter = { x: centerX, y: centerY };
      } else {
        isPinching = false;
        gestureStatus.value = '手掌张开 (停止移动)';
      }
    }
  };

  onUnmounted(() => {
    stopCamera();
  });

  return {
    isCameraOpen,
    videoRef,
    canvasRef,
    gestureStatus,
    toggleCamera,
    setCallbacks
  };
}
