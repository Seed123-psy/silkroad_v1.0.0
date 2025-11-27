<template>
  <div ref="containerRef" class="globe-3d-container">
    <!-- 加载动画 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <p class="loading-text">加载中...</p>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import gsap from 'gsap'
import type { City, Route } from '@/types/city'
import { createStarField, createCityMarker, createRoute } from '@/utils/threeHelpers'

/**
 * Globe3D 组件属性
 */
interface Globe3DProps {
  cities?: City[]
  routes?: Route[]
  selectedPeriod?: string
  autoRotate?: boolean
}

/**
 * Globe3D 组件事件
 */
interface Globe3DEmits {
  (e: 'city-hover', city: City | null): void
  (e: 'city-click', city: City): void
  (e: 'city-dblclick', city: City): void
}

const props = withDefaults(defineProps<Globe3DProps>(), {
  cities: () => [],
  routes: () => [],
  selectedPeriod: undefined,
  autoRotate: false,
})

const emit = defineEmits<Globe3DEmits>()

// 组件引用
const containerRef = ref<HTMLDivElement | null>(null)

// Three.js 核心对象
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let globe: THREE.Mesh
let starField: THREE.Points
let animationFrameId: number
let controls: OrbitControls

// 城市标注
const cityMarkers: THREE.Group[] = []

// 贸易路线
const routeMeshes: THREE.Mesh[] = []

// 地球参数
const GLOBE_RADIUS = 5
const GLOBE_SEGMENTS = 64

// 射线检测器
let raycaster: THREE.Raycaster
const mouse = new THREE.Vector2()

// 当前悬停的城市
let hoveredCity: City | null = null

// 相机动画控制
let cameraAnimation: gsap.core.Tween | null = null
let isAutoRotating = false
let isCameraLocked = false // 相机是否锁定在某个城市

const isLoading = ref(true)

// 性能优化相关
const MAX_VISIBLE_LABELS = 30 // 最大可见标签数量
let needsRender = true // 是否需要重新渲染
const lastCameraPosition = new THREE.Vector3()
const lastCameraQuaternion = new THREE.Quaternion()
const CAMERA_MOVE_THRESHOLD = 0.001 // 相机移动阈值

/**
 * 初始化 Three.js 场景
 */
function initScene() {
  if (!containerRef.value) return

  // 创建场景
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x000000)

  // 创建相机
  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)

  // 设置相机初始位置，使其面向中国（东经105度）
  // 将相机放在地球的侧面，而不是正前方
  const initialLongitude = 105 // 中国中心经度
  const angle = initialLongitude * (Math.PI / 180)
  const distance = 15
  camera.position.set(distance * Math.sin(angle), 0, distance * Math.cos(angle))
  camera.lookAt(0, 0, 0)

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  containerRef.value.appendChild(renderer.domElement)

  // 初始化射线检测器
  raycaster = new THREE.Raycaster()

  // 初始化 OrbitControls
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true // 启用阻尼（惯性）
  controls.dampingFactor = 0.05 // 阻尼系数
  controls.minDistance = 8 // 最小缩放距离
  controls.maxDistance = 30 // 最大缩放距离
  controls.enablePan = false // 禁用平移
  controls.rotateSpeed = 0.5 // 旋转速度
  controls.zoomSpeed = 0.8 // 缩放速度

  // 设置初始自动旋转状态
  isAutoRotating = props.autoRotate
  controls.autoRotate = isAutoRotating
  controls.autoRotateSpeed = 0.5 // 自动旋转速度
}

/**
 * 创建地球
 */
function createGlobe() {
  // 创建地球几何体
  const geometry = new THREE.SphereGeometry(GLOBE_RADIUS, GLOBE_SEGMENTS, GLOBE_SEGMENTS)

  // 使用 TextureLoader 异步加载纹理，只有在纹理准备好后再创建并添加地球网格，避免在未加载完成时显示蓝色占位
  const textureLoader = new THREE.TextureLoader()

  const applyTextureAndCreateGlobe = (texture?: THREE.Texture) => {
    // 创建材质（如果有纹理则使用纹理，否则使用中性灰）
    const material = new THREE.MeshPhongMaterial({
      color: texture ? 0xffffff : 0x666666,
      shininess: 10,
      specular: new THREE.Color(0x333333),
      map: texture || null,
    })

    if (texture) {
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy()
      texture.generateMipmaps = true
      texture.minFilter = THREE.LinearMipMapLinearFilter
    }

    // 创建并添加地球网格
    globe = new THREE.Mesh(geometry, material)
    globe.visible = true
    scene.add(globe)

    // 隐藏加载动画（延迟少许以确保一帧渲染）
    setTimeout(() => {
      isLoading.value = false
      markNeedsRender()
    }, 200)
  }

  // 开始加载主纹理
  textureLoader.load(
    '/textures/earth.jpg',
    texture => {
      console.log('地球纹理加载成功，应用到材质')
      applyTextureAndCreateGlobe(texture)
    },
    progress => {
      if (progress && progress.total && progress.total > 0) {
        const percent = ((progress.loaded / progress.total) * 100).toFixed(2)
        console.log('纹理加载进度:', percent + '%')
      }
    },
    error => {
      console.error('地球纹理加载失败:', error)
      // 尝试备用纹理
      textureLoader.load(
        '/textures/earth-day.jpg',
        texture => {
          console.log('备用纹理加载成功，应用到材质')
          applyTextureAndCreateGlobe(texture)
        },
        undefined,
        () => {
          console.error('备用纹理也加载失败，创建无纹理的地球')
          // 即使纹理加载失败，也创建一个中性材质的地球，随后隐藏加载动画
          applyTextureAndCreateGlobe(undefined)
        }
      )
    }
  )
}

/**
 * 添加光照
 */
function addLights() {
  // 环境光 - 提供基础照明
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  // 方向光 - 模拟太阳光
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(5, 3, 5)
  scene.add(directionalLight)
}

/**
 * 创建星空背景
 */
function createStarBackground() {
  // 创建星空（10000颗星星，半径100）
  starField = createStarField(10000, 100)
  scene.add(starField)
}

/**
 * 创建城市标注系统
 */
function createCityMarkers() {
  console.log('createCityMarkers 被调用, cities数量:', props.cities.length)

  // 清除现有标注
  cityMarkers.forEach(marker => {
    // 从父对象（地球或场景）中移除
    if (marker.parent) {
      marker.parent.remove(marker)
    }
    // 清理几何体和材质
    marker.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (child.material instanceof THREE.Material) {
          child.material.dispose()
        }
      }
    })
  })
  cityMarkers.length = 0

  // 根据选中的时期筛选城市
  let citiesToDisplay = props.cities
  if (props.selectedPeriod) {
    citiesToDisplay = props.cities.filter(city => city.period.includes(props.selectedPeriod!))
  }

  console.log('要显示的城市数量:', citiesToDisplay.length)

  // 为每个城市创建标注
  citiesToDisplay.forEach((city, index) => {
    try {
      const marker = createCityMarker(city, GLOBE_RADIUS)
      cityMarkers.push(marker)
      // 将标注添加到地球上，这样它们会跟着地球一起旋转
      if (globe) {
        globe.add(marker)
      } else {
        scene.add(marker)
      }
      if (index < 3) {
        console.log(`城市 ${city.name} 标注已创建，位置:`, marker.position)
      }
    } catch (error) {
      console.error(`创建城市 ${city.name} 标注失败:`, error)
    }
  })

  console.log('城市标注创建完成，总数:', cityMarkers.length)
}

/**
 * 创建贸易路线系统
 */
function createTradeRoutes() {
  console.log('createTradeRoutes 被调用, routes数量:', props.routes.length)

  // 清除现有路线
  routeMeshes.forEach(routeMesh => {
    // 从父对象（地球或场景）中移除
    if (routeMesh.parent) {
      routeMesh.parent.remove(routeMesh)
    }
    // 清理几何体和材质
    routeMesh.geometry.dispose()
    if (routeMesh.material instanceof THREE.Material) {
      routeMesh.material.dispose()
    }
  })
  routeMeshes.length = 0

  // 根据选中的时期筛选路线
  let routesToDisplay = props.routes
  if (props.selectedPeriod) {
    routesToDisplay = props.routes.filter(route => route.period.includes(props.selectedPeriod!))
  }

  console.log('要显示的路线数量:', routesToDisplay.length)

  // 为每个路线创建网格
  routesToDisplay.forEach(route => {
    try {
      const routeMesh = createRoute(route, GLOBE_RADIUS)

      // 计算包围球以支持视锥体剔除
      routeMesh.geometry.computeBoundingSphere()

      routeMeshes.push(routeMesh)
      // 将路线添加到地球上，这样它们会跟着地球一起旋转
      if (globe) {
        globe.add(routeMesh)
      } else {
        scene.add(routeMesh)
      }
      console.log(`路线 ${route.name} 已创建，类型: ${route.type}`)
    } catch (error) {
      console.error(`创建路线 ${route.name} 失败:`, error)
    }
  })

  console.log('贸易路线创建完成，总数:', routeMeshes.length)
}

/**
 * 更新标签Billboard效果
 * 使标签始终面向相机
 * 同时实现LOD和可见性优化
 */
function updateBillboards() {
  // 计算每个标注到相机的距离
  const markersWithDistance = cityMarkers.map(markerGroup => {
    const distance = camera.position.distanceTo(markerGroup.getWorldPosition(new THREE.Vector3()))
    return { marker: markerGroup, distance }
  })

  // 按距离排序（近到远）
  markersWithDistance.sort((a, b) => a.distance - b.distance)

  // 只显示最近的 MAX_VISIBLE_LABELS 个标签
  markersWithDistance.forEach((item, index) => {
    const markerGroup = item.marker
    const distance = item.distance

    // 找到标签（第三个子元素）
    const label = markerGroup.children[2]
    const pointLight = markerGroup.children[1]

    if (label instanceof THREE.Mesh) {
      // 使标签始终面向相机
      label.quaternion.copy(camera.quaternion)

      // LOD: 根据距离调整标签可见性和大小
      const isVisible = index < MAX_VISIBLE_LABELS
      label.visible = isVisible

      if (isVisible) {
        // 根据距离调整标签大小（LOD）
        const minDistance = 8
        const maxDistance = 30
        const normalizedDistance = Math.max(
          0,
          Math.min(1, (distance - minDistance) / (maxDistance - minDistance))
        )

        // 距离越远，标签越小（0.5 到 1.0 的缩放范围）
        const scale = 1.0 - normalizedDistance * 0.5
        label.scale.set(scale, scale, 1)

        // 根据距离调整透明度
        if (label.material instanceof THREE.MeshBasicMaterial) {
          label.material.opacity = 1.0 - normalizedDistance * 0.3
        }
      }
    }

    // 同样处理点光源的可见性
    if (pointLight instanceof THREE.PointLight) {
      pointLight.visible = index < MAX_VISIBLE_LABELS

      // 根据距离调整光照强度
      if (pointLight.visible) {
        const baseIntensity = 1.0
        const distanceFactor = Math.max(0.3, 1.0 - (distance - 8) / 22)
        pointLight.intensity = baseIntensity * distanceFactor
      }
    }
  })
}

/**
 * 检查相机是否移动
 */
function hasCameraMoved(): boolean {
  const positionDelta = camera.position.distanceTo(lastCameraPosition)
  const quaternionDelta = camera.quaternion.angleTo(lastCameraQuaternion)

  return positionDelta > CAMERA_MOVE_THRESHOLD || quaternionDelta > CAMERA_MOVE_THRESHOLD
}

/**
 * 更新相机状态
 */
function updateCameraState() {
  lastCameraPosition.copy(camera.position)
  lastCameraQuaternion.copy(camera.quaternion)
}

/**
 * 实现视锥体剔除
 * 检查对象是否在相机视野内
 */
function updateFrustumCulling() {
  // 创建视锥体
  const frustum = new THREE.Frustum()
  const projScreenMatrix = new THREE.Matrix4()

  // 计算投影矩阵
  projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
  frustum.setFromProjectionMatrix(projScreenMatrix)

  // 检查城市标注是否在视锥体内
  cityMarkers.forEach(markerGroup => {
    const worldPosition = markerGroup.getWorldPosition(new THREE.Vector3())
    const isInFrustum = frustum.containsPoint(worldPosition)

    // 如果不在视锥体内，隐藏整个标注组
    markerGroup.visible = isInFrustum
  })

  // 检查路线是否在视锥体内
  routeMeshes.forEach(routeMesh => {
    // 使用包围球进行快速检测
    if (routeMesh.geometry.boundingSphere) {
      const boundingSphere = routeMesh.geometry.boundingSphere.clone()
      boundingSphere.applyMatrix4(routeMesh.matrixWorld)
      const isInFrustum = frustum.intersectsSphere(boundingSphere)
      routeMesh.visible = isInFrustum
    }
  })
}

/**
 * 渲染循环（优化版）
 * 只在必要时重新渲染，避免不必要的重绘
 */
function animate() {
  animationFrameId = requestAnimationFrame(animate)

  // 更新 OrbitControls（包括自动旋转）
  if (controls) {
    const controlsChanged = controls.update()
    if (controlsChanged) {
      needsRender = true
    }
  }

  // 检查相机是否移动
  const cameraMoved = hasCameraMoved()
  if (cameraMoved) {
    needsRender = true
    updateCameraState()
  }

  // 星空缓慢旋转动画（始终运行，但不触发完整渲染）
  if (starField) {
    starField.rotation.y += 0.0001
    starField.rotation.x += 0.00005
    // 星空旋转很慢，不需要每帧都重新渲染
    // 但如果其他原因需要渲染，星空也会更新
  }

  // 如果自动旋转开启，始终需要渲染
  if (isAutoRotating) {
    needsRender = true
  }

  // 如果有相机动画正在进行，始终需要渲染
  if (cameraAnimation && cameraAnimation.isActive()) {
    needsRender = true
  }

  // 只在需要时重新渲染
  if (needsRender) {
    // 实现视锥体剔除
    updateFrustumCulling()

    // 更新标签Billboard效果（包含LOD和可见性优化）
    updateBillboards()

    // 渲染场景
    renderer.render(scene, camera)

    // 重置渲染标志
    needsRender = false
  }
}

/**
 * 标记需要重新渲染
 */
function markNeedsRender() {
  needsRender = true
}

/**
 * 处理窗口大小变化
 */
function handleResize() {
  if (!containerRef.value) return

  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight

  // 更新相机
  camera.aspect = width / height
  camera.updateProjectionMatrix()

  // 更新渲染器
  renderer.setSize(width, height)

  // 标记需要重新渲染
  markNeedsRender()
}

/**
 * 更新鼠标位置（归一化设备坐标）
 */
function updateMousePosition(event: MouseEvent) {
  if (!containerRef.value) return

  const rect = containerRef.value.getBoundingClientRect()

  // 将鼠标位置转换为归一化设备坐标 (-1 到 +1)
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
}

/**
 * 检测鼠标与城市标注的交互
 */
function detectCityIntersection(): City | null {
  if (!raycaster || !camera || cityMarkers.length === 0) return null

  // 更新射线检测器
  raycaster.setFromCamera(mouse, camera)

  // 检测与城市标注的交互
  const intersects = raycaster.intersectObjects(cityMarkers, true)

  if (intersects.length > 0 && intersects[0]) {
    // 找到第一个相交的对象
    let intersectedObject = intersects[0].object

    // 向上遍历找到包含 userData 的 Group
    while (intersectedObject && !intersectedObject.userData.city) {
      intersectedObject = intersectedObject.parent as THREE.Object3D
      if (!intersectedObject || intersectedObject === scene) {
        return null
      }
    }

    // 返回城市数据
    if (intersectedObject && intersectedObject.userData.city) {
      return intersectedObject.userData.city as City
    }
  }

  return null
}

/**
 * 处理鼠标移动事件（悬停检测）
 */
function handleMouseMove(event: MouseEvent) {
  updateMousePosition(event)

  const city = detectCityIntersection()

  // 检查悬停状态是否改变
  if (city !== hoveredCity) {
    hoveredCity = city
    emit('city-hover', city)

    // 更新鼠标样式
    if (containerRef.value) {
      containerRef.value.style.cursor = city ? 'pointer' : 'default'
    }

    // 标记需要重新渲染（鼠标悬停可能改变视觉效果）
    markNeedsRender()
  }
}

/**
 * 处理鼠标移出事件
 */
function handleMouseLeave() {
  hoveredCity = null
  emit('city-hover', null)

  if (containerRef.value) {
    containerRef.value.style.cursor = 'default'
  }

  markNeedsRender()
}

/**
 * 处理单击事件
 */
function handleClick(event: MouseEvent) {
  updateMousePosition(event)

  const city = detectCityIntersection()

  if (city) {
    emit('city-click', city)
  } else if (isCameraLocked) {
    // 点击非城市区域时，如果相机已锁定，则解锁并重置相机
    unlockCamera()
  }
}

/**
 * 处理双击事件
 */
function handleDoubleClick(event: MouseEvent) {
  updateMousePosition(event)

  const city = detectCityIntersection()

  if (city) {
    emit('city-dblclick', city)
    // 聚焦到城市
    focusOnCity(city)
  }
}

/**
 * 使用 GSAP 实现相机聚焦到城市的动画
 */
function focusOnCity(city: City) {
  // 如果有正在进行的动画，先中断它
  if (cameraAnimation) {
    cameraAnimation.kill()
    cameraAnimation = null
  }

  // 计算城市在世界坐标系中的位置
  const phi = (90 - city.lat) * (Math.PI / 180)
  const theta = (city.lng + 180) * (Math.PI / 180)

  // 计算目标位置（城市位置）
  const targetX = -GLOBE_RADIUS * Math.sin(phi) * Math.cos(theta)
  const targetY = GLOBE_RADIUS * Math.cos(phi)
  const targetZ = GLOBE_RADIUS * Math.sin(phi) * Math.sin(theta)

  // 计算相机位置（在城市位置外侧一定距离）
  const distance = 10 // 相机距离城市的距离
  const cameraX = targetX * (distance / GLOBE_RADIUS)
  const cameraY = targetY * (distance / GLOBE_RADIUS)
  const cameraZ = targetZ * (distance / GLOBE_RADIUS)

  // 暂时禁用自动旋转
  const wasAutoRotating = controls.autoRotate
  controls.autoRotate = false

  // 使用 GSAP 动画相机位置
  cameraAnimation = gsap.to(camera.position, {
    x: cameraX,
    y: cameraY,
    z: cameraZ,
    duration: 1.5,
    ease: 'power2.inOut',
    onUpdate: () => {
      // 更新相机朝向
      camera.lookAt(targetX, targetY, targetZ)
      // 更新 OrbitControls 的目标点
      controls.target.set(targetX, targetY, targetZ)
      controls.update()
      // 标记需要重新渲染
      markNeedsRender()
    },
    onComplete: () => {
      cameraAnimation = null
      // 标记相机已锁定
      isCameraLocked = true
      // 恢复之前的自动旋转状态
      controls.autoRotate = wasAutoRotating
      console.log('相机已锁定到城市:', city.name)
      // 标记需要重新渲染
      markNeedsRender()
    },
  })
}

/**
 * 解锁相机并重置到初始位置
 */
function unlockCamera() {
  // 如果有正在进行的动画，先中断它
  if (cameraAnimation) {
    cameraAnimation.kill()
    cameraAnimation = null
  }

  console.log('解锁相机，重置到初始位置')

  // 使用 GSAP 动画相机回到初始位置
  cameraAnimation = gsap.to(camera.position, {
    x: 0,
    y: 0,
    z: 15,
    duration: 1.2,
    ease: 'power2.inOut',
    onUpdate: () => {
      // 重置相机朝向到地球中心
      camera.lookAt(0, 0, 0)
      // 重置 OrbitControls 的目标点到地球中心
      controls.target.set(0, 0, 0)
      controls.update()
      // 标记需要重新渲染
      markNeedsRender()
    },
    onComplete: () => {
      cameraAnimation = null
      // 解除锁定状态
      isCameraLocked = false
      console.log('相机已解锁')
      // 标记需要重新渲染
      markNeedsRender()
    },
  })
}

/**
 * 处理空格键切换自动旋转
 */
function handleKeyDown(event: KeyboardEvent) {
  if (event.code === 'Space') {
    event.preventDefault() // 防止页面滚动
    toggleAutoRotate()
  }
}

/**
 * 切换自动旋转模式
 */
function toggleAutoRotate() {
  isAutoRotating = !isAutoRotating
  controls.autoRotate = isAutoRotating
  console.log('自动旋转:', isAutoRotating ? '开启' : '关闭')
  // 标记需要重新渲染
  markNeedsRender()
}

/**
 * 清理资源
 */
function cleanup() {
  // 取消动画循环
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }

  // 中断相机动画
  if (cameraAnimation) {
    cameraAnimation.kill()
    cameraAnimation = null
  }

  // 清理 OrbitControls
  if (controls) {
    controls.dispose()
  }

  // 清理几何体和材质
  if (globe) {
    globe.geometry.dispose()
    if (globe.material instanceof THREE.Material) {
      globe.material.dispose()
    }
  }

  // 清理星空
  if (starField) {
    starField.geometry.dispose()
    if (starField.material instanceof THREE.Material) {
      starField.material.dispose()
    }
  }

  // 清理城市标注
  cityMarkers.forEach(marker => {
    if (marker.parent) {
      marker.parent.remove(marker)
    }
    marker.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (child.material instanceof THREE.Material) {
          child.material.dispose()
        }
      }
    })
  })
  cityMarkers.length = 0

  // 清理贸易路线
  routeMeshes.forEach(routeMesh => {
    if (routeMesh.parent) {
      routeMesh.parent.remove(routeMesh)
    }
    routeMesh.geometry.dispose()
    if (routeMesh.material instanceof THREE.Material) {
      routeMesh.material.dispose()
    }
  })
  routeMeshes.length = 0

  // 清理渲染器
  if (renderer) {
    renderer.dispose()
    if (containerRef.value && renderer.domElement.parentNode === containerRef.value) {
      containerRef.value.removeChild(renderer.domElement)
    }
  }
}

// 监听 cities 属性变化
watch(
  () => props.cities,
  () => {
    if (scene) {
      createCityMarkers()
      markNeedsRender()
    }
  },
  { deep: true }
)

// 监听 routes 属性变化
watch(
  () => props.routes,
  () => {
    if (scene) {
      createTradeRoutes()
      markNeedsRender()
    }
  },
  { deep: true }
)

// 监听 selectedPeriod 属性变化
watch(
  () => props.selectedPeriod,
  () => {
    if (scene) {
      createCityMarkers()
      createTradeRoutes()
      markNeedsRender()
    }
  }
)

// 监听 autoRotate 属性变化
watch(
  () => props.autoRotate,
  newValue => {
    // 更新自动旋转状态
    isAutoRotating = newValue
    if (controls) {
      controls.autoRotate = newValue
    }
    console.log('Auto rotate:', newValue)
    markNeedsRender()
  }
)

// 组件挂载
onMounted(() => {
  initScene()
  createStarBackground()
  createGlobe()
  addLights()
  createCityMarkers()
  createTradeRoutes()

  // 初始化相机状态跟踪
  updateCameraState()

  // 标记需要初始渲染
  markNeedsRender()

  animate()

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)

  // 监听键盘事件（空格键切换自动旋转）
  window.addEventListener('keydown', handleKeyDown)

  // 监听鼠标事件
  if (containerRef.value) {
    containerRef.value.addEventListener('mousemove', handleMouseMove)
    containerRef.value.addEventListener('click', handleClick)
    containerRef.value.addEventListener('dblclick', handleDoubleClick)
    containerRef.value.addEventListener('mouseleave', handleMouseLeave)
  }
})

/**
 * 处理手势旋转
 * @param deltaX 水平移动距离
 * @param deltaY 垂直移动距离
 */
function handleGestureRotate(deltaX: number, deltaY: number) {
  if (!controls || !camera) return

  const speed = 5 // 旋转速度系数
  
  // 获取当前相机相对于目标的偏移
  const offset = new THREE.Vector3()
  offset.copy(camera.position).sub(controls.target)
  
  // 转换为球坐标
  const radius = offset.length()
  let theta = Math.atan2(offset.x, offset.z)
  let phi = Math.acos(Math.max(-1, Math.min(1, offset.y / radius)))
  
  // 应用旋转
  theta -= deltaX * speed
  phi -= deltaY * speed
  
  // 限制垂直角度，防止万向节死锁
  phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi))
  
  // 转回笛卡尔坐标
  offset.x = radius * Math.sin(phi) * Math.sin(theta)
  offset.y = radius * Math.cos(phi)
  offset.z = radius * Math.sin(phi) * Math.cos(theta)
  
  // 更新相机位置
  camera.position.copy(controls.target).add(offset)
  camera.lookAt(controls.target)
  
  // 更新控制器状态
  controls.update()
  markNeedsRender()
}

/**
 * 处理手势缩放
 * @param factor 缩放因子 (>1 放大/拉近, <1 缩小/拉远)
 */
function handleGestureZoom(factor: number) {
  if (!controls || !camera) return
  
  const offset = new THREE.Vector3()
  offset.copy(camera.position).sub(controls.target)
  const currentDistance = offset.length()
  
  // 计算新距离 (注意：放大意味着距离变小，所以除以 factor)
  let newDistance = currentDistance / factor
  
  // 限制缩放范围
  newDistance = Math.max(controls.minDistance, Math.min(controls.maxDistance, newDistance))
  
  // 应用新距离
  offset.setLength(newDistance)
  camera.position.copy(controls.target).add(offset)
  
  controls.update()
  markNeedsRender()
}

// 暴露方法给父组件
defineExpose({
  handleGestureRotate,
  handleGestureZoom
})

// 组件卸载
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', handleKeyDown)

  // 移除鼠标事件监听
  if (containerRef.value) {
    containerRef.value.removeEventListener('mousemove', handleMouseMove)
    containerRef.value.removeEventListener('click', handleClick)
    containerRef.value.removeEventListener('dblclick', handleDoubleClick)
    containerRef.value.removeEventListener('mouseleave', handleMouseLeave)
  }

  cleanup()
})
</script>

<style scoped lang="scss">
.globe-3d-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-in;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.spinner-ring {
  width: 80px;
  height: 80px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #4a9eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  position: absolute;
}

.spinner-ring:nth-child(2) {
  width: 60px;
  height: 60px;
  border-top-color: #66b3ff;
  animation-duration: 0.8s;
  animation-direction: reverse;
}

.spinner-ring:nth-child(3) {
  width: 40px;
  height: 40px;
  border-top-color: #99ccff;
  animation-duration: 0.6s;
}

.loading-text {
  margin-top: 100px;
  color: #ffffff;
  font-size: 16px;
  font-weight: 300;
  letter-spacing: 2px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
