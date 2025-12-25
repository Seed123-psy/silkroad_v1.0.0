import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface PendingRoute {
  name: string
  content: string
  reasoning?: string // AI 思考过程
  timestamp: number
}

export const useAiRouteStore = defineStore('aiRoute', () => {
  const pendingRoute = ref<PendingRoute | null>(null)

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

  return {
    pendingRoute,
    setPendingRoute,
    clearPendingRoute
  }
})
