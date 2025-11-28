/**
 * Three.js 辅助函数
 * 提供3D地球可视化所需的工具函数
 */

import * as THREE from 'three'
import type { City, Route } from '@/types'

/**
 * 文字纹理选项接口
 */
export interface TextOptions {
  fontSize?: number
  fontFamily?: string
  color?: string
  backgroundColor?: string
  padding?: number
}

/**
 * 将经纬度坐标转换为Three.js的3D向量坐标
 * @param lat 纬度 (-90 到 90)
 * @param lng 经度 (-180 到 180)
 * @param radius 球体半径
 * @returns THREE.Vector3 三维坐标
 */
export function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  // 将纬度转换为phi角（从北极到南极的角度）
  const phi = (90 - lat) * (Math.PI / 180)
  // 将经度转换为theta角（绕Y轴的角度）
  const theta = (lng + 180) * (Math.PI / 180)

  // 球坐标转笛卡尔坐标
  const x = -radius * Math.sin(phi) * Math.cos(theta)
  const y = radius * Math.cos(phi)
  const z = radius * Math.sin(phi) * Math.sin(theta)

  return new THREE.Vector3(x, y, z)
}

/**
 * 创建城市标注组
 * 包含点光源、标注点和文字标签
 * @param city 城市数据
 * @param radius 地球半径
 * @returns THREE.Group 城市标注组
 */
export function createCityMarker(city: City, radius: number): THREE.Group {
  const markerGroup = new THREE.Group()

  // 将城市数据存储在userData中，用于交互检测
  markerGroup.userData = { city }

  // 计算城市在球面上的位置
  const position = latLngToVector3(city.lat, city.lng, radius)

  // 1. 创建核心标记点（红色）
  const markerSize = 0.02 + city.importance * 0.005
  const markerGeometry = new THREE.SphereGeometry(markerSize, 16, 16)
  const markerMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000, // 红色
    transparent: false,
  })
  const marker = new THREE.Mesh(markerGeometry, markerMaterial)
  markerGroup.add(marker)

  // 2. 创建发光效果（半透明红色光晕）
  const glowSize = markerSize * 1.2
  const glowGeometry = new THREE.SphereGeometry(glowSize, 16, 16)
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 0.4,
  })
  const glow = new THREE.Mesh(glowGeometry, glowMaterial)
  markerGroup.add(glow)

  // 3. 创建文字标签（高清晰度，带描边）
  const labelTexture = createTextTexture(city.name, {
    fontSize: 64, // 提高分辨率
    fontFamily: '"Ma Shan Zheng", "Kaiti", "STKaiti", "KaiTi", "楷体", sans-serif', // 使用书法风格字体
    color: '#ffffff',
    backgroundColor: 'transparent',
    padding: 4,
  })

  // 根据纹理宽高比动态计算平面大小，避免文字变形
  const image = labelTexture.image
  const aspectRatio = image.width / image.height
  const labelHeight = 0.15 // 稍微调大一点
  const labelWidth = labelHeight * aspectRatio

  const labelGeometry = new THREE.PlaneGeometry(labelWidth, labelHeight)
  const labelMaterial = new THREE.MeshBasicMaterial({
    map: labelTexture,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    opacity: 1,
  })
  const label = new THREE.Mesh(labelGeometry, labelMaterial)

  // 标签位置在标注点上方
  label.position.set(0, 0.08, 0)

  // 标签始终面向相机（Billboard效果将在渲染循环中实现）
  label.renderOrder = 999 // 确保标签在最上层渲染
  markerGroup.add(label)

  // 设置整个组的位置
  markerGroup.position.copy(position)

  return markerGroup
}

/**
 * 创建贸易路线
 * 使用CatmullRomCurve3创建平滑曲线，TubeGeometry渲染为管道
 * @param route 路线数据
 * @param radius 地球半径
 * @returns THREE.Mesh 路线网格
 */
export function createRoute(route: Route, radius: number): THREE.Mesh {
  // 将路线点转换为3D坐标
  // 支持两种格式：points (旧格式) 或 coordinates (新格式)
  const routePoints = (route as any).coordinates || route.points
  const points: THREE.Vector3[] = routePoints.map(
    ([lat, lng]: [number, number]) => latLngToVector3(lat, lng, radius + 0.01) // 稍微高于地球表面
  )

  // 创建平滑曲线
  const curve = new THREE.CatmullRomCurve3(points)

  // 根据路线类型设置颜色和样式
  const color = route.type === 'land' ? 0xc9a063 : 0x4a90e2 // 陆路金色，海路蓝色
  const tubeRadius = 0.008 // 增加管道半径使其更明显

  // 创建管道几何体
  const tubeGeometry = new THREE.TubeGeometry(curve, 128, tubeRadius, 8, false)
  const tubeMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.8,
  })

  const routeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial)

  // 存储路线数据用于交互
  routeMesh.userData = { route }

  return routeMesh
}

/**
 * 创建星空背景
 * 使用THREE.Points和BufferGeometry创建随机分布的星星
 * @param count 星星数量
 * @param radius 星空半径（应大于地球半径）
 * @returns THREE.Points 星空点集
 */
export function createStarField(count: number = 10000, radius: number = 100): THREE.Points {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    // 在球面上随机分布星星
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(Math.random() * 2 - 1)

    const x = radius * Math.sin(phi) * Math.cos(theta)
    const y = radius * Math.sin(phi) * Math.sin(theta)
    const z = radius * Math.cos(phi)

    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z

    // 随机星星颜色（白色到淡黄色）
    const brightness = 0.8 + Math.random() * 0.2
    colors[i * 3] = brightness
    colors[i * 3 + 1] = brightness
    colors[i * 3 + 2] = brightness * (0.9 + Math.random() * 0.1)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const material = new THREE.PointsMaterial({
    size: 0.1,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true,
  })

  return new THREE.Points(geometry, material)
}

/**
 * 创建文字纹理
 * 使用Canvas绘制文字，转换为THREE.CanvasTexture
 * @param text 要显示的文字
 * @param options 文字样式选项
 * @returns THREE.CanvasTexture 文字纹理
 */
export function createTextTexture(text: string, options: TextOptions = {}): THREE.CanvasTexture {
  const {
    fontSize = 24,
    fontFamily = 'Arial, Microsoft YaHei, sans-serif',
    color = '#ffffff',
    backgroundColor = 'rgba(0, 0, 0, 0.6)',
    padding = 8,
  } = options

  // 创建Canvas
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')!

  // 设置字体以测量文字尺寸
  const fontStr = `bold ${fontSize}px ${fontFamily}`
  context.font = fontStr
  const metrics = context.measureText(text)
  const textWidth = metrics.width

  // 设置Canvas尺寸（使用2的幂次方，但确保有足够空间画描边）
  // 增加额外的padding给描边
  const strokeWidth = fontSize * 0.1
  const totalPadding = padding + strokeWidth

  const canvasWidth = Math.pow(2, Math.ceil(Math.log2(textWidth + totalPadding * 2)))
  const canvasHeight = Math.pow(2, Math.ceil(Math.log2(fontSize * 1.5 + totalPadding * 2)))
  
  canvas.width = canvasWidth
  canvas.height = canvasHeight

  // 如果有背景色，绘制背景
  if (backgroundColor !== 'transparent') {
    context.fillStyle = backgroundColor
    context.fillRect(0, 0, canvasWidth, canvasHeight)
  }

  // 绘制文字
  context.font = fontStr
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  
  const centerX = canvasWidth / 2
  const centerY = canvasHeight / 2

  // 绘制描边
  context.lineWidth = strokeWidth
  context.strokeStyle = 'rgba(0, 0, 0, 0.8)' // 深色描边
  context.lineJoin = 'round'
  context.strokeText(text, centerX, centerY)

  // 绘制填充
  context.fillStyle = color
  context.fillText(text, centerX, centerY)

  // 创建纹理
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  // 提高纹理质量
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = false 

  return texture
}
