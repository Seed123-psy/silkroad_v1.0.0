import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface PendingRoute {
  name: string
  content: string
  reasoning?: string // AI 思考过程
  timestamp: number
}

export type RouteItem = {
  id: string
  name: string
  text: string
  coords: [number, number][]
  visible: boolean
  color: string
}

const STORAGE_KEY = 'silkroad_ai_routes_v1'

export const useAiRouteStore = defineStore('aiRoute', () => {
  const pendingRoute = ref<PendingRoute | null>(null)
  const routes = ref<RouteItem[]>([])

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) routes.value = parsed
      }
    } catch (e) {
      console.warn('Failed to load ai routes from localStorage', e)
    }
  }

  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(routes.value))
    } catch (e) {
      console.warn('Failed to save ai routes to localStorage', e)
    }
  }

  // 初始化
  loadFromStorage()

  // 监听变化并保存
  watch(
    routes,
    () => {
      saveToStorage()
    },
    { deep: true }
  )

  function setPendingRoute(name: string, content: string, reasoning?: string) {
    pendingRoute.value = {
      name,
      content,
      reasoning,
      timestamp: Date.now()
    }
  }

  function clearPendingRoute() {
    pendingRoute.value = null
  }

  function addRoute(route: RouteItem) {
    routes.value.push(route)
  }

  function removeRoute(id: string) {
    const idx = routes.value.findIndex(r => r.id === id)
    if (idx !== -1) routes.value.splice(idx, 1)
  }

  function updateRoute(id: string, patch: Partial<RouteItem>) {
    const r = routes.value.find(rr => rr.id === id)
    if (!r) return
    Object.assign(r, patch)
  }

  function getRoute(id: string) {
    return routes.value.find(r => r.id === id) || null
  }

  return {
    pendingRoute,
    routes,
    setPendingRoute,
    clearPendingRoute,
    addRoute,
    removeRoute,
    updateRoute,
    getRoute,
  }
})
