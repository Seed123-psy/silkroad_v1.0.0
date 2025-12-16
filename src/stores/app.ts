import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const loading = ref(false)
  const currentYear = ref(0)
  const theme = ref<'dark' | 'light'>('dark')
  const language = ref<'zh' | 'en'>('zh')
  const showHelp = ref(false)

  const setLoading = (value: boolean) => {
    loading.value = value
  }

  const setCurrentYear = (year: number) => {
    currentYear.value = year
  }

  const toggleHelp = () => {
    showHelp.value = !showHelp.value
  }

  const toggleTheme = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    // 这里可以添加切换 document class 的逻辑，如果需要全局 CSS 响应
    if (theme.value === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    }
  }

  const toggleLanguage = () => {
    language.value = language.value === 'zh' ? 'en' : 'zh'
  }

  return {
    loading,
    currentYear,
    theme,
    language,
    showHelp,
    setLoading,
    setCurrentYear,
    toggleHelp,
    toggleTheme,
    toggleLanguage
  }
})
