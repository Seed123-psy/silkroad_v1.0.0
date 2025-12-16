import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import zh from '@/locales/zh'
import en from '@/locales/en'

export function useI18n() {
  const appStore = useAppStore()

  const t = computed(() => {
    return appStore.language === 'zh' ? zh : en
  })

  return { t }
}
