<template>
  <div class="ai-routes-view">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h3>{{ t.aiRoutes?.title || 'AI 路线管理' }}</h3>
      </div>

      <div class="sidebar-section">
        <div class="section-title">{{ t.aiRoutes?.promptTitle || 'AI 智能路线生成' }}</div>
        <div class="sys-prompt-box">
          <div class="prompt-badge">🤖 {{ t.aiRoutes?.promptBadge || '智能模式已启用' }}</div>
          <div class="prompt-content">
            <p class="prompt-desc">{{ t.aiRoutes?.promptDesc || '在聊天页面切换到「路线」模式，AI 会基于真实历史地理数据：' }}</p>
            <div class="prompt-requirements">
              <div class="requirement-item">
                <span class="requirement-icon">📍</span>
                <span>{{ t.aiRoutes?.requirement1 || '识别起点、终点和历史途经地' }}</span>
              </div>
              <div class="requirement-item">
                <span class="requirement-icon">🏛️</span>
                <span>{{ t.aiRoutes?.requirement2 || '使用真实的城市、驿站、关隘坐标' }}</span>
              </div>
              <div class="requirement-item">
                <span class="requirement-icon">✅</span>
                <span>{{ t.aiRoutes?.requirement3 || '验证每个节点的历史真实性' }}</span>
              </div>
              <div class="requirement-item">
                <span class="requirement-icon">📊</span>
                <span>{{ t.aiRoutes?.requirement4 || '输出5-15个精确坐标并绘制路线' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="sidebar-section">
        <label class="field-label">{{ t.aiRoutes?.routeName || '路线名称' }}</label>
        <input v-model="name" class="field-input" :placeholder="t.aiRoutes?.routeNamePlaceholder || '例如：长安-洛阳线路'" />

        <!-- AI 思考过程（可折叠） -->
        <div v-if="reasoning" class="reasoning-section">
          <button 
            class="reasoning-toggle" 
            @click="reasoningCollapsed = !reasoningCollapsed"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              stroke-width="2"
              class="toggle-icon"
              :class="{ collapsed: reasoningCollapsed }"
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
            <span class="toggle-text">{{ reasoningCollapsed ? t.chat.reasoningView : t.chat.reasoningHide }}</span>
            <span class="reasoning-badge">{{ t.chat.reasoningBadge }}</span>
          </button>
          <div 
            class="reasoning-content" 
            :class="{ collapsed: reasoningCollapsed }"
          >
            <div class="reasoning-text" v-html="renderMarkdown(reasoning)"></div>
          </div>
        </div>

        <label class="field-label">{{ t.aiRoutes?.pasteCoords || '粘贴 AI 输出或坐标文本' }}</label>
        <textarea v-model="text" rows="6" class="field-textarea" :placeholder="t.aiRoutes?.pasteCoordsPlaceholder || '例如：103.8,34.5 -> 104.5,35.2 -> 106.1,36.0'"></textarea>

        <div class="actions">
          <button class="btn btn-primary" @click="addRoute">
            <PlusIcon class="btn-icon" />
            {{ t.aiRoutes?.addRoute || '解析并添加' }}
          </button>
          <button class="btn btn-muted" @click="clearInput">{{ t.aiRoutes?.clear || '清空' }}</button>
        </div>
      </div>

      <div class="sidebar-section">
        <div class="section-title">{{ t.aiRoutes?.addedRoutes || '已添加路线' }}</div>
        <ul class="route-list" v-if="routes.length">
          <li v-for="r in routes" :key="r.id" class="route-card" :class="{active: r.id===activeId}">
            <div class="route-color" :style="{ backgroundColor: r.color }"></div>
            <div class="route-info">
              <div class="route-name">{{ r.name || r.id }}</div>
              <div class="route-meta">{{ t.aiRoutes?.points || '点数' }}: {{ r.coords.length }}</div>
            </div>
            <div class="route-controls">
              <button class="btn-icon-only" @click="zoomToRoute(r.id)" :title="t.aiRoutes?.locate || '定位'">
                <MapPinIcon class="icon" />
              </button>
              <button class="btn-icon-only" @click="toggleVisibility(r.id)" :title="r.visible ? (t.aiRoutes?.hide || '隐藏') : (t.aiRoutes?.show || '显示')">
                <EyeIcon v-if="r.visible" class="icon" />
                <EyeSlashIcon v-else class="icon" />
              </button>
              <button class="btn-icon-only danger" @click="removeRoute(r.id)" :title="t.aiRoutes?.delete || '删除'">
                <TrashIcon class="icon" />
              </button>
            </div>
          </li>
        </ul>
        <div v-else class="empty-hint">{{ t.aiRoutes?.noRoutes || '暂无路线，请在上方添加' }}</div>
      </div>
    </aside>

    <main class="map-area">
      <div ref="mapContainer" class="map-container"></div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import {
  parseCoordinatesFromText,
  densifyRoute,
  buildLineGeoJSON,
  addOrUpdateRouteOnMap,
} from '@/utils/routeUtils'
import { useI18n } from '@/composables/useI18n'
import { useAppStore } from '@/stores/app'
import { useAiRouteStore } from '@/stores/aiRoute'
import {
  PlusIcon,
  MapPinIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline'

const { t } = useI18n()
const aiRouteStore = useAiRouteStore()

// 配置 Markdown 渲染器
const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  breaks: true,
  highlight: function (str: string, lang: string) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`
      } catch (__) {}
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`
  }
})

// 渲染 Markdown 内容
const renderMarkdown = (content: string): string => {
  if (!content) return ''
  return md.render(content)
}

const MAPBOX_TOKEN = (import.meta.env.VITE_MAPBOX_TOKEN as string) || ''
if (!MAPBOX_TOKEN) console.warn('VITE_MAPBOX_TOKEN 未配置，地图可能无法加载')

const mapContainer = ref<HTMLDivElement | null>(null)
let map: any = null
const appStore = useAppStore()

function setMapLanguage(m: any, lang: string) {
  if (!m || !m.getStyle) return
  try {
    const style = m.getStyle()
    if (!style || !style.layers) return
    const nameKeyPrimary = lang === 'zh' ? 'name_zh' : 'name_en'
    const nameKeyAlt = lang === 'zh' ? 'name:zh' : 'name:en'

    style.layers.forEach((layer: any) => {
      if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
        const textExpression = ['coalesce', ['get', nameKeyPrimary], ['get', nameKeyAlt], ['get', 'name']]
        try {
          m.setLayoutProperty(layer.id, 'text-field', textExpression)
        } catch (e) {
          // 某些托管样式不允许直接修改 layout，忽略错误
        }
      }
    })
    // 有时需要强制刷新样式以让修改生效
    m.repaint = (m.repaint || 0) + 1
  } catch (e) {
    console.warn('设置地图语言失败', e)
  }
}

interface RouteItem {
  id: string
  name: string
  text: string
  coords: [number, number][]
  visible: boolean
  color: string
}

const name = ref('')
const text = ref('')
const reasoning = ref('') // AI 思考过程
const reasoningCollapsed = ref(true) // 默认折叠
const routes = reactive<RouteItem[]>([])
const activeId = ref<string | null>(null)

const COLORS = ['#ff5e57', '#ff884e', '#10ac84', '#48dbfb', '#2e86de', '#5f27cd', '#f368e0', '#1dd1a1']
function pickColor(i: number) {
  return COLORS[i % COLORS.length]
}

function uid(prefix = 'r') {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

function addRoute() {
  if (!map) return alert('地图未初始化')
  const parsed = parseCoordinatesFromText(text.value || '')
  if (!parsed || parsed.length < 2) {
    alert('无法解析到至少两个坐标，请确保 AI 输出为经度,纬度 列表，或使用系统提示让 AI 生成坐标。')
    return
  }
  const dense = densifyRoute(parsed, 48)
  const id = uid('ai')
  const color = pickColor(routes.length)
  const feature = buildLineGeoJSON(dense, { Name: name.value || 'AI Route', __routeColor: color })
  addOrUpdateRouteOnMap(map, feature, { id, color, width: 3 })
  routes.push({ id, name: name.value || `路线 ${routes.length + 1}`, text: text.value, coords: dense as any, visible: true, color })
  activeId.value = id
}

function clearInput() {
  name.value = ''
  text.value = ''
  reasoning.value = ''
  reasoningCollapsed.value = true
}

function toggleVisibility(id: string) {
  const r = routes.find(x => x.id === id)
  if (!r || !map) return
  const layerId = `${id}-layer`
  try {
    const vis = r.visible ? 'none' : 'visible'
    if (map.getLayer && map.getLayer(layerId)) map.setLayoutProperty(layerId, 'visibility', vis)
    r.visible = !r.visible
  } catch (e) {
    console.warn('切换可见性失败', e)
  }
}

function removeRoute(id: string) {
  const idx = routes.findIndex(x => x.id === id)
  if (idx === -1) return
  const srcId = `${id}-src`
  const layerId = `${id}-layer`
  try {
    if (map.getLayer && map.getLayer(layerId)) map.removeLayer(layerId)
  } catch (e) {}
  try {
    if (map.getSource && map.getSource(srcId)) map.removeSource(srcId)
  } catch (e) {}
  routes.splice(idx, 1)
  if (activeId.value === id) activeId.value = routes[0]?.id ?? null
}

function zoomToRoute(id: string) {
  const r = routes.find(x => x.id === id)
  if (!r || !map) return
  // 计算 bounds
  const coords = r.coords
  let minX = 180, minY = 90, maxX = -180, maxY = -90
  coords.forEach(c => {
    const [lng, lat] = c
    minX = Math.min(minX, lng)
    minY = Math.min(minY, lat)
    maxX = Math.max(maxX, lng)
    maxY = Math.max(maxY, lat)
  })
  try {
    map.fitBounds([[minX, minY], [maxX, maxY]], { padding: 40, maxZoom: 10 })
    activeId.value = id
  } catch (e) {
    console.warn('定位失败', e)
  }
}

onMounted(() => {
  mapboxgl.accessToken = MAPBOX_TOKEN
  if (!mapContainer.value) return
  map = new mapboxgl.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/dark-v10',
    center: [105, 35],
    zoom: 3,
    projection: 'mercator',
  })
  map.addControl(new mapboxgl.NavigationControl(), 'bottom-left')
  map.on('load', () => {
    // ready
    // 根据当前语言设置地图标签显示（尝试本地化字段）
    setMapLanguage(map, appStore.language)
    // 监听语言切换并在运行时切换地图标签
    // 注意：mapbox 的某些样式限制了直接修改层布局，修改可能无效或抛错（已捕获）
    watch(() => appStore.language, (lang) => {
      setMapLanguage(map, lang)
    })
    // 检查是否有从 Chat 页面传递的待处理路线
    if (aiRouteStore.pendingRoute) {
      name.value = aiRouteStore.pendingRoute.name
      text.value = aiRouteStore.pendingRoute.content
      aiRouteStore.clearPendingRoute()
      // 自动解析并添加
      setTimeout(() => {
        addRoute()
      }, 500)
    }
  })
})

// 监听 pendingRoute 变化（用于已加载地图后的跳转）
watch(() => aiRouteStore.pendingRoute, (pending) => {
  if (pending && map) {
    name.value = pending.name
    text.value = pending.content
    reasoning.value = pending.reasoning || '' // 接收思考过程
    reasoningCollapsed.value = false // 默认展开思考过程
    aiRouteStore.clearPendingRoute()
    setTimeout(() => {
      addRoute()
    }, 300)
  }
})

onUnmounted(() => {
  try {
    if (map) map.remove()
  } catch (e) {}
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.ai-routes-view {
  display: flex;
  height: 100%;
  background: $bg-primary;
}

.sidebar {
  width: 300px;
  min-width: 260px;
  max-width: 320px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: $bg-glass;
  backdrop-filter: blur(16px) saturate(180%);
  border-right: 1px solid $border-color;
  overflow-y: auto;
  color: $text-primary;
}

.sidebar-header {
  padding: $spacing-lg $spacing-md;
  border-bottom: 1px solid $border-color;

  h3 {
    margin: 0;
    font-size: $font-size-xl;
    font-weight: $font-weight-semibold;
    color: $color-gold;
    letter-spacing: 0.5px;
  }
}

.sidebar-section {
  padding: $spacing-md;
  border-bottom: 1px solid $border-color-light;

  &:last-child {
    border-bottom: none;
    flex: 1;
  }
}

// Ensure consistent layout inside sections
.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.section-title {
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  color: $text-secondary;
  margin-bottom: $spacing-sm;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.sys-prompt-box {
  background: linear-gradient(135deg, rgba($color-gold, 0.05) 0%, rgba($color-gold, 0.02) 100%);
  border: 1px solid rgba($color-gold, 0.2);
  border-radius: $border-radius-base;
  overflow: hidden;

  .prompt-badge {
    background: rgba($color-gold, 0.15);
    color: $color-gold;
    padding: $spacing-xs $spacing-sm;
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    text-align: center;
    border-bottom: 1px solid rgba($color-gold, 0.2);
  }

  .prompt-content {
    padding: $spacing-md;
  }

  .prompt-desc {
    color: $text-secondary;
    font-size: $font-size-xs;
    margin: 0 0 $spacing-sm 0;
    line-height: 1.5;
  }

  .prompt-requirements {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  .requirement-item {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    color: $text-secondary;
    font-size: $font-size-xs;
    line-height: 1.5;

    .requirement-icon {
      font-size: 14px;
      flex-shrink: 0;
    }
  }
}

.sys-prompt {
  background: $bg-tertiary;
  border: 1px solid $border-color;
  border-radius: $border-radius-base;
  padding: $spacing-sm $spacing-md;
  font-size: $font-size-xs;
  color: $text-secondary;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}

// Make sure input-like elements respect container width and box-sizing
.field-input,
.field-textarea,
.sys-prompt {
  box-sizing: border-box;
  width: 100%;
}

// 思考过程样式
.reasoning-section {
  margin: $spacing-md 0;
  border: 1px dashed $border-color-medium;
  border-radius: $border-radius-base;
  overflow: hidden;
}

.reasoning-toggle {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  width: 100%;
  background: rgba($color-gold, 0.08);
  border: none;
  border-bottom: 1px solid rgba($color-gold, 0.2);
  color: $text-tertiary;
  font-size: $font-size-xs;
  cursor: pointer;
  padding: $spacing-sm;
  transition: all $transition-duration-base;

  .toggle-icon {
    width: 14px;
    height: 14px;
    transition: transform $transition-duration-base;
    color: $color-gold;

    &.collapsed {
      transform: rotate(-90deg);
    }
  }

  .toggle-text {
    color: $color-gold;
    flex: 1;
    text-align: left;
  }

  .reasoning-badge {
    background: rgba($color-gold, 0.15);
    color: $color-gold;
    padding: 2px $spacing-xs;
    border-radius: $border-radius-sm;
    font-size: $font-size-xs;
  }

  &:hover {
    background: rgba($color-gold, 0.15);
    
    .toggle-text {
      color: $color-gold-light;
    }
  }
}

.reasoning-content {
  overflow: hidden;
  max-height: 300px;
  transition: max-height $transition-duration-base $ease-ancient,
              opacity $transition-duration-base $ease-ancient;
  opacity: 1;

  &.collapsed {
    max-height: 0;
    opacity: 0;
  }

  .reasoning-text {
    color: $text-tertiary;
    font-size: $font-size-sm;
    line-height: $line-height-relaxed;
    padding: $spacing-sm;
    background: rgba(0, 0, 0, 0.08);
    border-left: 2px solid $color-gold;
    white-space: pre-wrap;
    overflow: auto;
    max-height: 260px;

    :deep(p) {
      margin: $spacing-xs 0;
    }

    :deep(code) {
      background: rgba($color-gold, 0.1);
      padding: 2px 4px;
      border-radius: 3px;
      font-size: $font-size-xs;
    }
  }

  .reasoning-text::-webkit-scrollbar {
    width: 8px;
  }

  .reasoning-text::-webkit-scrollbar-track {
    background: transparent;
  }

  .reasoning-text::-webkit-scrollbar-thumb {
    background: rgba($color-gold, 0.18);
    border-radius: 4px;
  }
}

.field-label {
  display: block;
  margin-top: $spacing-md;
  margin-bottom: $spacing-xs;
  font-size: $font-size-sm;
  color: $text-secondary;
}

.field-input,
.field-textarea {
  width: 100%;
  padding: $spacing-sm $spacing-md;
  border-radius: $border-radius-base;
  background: $bg-tertiary;
  color: $text-primary;
  border: 1px solid $border-color;
  font-size: $font-size-sm;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &::placeholder {
    color: $text-muted;
  }

  &:focus {
    outline: none;
    border-color: $border-color-hover;
    box-shadow: 0 0 0 2px rgba($color-gold, 0.1);
  }
}

.field-textarea {
  resize: vertical;
  min-height: 100px;
}

.actions {
  display: flex;
  gap: $spacing-sm;
  margin-top: $spacing-md;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-xs;
  padding: $spacing-sm $spacing-md;
  border-radius: $border-radius-base;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;

  .btn-icon {
    width: 16px;
    height: 16px;
  }
}

.btn-primary {
  background: linear-gradient(135deg, $color-gold 0%, $color-gold-dark 100%);
  color: $text-inverse;

  &:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}

.btn-muted {
  background: transparent;
  color: $text-secondary;
  border: 1px solid $border-color;

  &:hover {
    background: $bg-elevated;
    color: $text-primary;
  }
}

.route-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.route-card {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  margin-bottom: $spacing-sm;
  background: $bg-tertiary;
  border: 1px solid $border-color-light;
  border-radius: $border-radius-base;
  transition: all 0.2s ease;

  &:hover {
    background: $bg-elevated;
    border-color: $border-color;
  }

  &.active {
    border-color: $border-color-strong;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
}

.route-color {
  width: 8px;
  height: 32px;
  border-radius: 4px;
  flex-shrink: 0;
}

.route-info {
  flex: 1;
  min-width: 0;
}

.route-name {
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  color: $text-primary;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.route-meta {
  font-size: $font-size-xs;
  color: $text-tertiary;
  margin-top: 2px;
}

.route-controls {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

// Keep route card content vertically centered and aligned
.route-card {
  align-items: center;
}

.btn-icon-only {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $border-radius-sm;
  background: transparent;
  border: 1px solid transparent;
  color: $text-secondary;
  cursor: pointer;
  transition: all 0.15s ease;

  .icon {
    width: 16px;
    height: 16px;
  }

  &:hover {
    background: $bg-elevated;
    color: $text-primary;
    border-color: $border-color;
  }

  &.danger:hover {
    background: rgba($error-color, 0.15);
    color: $error-color;
    border-color: rgba($error-color, 0.3);
  }
}

.empty-hint {
  text-align: center;
  padding: $spacing-xl $spacing-md;
  color: $text-muted;
  font-size: $font-size-sm;
}

.map-area {
  flex: 1;
  position: relative;
}

.map-container {
  position: absolute;
  inset: 0;
}

@media (max-width: 768px) {
  .ai-routes-view {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    max-width: none;
    height: auto;
    max-height: 50vh;
  }

  .map-area {
    min-height: 50vh;
  }
}
</style>
