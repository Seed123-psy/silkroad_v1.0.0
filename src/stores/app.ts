import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const loading = ref(false)
  const currentYear = ref(0)

  const setLoading = (value: boolean) => {
    loading.value = value
  }

  const setCurrentYear = (year: number) => {
    currentYear.value = year
  }

  return {
    loading,
    currentYear,
    setLoading,
    setCurrentYear,
  }
})
