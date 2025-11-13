import { createPinia } from 'pinia'

const pinia = createPinia()

export default pinia

// Export stores
export { useAppStore } from './app'
export { useChartStore } from './chartStore'
