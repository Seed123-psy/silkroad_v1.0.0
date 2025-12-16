<template>
  <div class="mengyuan-view">
    <div ref="mapContainer" class="map-container" />

    <!-- 地图模式和样式切换控件（3x8） -->
    <MapControls
      v-model:model-mode="selectedMode"
      v-model:model-style="selectedStyle"
      :modes="MAP_MODES"
      :styles="MAP_STYLES"
      :mode-placeholder="t.map.controls.modePlaceholder"
      :style-placeholder="t.map.controls.stylePlaceholder"
    />

    <transition name="slide">
      <div v-if="hoverPanel.show" class="hover-panel compact">
        <div class="hover-top">
          <div class="icon-wrap" :style="{ borderColor: hoverPanel.props?.color || '#e67e22' }">
            <div
              class="icon-core"
              :style="{ backgroundColor: hoverPanel.props?.color || '#e67e22' }"
            />
          </div>
          <div class="hover-title">
            <h4 class="title">{{ hoverPanel.props?.name }}</h4>
            <div v-if="hoverPanel.props?.subtitle" class="subtitle">
              {{ hoverPanel.props?.subtitle }}
            </div>
          </div>
          <div v-if="hoverPanel.props?.badge" class="meta">
            <span
              class="badge small"
              :style="{ backgroundColor: hoverPanel.props?.color || '#e67e22' }"
              >{{ hoverPanel.props?.badge }}</span
            >
          </div>
        </div>

        <div class="hover-body">
          <div v-for="row in hoverPanel.props?.rows || []" :key="row.label" class="row">
            <div class="label">{{ row.label }}</div>
            <div class="value">{{ row.value }}</div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 路线选择下拉（浮动在地图上） -->
    <div class="route-select" role="region" aria-label="路线选择">
      <label for="routeSelect">{{ t.mengyuan.selectRoute }}：</label>
      <select id="routeSelect" v-model="selectedRouteId" :disabled="manifestLoading">
        <option value="">{{ t.mengyuan.placeholder }}</option>
        <option v-for="r in routes" :key="r.id" :value="r.id">{{ r.label || r.id }}</option>
      </select>
      <div v-if="manifestLoading" class="route-hint">{{ t.mengyuan.loadingList }}</div>
      <div v-else class="route-hint">{{ t.mengyuan.totalRoutes.replace('{count}', routes.length.toString()) }}</div>
      <div v-if="loadingRoute" class="route-hint">{{ t.mengyuan.loadingRoute }}</div>
      <div v-if="manifestError" class="route-error">{{ t.mengyuan.loadListError }}：{{ manifestError }}</div>
      <div v-if="routeError" class="route-error">{{ t.mengyuan.loadRouteError }}：{{ routeError }}</div>
    </div>


  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch, computed } from 'vue'
import mapboxgl from 'mapbox-gl'
import MapControls from '@/components/MapControls.vue'
import { open as openShapefile } from 'shapefile'
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()

const MAPBOX_TOKEN = (import.meta.env.VITE_MAPBOX_TOKEN as string) || ''
if (!MAPBOX_TOKEN) console.warn('VITE_MAPBOX_TOKEN 未配置，地图可能无法正常加载')

const mapContainer = ref<HTMLDivElement | null>(null)
let map: any = null

// 3x8 模式与样式（与其他页面一致）
const MAP_MODES = computed(() => [
  { id: 'flat', name: t.value.map.modes.flat },
  { id: 'globe', name: t.value.map.modes.globe },
  { id: 'terrain', name: t.value.map.modes.terrain },
])
const MAP_STYLES = computed(() => [
  { id: 'mapbox://styles/mapbox/dark-v10', name: t.value.map.styles.dark },
  { id: 'mapbox://styles/mapbox/streets-v11', name: t.value.map.styles.streets },
  { id: 'mapbox://styles/mapbox/light-v10', name: t.value.map.styles.light },
  { id: 'mapbox://styles/mapbox/satellite-v9', name: t.value.map.styles.satellite },
  { id: 'mapbox://styles/mapbox/satellite-streets-v11', name: t.value.map.styles.satelliteStreets },
  { id: 'mapbox://styles/mapbox/outdoors-v11', name: t.value.map.styles.outdoors },
  { id: 'mapbox://styles/mapbox/navigation-day-v1', name: t.value.map.styles.navigationDay },
  { id: 'mapbox://styles/mapbox/navigation-night-v1', name: t.value.map.styles.navigationNight },
])

const selectedMode = ref<string>('flat')
const selectedStyle = ref<string>(MAP_STYLES.value[0]?.id || '')

// 路线选择数据
const routes = ref<Array<{ id: string; base: string; label?: string }>>([])
const selectedRouteId = ref<string>('')
const manifestLoading = ref(false)
const manifestError = ref<string | null>(null)
const loadingRoute = ref(false)
const routeError = ref<string | null>(null)

interface HoverPanelRow {
  label: string
  value: string
}

interface HoverPanelContent {
  name: string
  subtitle?: string
  badge?: string
  color?: string
  rows: HoverPanelRow[]
}

const hoverPanel = ref<{ show: boolean; props?: HoverPanelContent }>({ show: false })

// 地图上用于渲染的 source/layer id
const LINE_SOURCE_ID = 'mengyuan-selected-line'
const LINE_LAYER_ID = 'mengyuan-selected-line-layer'
const POINT_SOURCE_ID = 'mengyuan-selected-points'
const POINT_LAYER_ID = 'mengyuan-selected-points-layer'
let pointHandlersAttached = false
let lineHandlersAttached = false

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
    const NORMALIZED: Record<string, string> = {
      'utf-8': 'utf-8',
      utf8: 'utf-8',
      gbk: 'gbk',
      gb2312: 'gb2312',
      gb18030: 'gb18030',
    }
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

      console.log(
        '[MengYuan] detect encoding try',
        enc,
        'han',
        hanCount,
        'repl',
        replCount,
        'score',
        score
      )
      if (score > bestScore) {
        bestScore = score
        best = enc
      }
      // if the decoded text looks like mojibake (UTF-8 decoded as Latin1/Windows-1252),
      // try recovering by reinterpreting those chars as raw bytes and decoding as UTF-8.
      if (mojibakeRe.test(txt)) {
        try {
          const bytes = new Uint8Array(Array.from(txt).map(c => c.charCodeAt(0) & 0xff))
          const recovered = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
          const rRepl = (recovered.match(/�/g) || []).length
          const rHan = (recovered.match(hanRe) || []).length
          const rScore = rHan * 10 - rRepl

          console.log(
            '[MengYuan] mojibake recovery try',
            enc,
            '-> utf-8 recover han',
            rHan,
            'repl',
            rRepl,
            'score',
            rScore
          )
          if (rScore > bestScore) {
            bestScore = rScore
            best = 'utf-8'
          }
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
  try {
    cpgBuf = await fetchArrayBuffer(cpgUrl)
  } catch (_) {
    cpgBuf = null
  }

  const encoding = detectBestEncoding(dbfBuf, cpgBuf)
  const source: any = await openShapefile(shpBuf.slice(0), dbfBuf.slice(0), { encoding })
  const features: GeoJSON.Feature[] = []
  try {
    while (true) {
      const r = await source.read()
      if (!r || r.done) break
      if (r.value) features.push(r.value as GeoJSON.Feature)
    }
  } finally {
    if (source && typeof source.cancel === 'function') {
      try {
        source.cancel()
      } catch (_e) {}
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
        const bytes = new Uint8Array(Array.from(orig).map(c => c.charCodeAt(0) & 0xff))
        let bestStr = orig
        let bestScore = (orig.match(hanRe) || []).length - (orig.match(/�/g) || []).length
        for (const dec of tryDecoders) {
          try {
            const cand = new TextDecoder(dec, { fatal: false }).decode(bytes)
            const candHan = (cand.match(hanRe) || []).length
            const candRepl = (cand.match(/�/g) || []).length
            const candScore = candHan * 10 - candRepl
            if (candScore > bestScore) {
              bestScore = candScore
              bestStr = cand
            }
          } catch (_) {}
        }
        props[k] = bestStr
      }
    }
  } catch (e) {
    console.warn('[MengYuan] property normalization failed', e)
  }
  return features
}

function addOrUpdateLineLayer(features: GeoJSON.Feature[]) {
  if (!map) return
  const fc = { type: 'FeatureCollection', features }
  if (map.getSource(LINE_SOURCE_ID)) {
    ;(map.getSource(LINE_SOURCE_ID) as any).setData(fc)
  } else {
    map.addSource(LINE_SOURCE_ID, { type: 'geojson', data: fc })
    map.addLayer({
      id: LINE_LAYER_ID,
      type: 'line',
      source: LINE_SOURCE_ID,
      paint: { 'line-color': '#ff5e57', 'line-width': 2 },
    })
    // 绑定鼠标事件用于显示路线悬浮面板
    if (!lineHandlersAttached) {
      lineHandlersAttached = true
      try {
        map.on('mousemove', LINE_LAYER_ID, handleLineMove)
      } catch (e) {}
      try {
        map.on('mouseleave', LINE_LAYER_ID, handleLineLeave)
      } catch (e) {}
    }
  }
  // 缩放至要素范围
  try {
    const coords: number[][] = []
    features.forEach(f => {
      if (f.geometry && f.geometry.type === 'LineString') {
        coords.push(...(f.geometry.coordinates as number[][]))
      } else if (f.geometry && f.geometry.type === 'MultiLineString') {
        ;(f.geometry.coordinates as number[][][]).forEach(arr => coords.push(...arr))
      }
    })
    if (coords.length) {
      const lons = coords.map(c => c[0]).filter((v): v is number => v !== undefined)
      const lats = coords.map(c => c[1]).filter((v): v is number => v !== undefined)
      if (lons.length === 0 || lats.length === 0) return
      const minLon = Math.min(...lons),
        maxLon = Math.max(...lons)
      const minLat = Math.min(...lats),
        maxLat = Math.max(...lats)
      map.fitBounds(
        [
          [minLon, minLat],
          [maxLon, maxLat],
        ],
        { padding: 60 }
      )
    }
  } catch (e) {}
}

// escapeHtml removed (unused)

function handlePointMove(e: any) {
  if (!map) return
  const feature = e.features && e.features[0]
  if (!feature) return
  const props = feature.properties
  if (!props) return

  hoverPanel.value = { show: true, props: buildPointHoverContent(props) }
  try {
    map.getCanvas().style.cursor = 'pointer'
  } catch (_) {}
}

function handlePointLeave() {
  hoverPanel.value = { show: false }
  try {
    map.getCanvas().style.cursor = ''
  } catch (_) {}
}

function handleLineMove(e: any) {
  if (!map) return
  const feature = e.features && e.features[0]
  if (!feature) return
  const props = feature.properties
  if (!props) return

  hoverPanel.value = { show: true, props: buildLineHoverContent(props) }
  try {
    map.getCanvas().style.cursor = 'pointer'
  } catch (_) {}
}

function handleLineLeave() {
  hoverPanel.value = { show: false }
  try {
    map.getCanvas().style.cursor = ''
  } catch (_) {}
}

function buildLineHoverContent(props: Record<string, any>): HoverPanelContent {
  const pick = (cands: string[]) => {
    for (const k of cands) {
      if (
        Object.prototype.hasOwnProperty.call(props, k) &&
        props[k] != null &&
        String(props[k]).trim() !== ''
      )
        return String(props[k])
    }
    return ''
  }

  // 表 6 字段候选名
  const nature = pick(['性质', 'nature', 'property'])
  const name = pick(['Name', '名称', 'name', 'NAME', 'RouteName', 'route_name']) || '未命名路线'
  const beginTime = pick([
    'Begin_Time',
    'begin_time',
    'BeginTime',
    'StartYear',
    'begin',
    'start_year',
  ])
  const endTime = pick(['End_Time', 'end_time', 'EndTime', 'EndYear', 'end', 'finish_year'])
  const beginPlace = pick([
    'Begin_Place',
    'begin_place',
    'StartPlace',
    '起点',
    'from',
    'start_place',
  ])
  const endPlace = pick(['End_Place', 'end_place', 'EndPlace', '终点', 'to', 'end_place'])
  const tourist = pick(['Tourist', 'traveler', 'Traveler', '旅行家', 'traveller'])
  const clazz = pick(['Class', 'class', '分类', 'TYPE', 'type'])
  const code = pick(['Code', 'code', '编码', 'ID', 'id'])
  const reference = pick(['Reference', 'reference', '参考', '参考资料', 'ref', 'source'])

  const rows: HoverPanelRow[] = []
  if (nature) rows.push({ label: '性质', value: nature })
  if (beginTime) rows.push({ label: '开始时间', value: beginTime })
  if (endTime) rows.push({ label: '结束时间', value: endTime })
  if (beginPlace) rows.push({ label: '开始地点', value: beginPlace })
  if (endPlace) rows.push({ label: '结束地点', value: endPlace })
  if (tourist) rows.push({ label: '旅行家', value: tourist })
  if (clazz) rows.push({ label: '分类', value: clazz })
  if (code) rows.push({ label: '编码', value: code })
  if (reference) rows.push({ label: '参考资料', value: reference })

  // 弹窗标题优先显示旅行家名 + '路线'，若无则使用路线名 + '路线'
  const displayName = tourist ? `${tourist} 路线` : `${name} 路线`
  return {
    name: displayName,
    subtitle: tourist ? name : '蒙元路线',
    badge: '路线',
    color: '#ff5e57',
    rows,
  }
}

function buildPointHoverContent(props: any): HoverPanelContent {
  // Helper to pick property
  const pick = (candidates: string[]) => {
    for (const k of candidates) {
      if (
        Object.prototype.hasOwnProperty.call(props, k) &&
        props[k] != null &&
        String(props[k]).trim() !== ''
      )
        return String(props[k])
    }
    return ''
  }

  const name =
    pick([
      '名称',
      'Name',
      'name',
      'NAME',
      'Name_E',
      'Name_E',
      'name_en',
      '英文名',
      'Name _E',
      'NAME_EN',
    ]) ||
    pick(['Site', 'site', '地点']) ||
    '未命名节点'
  const nameEn = pick(['Name_E', 'name_e', 'name_en', 'english_name', '英文名'])
  const mtype = props.mtype || '其他'

  const rows: HoverPanelRow[] = []

  const year = pick(['Year', 'year', 'YEAR', 'YearFirstVisit', '旅行家首次抵达年', 'YearArrived'])
  if (year) rows.push({ label: '年份', value: year })

  if (nameEn && nameEn !== name) rows.push({ label: '英文名', value: nameEn })

  const country = pick(['Country', 'country', '国家'])
  if (country) rows.push({ label: '国家', value: country })

  const province = pick(['Province', 'province', '省', 'PROVINCE'])
  if (province) rows.push({ label: '省份', value: province })

  const city = pick(['City', 'city', '市'])
  if (city) rows.push({ label: '城市', value: city })

  const traveler = pick(['Traveler', '旅行家', 'traveller', 'traveler_name'])
  if (traveler) rows.push({ label: '旅行家', value: traveler })

  const typeVal = pick(['Class', 'class', '分类'])
  if (typeVal) rows.push({ label: '分类', value: typeVal })

  const colorMap: Record<string, string> = {
    城镇: '#ff5e57',
    农村: '#f7a35c',
    遗址: '#b77bff',
    关隘: '#ffdf5e',
    国家: '#2db7f5',
    地区: '#7bd389',
    山体: '#8b5a2b',
    水体: '#3aa6ff',
    沙漠: '#e0c068',
    草原: '#86c166',
    其他: '#9aa0a6',
  }

  return {
    name,
    subtitle: nameEn,
    badge: mtype,
    color: colorMap[mtype] || '#9aa0a6',
    rows,
  }
}

function addOrUpdatePointLayer(features: GeoJSON.Feature[]) {
  if (!map) return

  // Normalize and derive mtype for coloring
  function normalizeType(props: Record<string, any>): string {
    if (!props) return '其他'
    const keys = [
      '类别',
      '类型',
      'type',
      'Type',
      'TYPE',
      'place',
      'kind',
      'class',
      'CATEGORY',
      '属性',
    ]
    let v = ''
    for (const k of keys) {
      if (Object.prototype.hasOwnProperty.call(props, k) && props[k] != null) {
        v = String(props[k])
        break
      }
    }
    if (!v) {
      for (const k of Object.keys(props)) {
        if (
          k.toLowerCase().includes('type') ||
          k.toLowerCase().includes('class') ||
          k.toLowerCase().includes('kind') ||
          k.toLowerCase().includes('category')
        ) {
          v = String(props[k])
          break
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

  const coloredFeatures = features.map(f => {
    const fp = (f.properties as Record<string, any>) || {}
    fp.mtype = normalizeType(fp)
    f.properties = fp
    return f
  })

  const fc = { type: 'FeatureCollection', features: coloredFeatures }

  const colorMap: Record<string, string> = {
    城镇: '#ff5e57',
    农村: '#f7a35c',
    遗址: '#b77bff',
    关隘: '#ffdf5e',
    国家: '#2db7f5',
    地区: '#7bd389',
    山体: '#8b5a2b',
    水体: '#3aa6ff',
    沙漠: '#e0c068',
    草原: '#86c166',
    其他: '#9aa0a6',
  }

  const matchExpr: any[] = ['match', ['get', 'mtype']]
  for (const k of Object.keys(colorMap)) {
    matchExpr.push(k, colorMap[k])
  }
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
        'circle-stroke-width': 1,
      },
    })
  }

  // Attach click handler for popup once
  if (!pointHandlersAttached) {
    pointHandlersAttached = true
    // const popup = new mapboxgl.Popup({ offset: 12 })

    // map.on('mouseenter', POINT_LAYER_ID, () => { try { map.getCanvas().style.cursor = 'pointer' } catch (e) {} })
    // map.on('mouseleave', POINT_LAYER_ID, () => { try { map.getCanvas().style.cursor = '' } catch (e) {} })

    map.on('mousemove', POINT_LAYER_ID, handlePointMove)
    map.on('mouseleave', POINT_LAYER_ID, handlePointLeave)

    // Click handler removed in favor of hover panel
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
    routes.value = (mj.routes || []).map((it: any) => ({
      id: String(it.id),
      base: String(it.base),
      label: it.label ? String(it.label) : undefined,
    }))
    console.log('[MengYuan] manifest loaded, routes:', routes.value.length)
    if (!selectedRouteId.value && routes.value.length) {
      const first = routes.value[0]
      if (first) selectedRouteId.value = first.id
    }
  } catch (e) {
    manifestError.value = String((e && (e as Error).message) || e)
    console.warn('[MengYuan] 无法读取 manifest:', manifestError.value)
    // fallback entries
    routes.value = [
      { id: '1218', base: 'line/1218lines' },
      { id: '1220', base: 'line/1220lines' },
    ]
    if (!selectedRouteId.value && routes.value.length) {
      const first = routes.value[0]
      if (first) selectedRouteId.value = first.id
    }
  } finally {
    manifestLoading.value = false
  }
}

// 当下拉选择变化时加载对应路线
watch(selectedRouteId, async newId => {
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
      try {
        if (map.getLayer(POINT_LAYER_ID)) map.removeLayer(POINT_LAYER_ID)
      } catch (_) {}
      try {
        if (map.getSource(POINT_SOURCE_ID)) map.removeSource(POINT_SOURCE_ID)
      } catch (_) {}
    }
    loadingRoute.value = false
  } catch (err) {
    console.warn('[MengYuan] 加载路线失败', err)
    routeError.value = String((err && (err as Error).message) || err)
    loadingRoute.value = false
    // remove layer if exists
    try {
      if (map.getLayer(LINE_LAYER_ID)) map.removeLayer(LINE_LAYER_ID)
    } catch (_) {}
    try {
      if (map.getSource(LINE_SOURCE_ID)) map.removeSource(LINE_SOURCE_ID)
    } catch (_) {}
    try {
      if (map.getLayer(POINT_LAYER_ID)) map.removeLayer(POINT_LAYER_ID)
    } catch (_) {}
    try {
      if (map.getSource(POINT_SOURCE_ID)) map.removeSource(POINT_SOURCE_ID)
    } catch (_) {}
  }
})

// 键盘控制
const keysPressed = reactive({
  w: false,
  a: false,
  s: false,
  d: false,
  q: false,
  e: false,
  arrowup: false,
  arrowdown: false,
  arrowleft: false,
  arrowright: false,
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
  if (!map) {
    animationFrameId = null
    return
  }
  const { w, a, s, d, q, e, arrowup, arrowdown, arrowleft, arrowright } = keysPressed
  if (!w && !a && !s && !d && !q && !e && !arrowup && !arrowdown && !arrowleft && !arrowright) {
    animationFrameId = null
    return
  }

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
      try {
        if (savedHillEx === null)
          savedHillEx =
            (map.getPaintProperty('hillshade-layer', 'hillshade-exaggeration') as number) || 0.8
        map.setPaintProperty('hillshade-layer', 'hillshade-exaggeration', 0.18)
      } catch (e) {}
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
        try {
          const ex = terrainExaggeration.value
          map.setPaintProperty('hillshade-layer', 'hillshade-exaggeration', Math.max(0.2, ex * 0.8))
        } catch (e) {}
      }
    } catch (e) {}
    savedHillEx = null
    interactionTimer = null
  }, 220)
}

function setChineseLabels() {
  const CANDIDATE_KEYS = [
    'name_zh',
    'name_zh_cn',
    'name_zh-Hans',
    'name_zh_hans',
    'name_zh_CN',
    'name_zh-Hant',
    'name_zh_tw',
    'name',
  ]
  try {
    const style = map.getStyle()
    const layers = (style && style.layers) || []
    layers.forEach((layer: any) => {
      if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
        const expr: any[] = ['coalesce']
        CANDIDATE_KEYS.forEach(k => expr.push(['get', k]))
        try {
          map.setLayoutProperty(layer.id, 'text-field', expr)
        } catch (innerErr) {}
      }
    })
  } catch (e) {
    console.warn('设置地图中文语言失败：', e)
  }
}

function applyMapStyle(styleId: string) {
  if (!map) return
  map.setStyle(styleId)
  map.once('style.load', () => {
    setChineseLabels()
    try {
      applyMapProjection(selectedMode.value)
    } catch (e) {}
  })
}

function applyMapProjection(mode: string) {
  if (!map) return
  const fogConfig = {
    range: [0.5, 10],
    color: '#242B4B',
    'high-color': '#161B33',
    'space-color': '#0B0B15',
    'star-intensity': mode === 'globe' ? 0.8 : 0.0,
  }
  if (mode === 'globe') {
    map.setProjection('globe')
    setTimeout(() => {
      if (map.getProjection().name !== 'globe') map.setProjection('globe')
    }, 100)
    map.setFog(fogConfig)
    if (map.getLayer('sky')) map.removeLayer('sky')
  } else {
    map.setProjection('mercator')
    setTimeout(() => {
      if (map.getProjection().name !== 'mercator') map.setProjection('mercator')
    }, 100)
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
          'sky-opacity': 1,
        },
      })
    }
    if (mode === 'terrain') {
      try {
        if (!map.getSource('mapbox-dem')) {
          map.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.terrain-rgb',
            tileSize: 512,
            maxzoom: 14,
          })
        }
        const ex = terrainExaggeration.value
        map.setTerrain({ source: 'mapbox-dem', exaggeration: ex })
      } catch (e) {
        console.warn('地形设置失败:', e)
      }
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
    logoPosition: 'bottom-right',
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

  map.on('styledata', () => {
    try {
      setChineseLabels()
    } catch (e) {}
  })
  map.on('style.load', () => {
    try {
      setChineseLabels()
    } catch (e) {}
  })

  map.on('mousedown', () => {
    try {
      map.getCanvas().style.cursor = 'grabbing'
    } catch (e) {}
  })
  map.on('mouseup', () => {
    try {
      map.getCanvas().style.cursor = ''
    } catch (e) {}
  })

  map.on('load', () => {
    applyMapStyle(selectedStyle.value)
    if (typeof applyMapProjection === 'function')
      try {
        applyMapProjection(selectedMode.value)
      } catch (e) {}
    // 读取 manifest 并初始化下拉选项
    reloadManifest()
  })

  watch(selectedStyle, style => applyMapStyle(style))
  watch(selectedMode, mode => {
    try {
      if (typeof applyMapProjection === 'function') applyMapProjection(mode)
    } catch (e) {}
  })

  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

onUnmounted(() => {
  try {
    if (map) map.remove()
  } catch (e) {}
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
})
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100vh;
}
.wasd-controls {
  position: absolute;
  right: 20px;   /* 靠右对齐 */
  bottom: 220px; /* 位于摄像头上方 */
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
  bottom: 340px; /* 位于 WASD 上方 */
  right: 20px;
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
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
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
  background: rgba(0, 0, 0, 0.7);
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
  background: rgba(12, 20, 30, 0.88);
  color: #fff;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(6px);
  pointer-events: auto; /* ensure select is clickable */
  display: flex;
  flex-direction: column;
  align-items: center;
}
.route-select label {
  font-size: 13px;
  margin-bottom: 6px;
  display: block;
  text-align: center;
}
.route-select select {
  background: #111;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 6px 8px;
  border-radius: 6px;
  width: 100%;
}
.route-hint {
  margin-top: 6px;
  font-size: 12px;
  color: #9aa;
}
.route-error {
  margin-top: 6px;
  font-size: 12px;
  color: #ff7b7b;
}
.route-select button {
  margin-top: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  background: #222;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.06);
  cursor: pointer;
}

.hover-panel {
  position: absolute;
  left: 24px;
  top: 72px;
  width: 260px; /* 再次缩窄面板宽度 */
  padding: 16px; /* 轻微减小内边距以节省空间 */
  background: rgba(6, 9, 16, 0.88);
  border-radius: 14px;
  color: #f2f6ff;
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.45);
  z-index: 3000;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}

.hover-panel.compact {
  width: 260px; /* 再次缩窄面板宽度（紧凑模式） */
  padding: 10px;
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(8, 12, 18, 0.92), rgba(6, 9, 16, 0.86));
  backdrop-filter: blur(6px) saturate(120%);
}

.hover-top {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 6px 18px rgba(2, 6, 12, 0.5);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(0, 0, 0, 0.08));
}

.icon-core {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.hover-title .title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  line-height: 1.1;
  max-width: 120px; /* 随着面板再缩窄，进一步限制标题宽度 */
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.hover-title .subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.72);
  max-width: 120px; /* 与标题一致 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta {
  margin-left: auto;
}

.badge.small {
  padding: 6px 8px;
  font-size: 12px;
  border-radius: 999px;
  color: #06101d;
  font-weight: 700;
}

.hover-body {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.label {
  color: rgba(255, 255, 255, 0.62);
  font-size: 12px;
}

.value {
  color: rgba(255, 255, 255, 0.92);
  font-size: 13px;
  text-align: right;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.slide-enter-active,
.slide-leave-active {
  transition:
    transform 220ms cubic-bezier(0.2, 0.9, 0.2, 1),
    opacity 180ms ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-12px);
  opacity: 0;
}

.slide-enter-to,
.slide-leave-from {
  transform: translateX(0);
  opacity: 1;
}
</style>
