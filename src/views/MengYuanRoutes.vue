<template>
  <div class="mengyuan-view">
    <div ref="mapContainer" class="map-container" />

    <!-- 地图模式和样式切换控件（3x8） -->
    <MapControls
      v-model:modelMode="selectedMode"
      v-model:modelStyle="selectedStyle"
      :modes="MAP_MODES"
      :styles="MAP_STYLES"
      modePlaceholder="选择显示模式"
      stylePlaceholder="选择地图样式"
    />

      <!-- 路线选择下拉（浮动在地图上） -->
      <div class="route-select" role="region" aria-label="路线选择">
        <label for="routeSelect">选择路线编号：</label>
          <select id="routeSelect" v-model="selectedRouteId" :disabled="manifestLoading">
            <option value="">-- 请选择 --</option>
            <option v-for="r in routes" :key="r.id" :value="r.id">{{ r.id }}</option>
          </select>
          <div class="route-hint" v-if="manifestLoading">清单加载中…</div>
          <div class="route-hint" v-else>共 {{ routes.length }} 条路线</div>
          <div class="route-hint" v-if="loadingRoute">路线加载中…</div>
          <div class="route-error" v-if="manifestError">清单加载失败：{{ manifestError }}</div>
          <div class="route-error" v-if="routeError">路线加载失败：{{ routeError }}</div>
          
      </div>

    <!-- 手势控制 UI（复用） -->
    <div class="gesture-controls">
      <button class="gesture-btn" @click="toggleCamera" :class="{ active: isCameraOpen }">
        <span class="icon">📷</span>
        {{ isCameraOpen ? '关闭手势' : '开启手势' }}
      </button>

      <div v-show="isCameraOpen" class="camera-wrapper">
        <video ref="videoRef" class="input_video" autoplay playsinline></video>
        <canvas ref="canvasRef" class="output_canvas"></canvas>
        <div class="gesture-status">
          <p>状态: {{ gestureStatus }}</p>
          <p class="hint">单手捏合: 移动 | 单手张开: 旋转/倾斜 | 双手开合: 缩放</p>
        </div>
      </div>
    </div>

    <!-- WASD 键盘漫游提示（与其他页面一致） -->
    <div class="wasd-controls">
      <div class="control-section">
        <div class="key w" :class="{ active: keysPressed.w }">W</div>
        <div class="keys-row">
          <div class="key a" :class="{ active: keysPressed.a }">A</div>
          <div class="key s" :class="{ active: keysPressed.s }">S</div>
          <div class="key d" :class="{ active: keysPressed.d }">D</div>
        </div>
        <div class="label">移动</div>
      </div>

      <div class="divider"></div>

      <div class="control-section">
        <div class="key q" :class="{ active: keysPressed.q }">Q</div>
        <div class="key e" :class="{ active: keysPressed.e }">E</div>
        <div class="label">升降</div>
      </div>

      <div class="divider"></div>

      <div class="control-section">
        <div class="key up" :class="{ active: keysPressed.arrowup }">↑</div>
        <div class="keys-row">
          <div class="key left" :class="{ active: keysPressed.arrowleft }">←</div>
          <div class="key down" :class="{ active: keysPressed.arrowdown }">↓</div>
          <div class="key right" :class="{ active: keysPressed.arrowright }">→</div>
        </div>
        <div class="label">旋转</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import mapboxgl from 'mapbox-gl'
import MapControls from '@/components/MapControls.vue'
import { useGestureControl } from '@/composables/useGestureControl'
import { open as openShapefile } from 'shapefile'

const MAPBOX_TOKEN = (import.meta.env.VITE_MAPBOX_TOKEN as string) || ''
if (!MAPBOX_TOKEN) console.warn('VITE_MAPBOX_TOKEN 未配置，地图可能无法正常加载')

const mapContainer = ref<HTMLDivElement | null>(null)
let map: any = null

// 3x8 模式与样式（与其他页面一致）
const MAP_MODES = [
  { id: 'flat', name: '平面' },
  { id: 'globe', name: '球形' },
  { id: 'terrain', name: '立体' }
]
const MAP_STYLES = [
  { id: 'mapbox://styles/mapbox/dark-v10', name: '暗色' },
  { id: 'mapbox://styles/mapbox/streets-v11', name: '街道' },
  { id: 'mapbox://styles/mapbox/light-v10', name: '明亮' },
  { id: 'mapbox://styles/mapbox/satellite-v9', name: '卫星' },
  { id: 'mapbox://styles/mapbox/satellite-streets-v11', name: '卫星街道' },
  { id: 'mapbox://styles/mapbox/outdoors-v11', name: '户外' },
  { id: 'mapbox://styles/mapbox/navigation-day-v1', name: '导航（日）' },
  { id: 'mapbox://styles/mapbox/navigation-night-v1', name: '导航（夜）' }
]

const selectedMode = ref<string>('flat')
const selectedStyle = ref<string>(MAP_STYLES[0]?.id || '')

// 手势控制（复用）
const { isCameraOpen, videoRef, canvasRef, gestureStatus, toggleCamera, setCallbacks } = useGestureControl()

// 路线选择数据
const routes = ref<Array<{ id: string; base: string }>>([])
const selectedRouteId = ref<string>('')
const manifestLoading = ref(false)
const manifestError = ref<string | null>(null)
const loadingRoute = ref(false)
const routeError = ref<string | null>(null)

// 地图上用于渲染的 source/layer id
const LINE_SOURCE_ID = 'mengyuan-selected-line'
const LINE_LAYER_ID = 'mengyuan-selected-line-layer'
const POINT_SOURCE_ID = 'mengyuan-selected-points'
const POINT_LAYER_ID = 'mengyuan-selected-points-layer'
let pointHandlersAttached = false

async function fetchArrayBuffer(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`fetch ${url} ${res.status}`)
  return await res.arrayBuffer()
}

function detectEncodingFromCpg(cpgBuf: ArrayBuffer | null): string {
  if (!cpgBuf) return 'utf-8'
  try {
    const text = new TextDecoder('utf-8').decode(new Uint8Array(cpgBuf)).trim().toLowerCase()
    // If the fetched .cpg looks like HTML (vite dev server SPA fallback) or is unusually long,
    // treat it as missing/invalid and fallback to utf-8.
    if (!text || text.includes('<!doctype') || text.includes('<html') || text.length > 200) {
      console.warn('[MengYuan] cpg looks invalid or is HTML; ignoring and falling back to utf-8')
      return 'utf-8'
    }
    const NORMALIZED: Record<string,string> = { 'utf-8':'utf-8','utf8':'utf-8','gbk':'gbk','gb2312':'gb2312','gb18030':'gb18030' }
    return NORMALIZED[text] || text || 'utf-8'
  } catch (e) {
    console.warn('[MengYuan] detectEncodingFromCpg failed, using utf-8', e)
    return 'utf-8'
  }
}

// 尝试多种常见编码并基于示例文本选择最可能的编码
function detectBestEncoding(dbfBuf: ArrayBuffer, cpgBuf: ArrayBuffer | null): string {
  // 如果有有效的 cpg 指定，优先使用
  const fromCpg = detectEncodingFromCpg(cpgBuf)
  if (fromCpg && fromCpg !== 'utf-8') {
    console.log('[MengYuan] using encoding from .cpg:', fromCpg)
    return fromCpg
  }

  const sample = new Uint8Array(dbfBuf.slice(0, 4096))
  const candidates = ['utf-8', 'gb18030', 'gbk', 'gb2312', 'big5', 'windows-1252', 'iso-8859-1']

  let best = 'utf-8'
  let bestScore = -Infinity
  let bestRecoveredEnc: string | null = null
  // unicode regex to detect CJK unified ideographs
  const hanRe = /\p{Script=Han}/u
  const mojibakeRe = /Ã|Â|�/g

  for (const enc of candidates) {
    try {
      const dec = new TextDecoder(enc, { fatal: false })
      const txt = dec.decode(sample)
      // score: prefer presence of Han characters, penalize replacement char U+FFFD
      const replCount = (txt.match(/�/g) || []).length
      const hanCount = (txt.match(hanRe) || []).length
      const score = hanCount * 10 - replCount
      // prefer encodings that yield non-garbled strings
      // eslint-disable-next-line no-console
      console.log('[MengYuan] detect encoding try', enc, 'han', hanCount, 'repl', replCount, 'score', score)
      if (score > bestScore) { bestScore = score; best = enc; bestRecoveredEnc = null }
      // if the decoded text looks like mojibake (UTF-8 decoded as Latin1/Windows-1252),
      // try recovering by reinterpreting those chars as raw bytes and decoding as UTF-8.
      if (mojibakeRe.test(txt)) {
        try {
          const bytes = new Uint8Array(Array.from(txt).map(c => c.charCodeAt(0) & 0xFF))
          const recovered = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
          const rRepl = (recovered.match(/�/g) || []).length
          const rHan = (recovered.match(hanRe) || []).length
          const rScore = rHan * 10 - rRepl
          // eslint-disable-next-line no-console
          console.log('[MengYuan] mojibake recovery try', enc, '-> utf-8 recover han', rHan, 'repl', rRepl, 'score', rScore)
          if (rScore > bestScore) { bestScore = rScore; best = 'utf-8'; bestRecoveredEnc = 'utf-8' }
        } catch (e) {}
      }
    } catch (e) {
      // ignore unsupported encodings
    }
  }
  console.log('[MengYuan] detectBestEncoding chosen:', best)
  return best
}

async function loadLineFeatures(basePathNoExt: string): Promise<GeoJSON.Feature[]> {
  // basePathNoExt e.g. '/data/mengyuan/line/1218lines'
  const shpUrl = `${basePathNoExt}.shp`
  const dbfUrl = `${basePathNoExt}.dbf`
  const cpgUrl = `${basePathNoExt}.cpg`

  const [shpBuf, dbfBuf] = await Promise.all([fetchArrayBuffer(shpUrl), fetchArrayBuffer(dbfUrl)])
  let cpgBuf: ArrayBuffer | null = null
  try { cpgBuf = await fetchArrayBuffer(cpgUrl) } catch (_) { cpgBuf = null }

  const encoding = detectBestEncoding(dbfBuf, cpgBuf)
  const source: any = await openShapefile(shpBuf.slice(0), dbfBuf.slice(0), { encoding })
  const features: GeoJSON.Feature[] = []
  try {
    while (true) {
      // eslint-disable-next-line no-await-in-loop
      const r = await source.read()
      if (!r || r.done) break
      if (r.value) features.push(r.value as GeoJSON.Feature)
    }
  } finally {
    if (source && typeof source.cancel === 'function') {
      try { source.cancel() } catch (_e) {}
    }
  }
  // 尝试修复因错误编码解码导致的字段乱码：对每个字符串属性，基于原始单字节码流尝试用多种编码重解码并选出包含最多汉字的结果
  try {
    const hanRe = /\p{Script=Han}/u
    const tryDecoders = ['utf-8', 'gb18030', 'big5']
    for (const f of features) {
      if (!f.properties) continue
      const props = f.properties as Record<string, any>
      for (const k of Object.keys(props)) {
        const v = props[k]
        if (typeof v !== 'string') continue
        const orig = v
        // quick check: if already contains Han, skip
        if (hanRe.test(orig)) continue
        // build byte array from char codes (assume single-byte mis-decoding)
        const bytes = new Uint8Array(Array.from(orig).map(c => c.charCodeAt(0) & 0xFF))
        let bestStr = orig
        let bestScore = (orig.match(hanRe) || []).length - (orig.match(/�/g) || []).length
        for (const dec of tryDecoders) {
          try {
            const cand = new TextDecoder(dec, { fatal: false }).decode(bytes)
            const candHan = (cand.match(hanRe) || []).length
            const candRepl = (cand.match(/�/g) || []).length
            const candScore = candHan * 10 - candRepl
            if (candScore > bestScore) { bestScore = candScore; bestStr = cand }
          } catch (_) {}
        }
        props[k] = bestStr
      }
    }
  } catch (e) { console.warn('[MengYuan] property normalization failed', e) }
  return features
}

function addOrUpdateLineLayer(features: GeoJSON.Feature[]) {
  if (!map) return
  const fc = { type: 'FeatureCollection', features }
  if (map.getSource(LINE_SOURCE_ID)) {
    ;(map.getSource(LINE_SOURCE_ID) as any).setData(fc)
  } else {
    map.addSource(LINE_SOURCE_ID, { type: 'geojson', data: fc })
    map.addLayer({ id: LINE_LAYER_ID, type: 'line', source: LINE_SOURCE_ID, paint: { 'line-color': '#ff5e57', 'line-width': 2 } })
  }
  // 缩放至要素范围
  try {
    const coords: number[][] = []
    features.forEach((f) => {
      if (f.geometry && f.geometry.type === 'LineString') {
        coords.push(...(f.geometry.coordinates as number[][]))
      } else if (f.geometry && f.geometry.type === 'MultiLineString') {
        ;(f.geometry.coordinates as number[][][]).forEach(arr => coords.push(...arr))
      }
    })
    if (coords.length) {
      const lons = coords.map(c => c[0])
      const lats = coords.map(c => c[1])
      const minLon = Math.min(...lons), maxLon = Math.max(...lons)
      const minLat = Math.min(...lats), maxLat = Math.max(...lats)
      map.fitBounds([[minLon, minLat], [maxLon, maxLat]], { padding: 60 })
    }
  } catch (e) {}
}

function escapeHtml(input: any) {
  if (input === null || input === undefined) return ''
  const s = String(input)
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function addOrUpdatePointLayer(features: GeoJSON.Feature[]) {
  if (!map) return

  // Normalize and derive mtype for coloring
  function normalizeType(props: Record<string, any>): string {
    if (!props) return '其他'
    const keys = ['类别','类型','type','Type','TYPE','place','kind','class','CATEGORY','属性']
    let v = ''
    for (const k of keys) {
      if (Object.prototype.hasOwnProperty.call(props, k) && props[k] != null) { v = String(props[k]); break }
    }
    if (!v) {
      for (const k of Object.keys(props)) {
        if (k.toLowerCase().includes('type') || k.toLowerCase().includes('class') || k.toLowerCase().includes('kind') || k.toLowerCase().includes('category')) {
          v = String(props[k]); break
        }
      }
    }
    const s = (v || '').toLowerCase()
    if (!s) return '其他'
    if (/city|town|镇|城市|都城|县城|城/.test(s)) return '城镇'
    if (/village|村|乡|乡村|农村/.test(s)) return '农村'
    if (/ruin|site|遗址|古迹|遗址点/.test(s)) return '遗址'
    if (/pass|关隘|关口|关/.test(s)) return '关隘'
    if (/country|国家|王国|帝国/.test(s)) return '国家'
    if (/region|地区|州|郡/.test(s)) return '地区'
    if (/mountain|山|山体|山脉|峰/.test(s)) return '山体'
    if (/water|river|lake|海|江|河|湖|水体|水/.test(s)) return '水体'
    if (/desert|沙漠|沙地/.test(s)) return '沙漠'
    if (/grass|草|草原|草地|prairie/.test(s)) return '草原'
    return '其他'
  }

  const coloredFeatures = features.map((f) => {
    const fp = (f.properties as Record<string, any>) || {}
    fp.mtype = normalizeType(fp)
    f.properties = fp
    return f
  })

  const fc = { type: 'FeatureCollection', features: coloredFeatures }

  const colorMap: Record<string, string> = {
    '城镇': '#ff5e57',
    '农村': '#f7a35c',
    '遗址': '#b77bff',
    '关隘': '#ffdf5e',
    '国家': '#2db7f5',
    '地区': '#7bd389',
    '山体': '#8b5a2b',
    '水体': '#3aa6ff',
    '沙漠': '#e0c068',
    '草原': '#86c166',
    '其他': '#9aa0a6'
  }

  const matchExpr: any[] = ['match', ['get', 'mtype']]
  for (const k of Object.keys(colorMap)) { matchExpr.push(k, colorMap[k]) }
  matchExpr.push(colorMap['其他'])

  if (map.getSource(POINT_SOURCE_ID)) {
    ;(map.getSource(POINT_SOURCE_ID) as any).setData(fc)
  } else {
    map.addSource(POINT_SOURCE_ID, { type: 'geojson', data: fc })
    map.addLayer({
      id: POINT_LAYER_ID,
      type: 'circle',
      source: POINT_SOURCE_ID,
      paint: {
        'circle-radius': 6,
        'circle-color': matchExpr,
        'circle-stroke-color': '#fff',
        'circle-stroke-width': 1
      }
    })
  }

  // Attach click handler for popup once
  if (!pointHandlersAttached) {
    pointHandlersAttached = true
    const popup = new mapboxgl.Popup({ offset: 12 })

    map.on('mouseenter', POINT_LAYER_ID, () => { try { map.getCanvas().style.cursor = 'pointer' } catch (e) {} })
    map.on('mouseleave', POINT_LAYER_ID, () => { try { map.getCanvas().style.cursor = '' } catch (e) {} })

    map.on('click', POINT_LAYER_ID, (e: any) => {
      try {
        const feat = (e.features && e.features[0]) || null
        if (!feat) return
        const props = (feat.properties as Record<string, any>) || {}
        // debug: 打印属性以便开发者查看字段名和值
        // eslint-disable-next-line no-console
        console.log('[MengYuan] point clicked props:', props)

        // helper to pick property by candidates
        const pick = (candidates: string[]) => {
          for (const k of candidates) {
            if (Object.prototype.hasOwnProperty.call(props, k) && props[k] != null && String(props[k]).trim() !== '') return String(props[k])
          }
          return ''
        }

        const rows: Array<[string,string]> = []
        rows.push(['名称 / Name', pick(['名称','Name','name','NAME','Name_E','Name_E','name_en','英文名','Name _E','NAME_EN'])])
        rows.push(['年份 / Year', pick(['Year','year','YEAR','YearFirstVisit','旅行家首次抵达年','YearArrived'])])
        rows.push(['英文名', pick(['Name_E','name_e','name_en','english_name','英文名'])])
        rows.push(['国家 / Country', pick(['Country','country','国家'])])
        rows.push(['省 / Province', pick(['Province','province','省','PROVINCE'])])
        rows.push(['市 / City', pick(['City','city','市'])])
        rows.push(['县 / County', pick(['County','county','县'])])
        rows.push(['镇 / Town', pick(['Town','town','镇'])])
        rows.push(['地点 / Site', pick(['Site','site','具体位置','location','place'])])
        rows.push(['旅行家 / Traveler', pick(['Traveler','旅行家','traveller','traveler_name'])])
        rows.push(['分类 / Class', pick(['Class','class','分类'])])
        rows.push(['编码 / Code', pick(['Code','code','编码'])])
        rows.push(['参考 / Reference', pick(['Reference','reference','参考','参考资料','ref'])])

        // build HTML
        // Always include a header so popup is never completely blank
        let html = '<div class="mengyuan-popup" style="font-size:13px;line-height:1.4;color:#111">'
        html += `<div style="font-weight:700;margin-bottom:6px;color:#111">${escapeHtml(pick(['名称','Name','name','NAME','Name_E','name_en','英文名']) || pick(['Site','site','地点']) || '地点详情')}</div>`
        html += '<table style="border-collapse:collapse;color:#111">'
        for (const [k,v] of rows) {
          if (!v) continue
          html += `<tr><td style="padding:4px 8px;font-weight:600;vertical-align:top">${escapeHtml(k)}</td><td style="padding:4px 8px;vertical-align:top">${escapeHtml(v)}</td></tr>`
        }
        // fallback: show all properties if nothing matched
        if (rows.every(r => !r[1])) {
          for (const key of Object.keys(props)) {
            html += `<tr><td style="padding:4px 8px;font-weight:600;vertical-align:top">${escapeHtml(key)}</td><td style="padding:4px 8px;vertical-align:top">${escapeHtml(props[key])}</td></tr>`
          }
        }
        html += '</table></div>'

        const coords = (feat.geometry && feat.geometry.coordinates) || (e.lngLat && [e.lngLat.lng, e.lngLat.lat])
        if (!coords) return
        popup.setLngLat(coords).setHTML(html).addTo(map)
      } catch (ex) { console.warn('[MengYuan] point popup error', ex) }
    })
  }
}

// 统一的 manifest 读取函数（供按钮与初始化调用）
async function reloadManifest() {
  manifestLoading.value = true
  manifestError.value = null
  try {
    const r = await fetch('/data/mengyuan/manifest.json')
    if (!r.ok) throw new Error(`manifest fetch failed: ${r.status}`)
    const mj = await r.json()
    routes.value = (mj.routes || []).map((it: any) => ({ id: String(it.id), base: String(it.base) }))
    console.log('[MengYuan] manifest loaded, routes:', routes.value.length)
    if (!selectedRouteId.value && routes.value.length) selectedRouteId.value = routes.value[0].id
  } catch (e) {
    manifestError.value = (e && (e as Error).message) || String(e)
    console.warn('[MengYuan] 无法读取 manifest:', manifestError.value)
    // fallback entries
    routes.value = [
      { id: '1218', base: 'line/1218lines' },
      { id: '1220', base: 'line/1220lines' }
    ]
    if (!selectedRouteId.value && routes.value.length) selectedRouteId.value = routes.value[0].id
  } finally {
    manifestLoading.value = false
  }
}

// 当下拉选择变化时加载对应路线
watch(selectedRouteId, async (newId) => {
  if (!newId) return
  const entry = routes.value.find(r => r.id === newId)
  if (!entry) return
  try {
    loadingRoute.value = true
    routeError.value = null
    const base = `/data/mengyuan/${entry.base}`
    const feats = await loadLineFeatures(base)
    addOrUpdateLineLayer(feats)
    // 同时尝试加载对应的节点（points）
    try {
      const pointBase = `/data/mengyuan/point/${entry.id}points`
      const pfeats = await loadLineFeatures(pointBase)
      addOrUpdatePointLayer(pfeats)
    } catch (pe) {
      console.warn('[MengYuan] 加载节点失败', pe)
      // 如果加载节点失败，尝试移除已有的点图层/源
      try { if (map.getLayer(POINT_LAYER_ID)) map.removeLayer(POINT_LAYER_ID) } catch (_) {}
      try { if (map.getSource(POINT_SOURCE_ID)) map.removeSource(POINT_SOURCE_ID) } catch (_) {}
    }
    loadingRoute.value = false
  } catch (err) {
    console.warn('[MengYuan] 加载路线失败', err)
    routeError.value = (err && (err as Error).message) || String(err)
    loadingRoute.value = false
    // remove layer if exists
    try { if (map.getLayer(LINE_LAYER_ID)) map.removeLayer(LINE_LAYER_ID) } catch (_) {}
    try { if (map.getSource(LINE_SOURCE_ID)) map.removeSource(LINE_SOURCE_ID) } catch (_) {}
    try { if (map.getLayer(POINT_LAYER_ID)) map.removeLayer(POINT_LAYER_ID) } catch (_) {}
    try { if (map.getSource(POINT_SOURCE_ID)) map.removeSource(POINT_SOURCE_ID) } catch (_) {}
  }
})

// 手势回调实现——与现有页面相同的行为：pan/zoom/rotate
setCallbacks(
  (deltaX, deltaY) => {
    if (map) {
      const sensitivity = 1000
      map.panBy([-deltaX * sensitivity, -deltaY * sensitivity], { animate: false })
    }
  },
  (zoomFactor) => {
    if (map) {
      const currentZoom = map.getZoom()
      const sensitivity = 0.3
      const deltaZoom = (zoomFactor - 1) * sensitivity * 10
      map.setZoom(currentZoom + deltaZoom)
    }
  },
  (deltaX, deltaY) => {
    if (map) {
      const rotateSensitivity = 50
      const pitchSensitivity = 50
      const currentBearing = map.getBearing()
      const currentPitch = map.getPitch()
      const newBearing = currentBearing - deltaX * rotateSensitivity
      const newPitch = currentPitch - deltaY * pitchSensitivity
      map.jumpTo({ bearing: newBearing, pitch: Math.max(0, Math.min(85, newPitch)) })
    }
  }
)

// 键盘控制
const keysPressed = reactive({ 
  w: false, a: false, s: false, d: false,
  q: false, e: false,
  arrowup: false, arrowdown: false, arrowleft: false, arrowright: false
})
let animationFrameId: number | null = null

function handleKeyDown(e: KeyboardEvent) {
  const tagName = (e.target as HTMLElement).tagName
  if (tagName === 'INPUT' || tagName === 'TEXTAREA') return
  const key = e.key.toLowerCase()
  if (Object.prototype.hasOwnProperty.call(keysPressed, key)) {
    keysPressed[key as keyof typeof keysPressed] = true
    if (!animationFrameId) loopCameraMovement()
  }
}

function handleKeyUp(e: KeyboardEvent) {
  const key = e.key.toLowerCase()
  if (Object.prototype.hasOwnProperty.call(keysPressed, key)) {
    keysPressed[key as keyof typeof keysPressed] = false
  }
}

function loopCameraMovement() {
  if (!map) { animationFrameId = null; return }
  const { w, a, s, d, q, e, arrowup, arrowdown, arrowleft, arrowright } = keysPressed
  if (!w && !a && !s && !d && !q && !e && !arrowup && !arrowdown && !arrowleft && !arrowright) { animationFrameId = null; return }

  const panSpeed = 15
  const dx = (d ? panSpeed : 0) - (a ? panSpeed : 0)
  const dy = (s ? panSpeed : 0) - (w ? panSpeed : 0)
  if (dx !== 0 || dy !== 0) map.panBy([dx, dy], { animate: false })

  const zoomSpeed = 0.05
  if (q || e) {
    const currentZoom = map.getZoom()
    const deltaZ = (q ? 1 : 0) - (e ? 1 : 0)
    if (deltaZ !== 0) map.setZoom(currentZoom + deltaZ * zoomSpeed)
  }

  const rotateSpeed = 1.5
  const pitchSpeed = 1.0
  if (arrowleft || arrowright) {
    const currentBearing = map.getBearing()
    const change = (arrowright ? 1 : 0) - (arrowleft ? 1 : 0)
    map.setBearing(currentBearing + change * rotateSpeed)
  }
  if (arrowup || arrowdown) {
    const currentPitch = map.getPitch()
    const deltaP = (arrowup ? 1 : 0) - (arrowdown ? 1 : 0)
    const newPitch = Math.max(0, Math.min(85, currentPitch + deltaP * pitchSpeed))
    map.setPitch(newPitch)
  }

  animationFrameId = requestAnimationFrame(loopCameraMovement)
}

// 地形/交互优化占位实现（复用 Transport 中的逻辑）
let savedHillEx: number | null = null
let interactionTimer: any = null
const terrainExaggeration = ref<number>(2.5)
function reduceTerrainForInteraction() {
  if (!map) return
  try {
    if (map.getLayer && map.getLayer('hillshade-layer')) {
      try { if (savedHillEx === null) savedHillEx = map.getPaintProperty('hillshade-layer', 'hillshade-exaggeration') as number || 0.8; map.setPaintProperty('hillshade-layer', 'hillshade-exaggeration', 0.18) } catch (e) {}
    }
  } catch (e) {}
  if (interactionTimer) clearTimeout(interactionTimer)
}
function restoreTerrainAfterInteraction() {
  if (!map) return
  if (interactionTimer) clearTimeout(interactionTimer)
  interactionTimer = setTimeout(() => {
    try {
      if (map.getLayer && map.getLayer('hillshade-layer')) {
        try { const ex = terrainExaggeration.value; map.setPaintProperty('hillshade-layer', 'hillshade-exaggeration', Math.max(0.2, ex * 0.8)) } catch (e) {}
      }
    } catch (e) {}
    savedHillEx = null
    interactionTimer = null
  }, 220)
}

function setChineseLabels() {
  const CANDIDATE_KEYS = ['name_zh', 'name_zh_cn', 'name_zh-Hans', 'name_zh_hans', 'name_zh_CN', 'name_zh-Hant', 'name_zh_tw', 'name']
  try {
    const style = map.getStyle()
    const layers = (style && style.layers) || []
    layers.forEach((layer: any) => {
      if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
        const expr: any[] = ['coalesce']
        CANDIDATE_KEYS.forEach((k) => expr.push(['get', k]))
        try { map.setLayoutProperty(layer.id, 'text-field', expr) } catch (innerErr) {}
      }
    })
  } catch (e) { console.warn('设置地图中文语言失败：', e) }
}

function applyMapStyle(styleId: string) {
  if (!map) return
  map.setStyle(styleId)
  map.once('style.load', () => {
    setChineseLabels()
    try { applyMapProjection(selectedMode.value) } catch (e) {}
  })
}

function applyMapProjection(mode: string) {
  if (!map) return
  const fogConfig = {
    'range': [0.5, 10],
    'color': '#242B4B',
    'high-color': '#161B33',
    'space-color': '#0B0B15',
    'star-intensity': mode === 'globe' ? 0.8 : 0.0
  }
  if (mode === 'globe') {
    map.setProjection('globe')
    setTimeout(() => { if (map.getProjection().name !== 'globe') map.setProjection('globe') }, 100)
    map.setFog(fogConfig)
    if (map.getLayer('sky')) map.removeLayer('sky')
  } else {
    map.setProjection('mercator')
    setTimeout(() => { if (map.getProjection().name !== 'mercator') map.setProjection('mercator') }, 100)
    map.setFog(fogConfig)
    if (!map.getLayer('sky')) {
      map.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 0.0],
          'sky-atmosphere-sun-intensity': 15,
          'sky-atmosphere-color': '#242B4B',
          'sky-atmosphere-halo-color': '#161B33',
          'sky-opacity': 1
        }
      })
    }
    if (mode === 'terrain') {
      try {
        if (!map.getSource('mapbox-dem')) {
          map.addSource('mapbox-dem', { type: 'raster-dem', url: 'mapbox://mapbox.terrain-rgb', tileSize: 512, maxzoom: 14 })
        }
        const ex = terrainExaggeration.value
        map.setTerrain({ source: 'mapbox-dem', exaggeration: ex })
      } catch (e) { console.warn('地形设置失败:', e) }
    }
  }
}

onMounted(() => {
  mapboxgl.accessToken = MAPBOX_TOKEN
  if (!mapContainer.value) return
  map = new mapboxgl.Map({
    container: mapContainer.value,
    style: selectedStyle.value,
    center: [105, 35],
    zoom: 3,
    projection: selectedMode.value === 'globe' ? 'globe' : 'mercator',
    logoPosition: 'bottom-right'
  })
  map.addControl(new mapboxgl.NavigationControl(), 'bottom-left')
  map.addControl(new mapboxgl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left')

  map.on('movestart', reduceTerrainForInteraction)
  map.on('zoomstart', reduceTerrainForInteraction)
  map.on('rotatestart', reduceTerrainForInteraction)
  map.on('pitchstart', reduceTerrainForInteraction)
  map.on('moveend', restoreTerrainAfterInteraction)
  map.on('zoomend', restoreTerrainAfterInteraction)
  map.on('rotateend', restoreTerrainAfterInteraction)
  map.on('pitchend', restoreTerrainAfterInteraction)

  map.on('styledata', () => { try { setChineseLabels() } catch (e) {} })
  map.on('style.load', () => { try { setChineseLabels() } catch (e) {} })

  map.on('mousedown', () => { try { map.getCanvas().style.cursor = 'grabbing' } catch (e) {} })
  map.on('mouseup', () => { try { map.getCanvas().style.cursor = '' } catch (e) {} })

  map.on('load', () => {
    applyMapStyle(selectedStyle.value)
    if (typeof applyMapProjection === 'function') try { applyMapProjection(selectedMode.value) } catch (e) {}
    // 读取 manifest 并初始化下拉选项
    reloadManifest()
  })

  watch(selectedStyle, (style) => applyMapStyle(style))
  watch(selectedMode, (mode) => { try { if (typeof applyMapProjection === 'function') applyMapProjection(mode) } catch (e) {} })

  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

onUnmounted(() => {
  try { if (map) map.remove() } catch (e) {}
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
})
</script>

<style scoped>
.map-container { width: 100%; height: 100vh; }
.wasd-controls {
  position: absolute;
  right: 16px;
  bottom: 16px;
  z-index: 1000; /* 提高优先级，保持在底部 UI 之上 */
  display: flex;
  gap: 8px;
  background: rgba(12, 20, 30, 0.56);
  padding: 10px; /* 更紧凑，减少遮挡 */
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(3px);
  z-index: 1000; /* 保持低于时间轴与信息面板，避免遮挡重要 UI */
  pointer-events: none; /* 不阻塞底层交互 */
  opacity: 0.7;
  transition: opacity 0.2s;
}

.wasd-controls:hover {
  opacity: 1;
}

.control-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.divider {
  width: 1px;
  background: rgba(255, 255, 255, 0.15);
  align-self: stretch;
}

.key {
  width: 28px;
  height: 28px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
  transition: all 0.1s;
}

.key.active {
  background: #e67e22;
  border-color: #e67e22;
  color: #000;
  transform: scale(0.95);
}

.keys-row {
  display: flex;
  gap: 6px;
}

.wasd-controls .label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 4px;
  text-align: center;
  white-space: nowrap;
}

.gesture-controls {
  position: absolute;
  bottom: 140px; /* 位于 WASD 上方 */
  right: 24px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.gesture-btn {
  background: rgba(12, 20, 30, 0.68);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 8px 16px;
  border-radius: 30px;
  cursor: pointer;
  font-family: inherit;
  backdrop-filter: blur(5px);
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.gesture-btn:hover {
  background: rgba(12, 20, 30, 0.88);
  transform: translateY(-2px);
}

.gesture-btn.active {
  background: rgba(74, 158, 255, 0.3);
  border-color: #4a9eff;
  color: #4a9eff;
}

.camera-wrapper {
  position: relative;
  width: 200px;
  height: 150px;
  background: #000;
  border: 2px solid #333;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
}

.input_video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
}

.output_canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform: scaleX(-1);
}

.gesture-status {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: rgba(0,0,0,0.7);
  color: #fff;
  padding: 6px;
  text-align: center;
  font-size: 11px;
}

.gesture-status p {
  margin: 0;
}

.gesture-status .hint {
  font-size: 9px;
  color: #aaa;
  margin-top: 2px;
}

.route-select {
  position: absolute;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1100;
  min-width: 260px;
  max-width: 92%;
  background: rgba(12,20,30,0.88);
  color: #fff;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.08);
  backdrop-filter: blur(6px);
  pointer-events: auto; /* ensure select is clickable */
  display: flex;
  flex-direction: column;
  align-items: center;
}
.route-select label { font-size:13px; margin-bottom:6px; display:block; text-align:center }
.route-select select { background: #111; color: #fff; border: 1px solid rgba(255,255,255,0.08); padding:6px 8px; border-radius:6px; width:100% }
.route-hint { margin-top:6px; font-size:12px; color:#9aa }
.route-error { margin-top:6px; font-size:12px; color:#ff7b7b }
.route-select button { margin-top:8px; padding:8px 10px; border-radius:8px; background:#222; color:#fff; border:1px solid rgba(255,255,255,0.06); cursor:pointer }
</style>
