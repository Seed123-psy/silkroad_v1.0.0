/**
 * 坐标转换工具函数
 * 提供地理坐标、屏幕坐标转换和大圆距离计算
 */

import * as THREE from 'three'

/**
 * 将地理坐标转换为屏幕坐标
 * @param lat 纬度 (-90 到 90)
 * @param lng 经度 (-180 到 180)
 * @param camera Three.js相机对象
 * @param renderer Three.js渲染器对象
 * @returns 屏幕坐标 { x, y }，坐标范围为像素值
 */
export function geoToScreen(
  lat: number,
  lng: number,
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer
): { x: number; y: number } {
  // 首先将地理坐标转换为3D世界坐标
  // 使用与threeHelpers.ts相同的转换逻辑
  const radius = 1 // 使用单位球体，因为我们只关心方向
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)

  const x = -radius * Math.sin(phi) * Math.cos(theta)
  const y = radius * Math.cos(phi)
  const z = radius * Math.sin(phi) * Math.sin(theta)

  const vector = new THREE.Vector3(x, y, z)

  // 将3D世界坐标投影到屏幕坐标
  vector.project(camera)

  // 获取渲染器尺寸
  const canvas = renderer.domElement
  const widthHalf = canvas.width / 2
  const heightHalf = canvas.height / 2

  // 转换为屏幕像素坐标
  const screenX = vector.x * widthHalf + widthHalf
  const screenY = -(vector.y * heightHalf) + heightHalf

  return { x: screenX, y: screenY }
}

/**
 * 计算两个地理坐标点之间的大圆距离（Haversine公式）
 * @param lat1 第一个点的纬度
 * @param lng1 第一个点的经度
 * @param lat2 第二个点的纬度
 * @param lng2 第二个点的经度
 * @returns 大圆距离（单位：千米）
 */
export function greatCircleDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  // 地球平均半径（千米）
  const EARTH_RADIUS = 6371

  // 将角度转换为弧度
  const toRadians = (degrees: number) => degrees * (Math.PI / 180)

  const φ1 = toRadians(lat1)
  const φ2 = toRadians(lat2)
  const Δφ = toRadians(lat2 - lat1)
  const Δλ = toRadians(lng2 - lng1)

  // Haversine公式
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  // 计算距离
  const distance = EARTH_RADIUS * c

  return distance
}

/**
 * 生成两点之间的弧线路径点
 * 使用大圆路径在球面上生成中间点
 * @param start 起点坐标 [lat, lng]
 * @param end 终点坐标 [lat, lng]
 * @param segments 分段数量（生成的中间点数量）
 * @returns 弧线路径点数组 [[lat, lng], ...]
 */
export function generateArcPoints(
  start: [number, number],
  end: [number, number],
  segments: number = 50
): [number, number][] {
  const [lat1, lng1] = start
  const [lat2, lng2] = end

  // 将角度转换为弧度
  const toRadians = (degrees: number) => degrees * (Math.PI / 180)
  const toDegrees = (radians: number) => radians * (180 / Math.PI)

  const φ1 = toRadians(lat1)
  const λ1 = toRadians(lng1)
  const φ2 = toRadians(lat2)
  const λ2 = toRadians(lng2)

  // 计算两点之间的角距离
  const Δφ = φ2 - φ1
  const Δλ = λ2 - λ1

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

  const δ = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  // 生成路径点
  const points: [number, number][] = []

  for (let i = 0; i <= segments; i++) {
    const fraction = i / segments

    // 使用球面线性插值（Slerp）计算中间点
    const A = Math.sin((1 - fraction) * δ) / Math.sin(δ)
    const B = Math.sin(fraction * δ) / Math.sin(δ)

    const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2)
    const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2)
    const z = A * Math.sin(φ1) + B * Math.sin(φ2)

    // 转换回经纬度
    const φi = Math.atan2(z, Math.sqrt(x * x + y * y))
    const λi = Math.atan2(y, x)

    const lat = toDegrees(φi)
    const lng = toDegrees(λi)

    points.push([lat, lng])
  }

  return points
}
