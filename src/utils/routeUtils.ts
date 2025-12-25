// Utilities to parse textual route descriptions into coordinates
// and generate smooth route GeoJSON (great-circle interpolation).
export type LngLat = [number, number]

// 从文本中解析所有经纬度对（格式宽松，接受 "lng, lat" 或 "(lng,lat)" 等）
export function parseCoordinatesFromText(text: string): LngLat[] {
  if (!text || typeof text !== 'string') return []
  // 捕获形如 -123.45, 67.89 或 ( -123.45 , 67.89 ) 的坐标对
  const re = /(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/g
  const coords: LngLat[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    const a = Number(m[1])
    const b = Number(m[2])
    // 一般经度在 [-180,180], 纬度在 [-90,90]，但不强制，仅做简单校验
    if (Number.isFinite(a) && Number.isFinite(b)) {
      // 假设顺序为 lng, lat；若文件里反过来（lat,lng），用户可先预处理
      coords.push([a, b])
    }
  }
  return coords
}

function toRad(v: number) {
  return (v * Math.PI) / 180
}
function toDeg(v: number) {
  return (v * 180) / Math.PI
}

// 经纬度 -> 3D 单位向量
function latLngToVec3(lat: number, lng: number) {
  const latR = toRad(lat)
  const lngR = toRad(lng)
  const x = Math.cos(latR) * Math.cos(lngR)
  const y = Math.cos(latR) * Math.sin(lngR)
  const z = Math.sin(latR)
  return [x, y, z] as [number, number, number]
}

// 3D 单位向量 -> 经纬度
function vec3ToLatLng(v: [number, number, number]) {
  const [x, y, z] = v
  const hyp = Math.sqrt(x * x + y * y)
  const lat = toDeg(Math.atan2(z, hyp))
  const lng = toDeg(Math.atan2(y, x))
  return [lng, lat] as LngLat
}

function dot(a: [number, number, number], b: [number, number, number]) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

function norm(a: [number, number, number]) {
  return Math.sqrt(dot(a, a))
}

function scale(a: [number, number, number], s: number): [number, number, number] {
  return [a[0] * s, a[1] * s, a[2] * s]
}

function add(a: [number, number, number], b: [number, number, number]): [number, number, number] {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}

// 在两个经纬点之间沿大圆插值（slerp）。返回包含起点和终点的经纬数组。
export function greatCircleInterpolate(a: LngLat, b: LngLat, segments = 64): LngLat[] {
  const [lng1, lat1] = a
  const [lng2, lat2] = b
  const v1 = latLngToVec3(lat1, lng1)
  const v2 = latLngToVec3(lat2, lng2)
  const cosOmega = dot(v1, v2) / (norm(v1) * norm(v2))
  const omega = Math.acos(Math.max(-1, Math.min(1, cosOmega)))
  const out: LngLat[] = []
  if (omega < 1e-6) {
    // 非常接近，直接返回线性插值
    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const lng = lng1 + (lng2 - lng1) * t
      const lat = lat1 + (lat2 - lat1) * t
      out.push([lng, lat])
    }
    return out
  }

  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const s1 = Math.sin((1 - t) * omega) / Math.sin(omega)
    const s2 = Math.sin(t * omega) / Math.sin(omega)
    const v = add(scale(v1, s1), scale(v2, s2))
    // 归一化
    const n = norm(v)
    const vn: [number, number, number] = [v[0] / n, v[1] / n, v[2] / n]
    out.push(vec3ToLatLng(vn))
  }
  return out
}

// 将一系列节点坐标（稀疏）转为密集曲线坐标（沿每段插值）
export function densifyRoute(coords: LngLat[], segmentsPerPair = 32): LngLat[] {
  if (!coords || coords.length === 0) return []
  if (coords.length === 1) return coords.slice()
  const out: LngLat[] = []
  for (let i = 0; i < coords.length - 1; i++) {
    const a = coords[i]
    const b = coords[i + 1]
    const seg = greatCircleInterpolate(a, b, segmentsPerPair)
    // append all except last (下一个段会包含)
    for (let j = 0; j < seg.length - 1; j++) out.push(seg[j])
  }
  // push last point
  out.push(coords[coords.length - 1])
  return out
}

// 构建 GeoJSON LineString feature
export function buildLineGeoJSON(coords: LngLat[], properties: Record<string, any> = {}) {
  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: coords,
    },
    properties: properties,
  }
}

// 向已有 mapbox map 添加或更新路线（方便示例使用）
export function addOrUpdateRouteOnMap(map: any, feature: any, opts?: { id?: string; color?: string; width?: number }) {
  const id = opts?.id || 'ai-route'
  const srcId = `${id}-src`
  const layerId = `${id}-layer`
  const color = opts?.color || '#ff5e57'
  const width = opts?.width ?? 3

  const fc = {
    type: 'FeatureCollection',
    features: [feature],
  }

  if (map.getSource && map.getSource(srcId)) {
    try {
      map.getSource(srcId).setData(fc)
    } catch (e) {
      try {
        map.removeLayer(layerId)
      } catch (e) {}
      try {
        map.removeSource(srcId)
      } catch (e) {}
      map.addSource(srcId, { type: 'geojson', data: fc })
      map.addLayer({
        id: layerId,
        type: 'line',
        source: srcId,
        paint: {
          'line-color': color,
          'line-width': width,
          'line-cap': 'round',
          'line-join': 'round',
        },
      })
    }
  } else {
    map.addSource(srcId, { type: 'geojson', data: fc })
    map.addLayer({
      id: layerId,
      type: 'line',
      source: srcId,
      paint: {
        'line-color': color,
        'line-width': width,
        'line-cap': 'round',
        'line-join': 'round',
      },
    })
  }
}
