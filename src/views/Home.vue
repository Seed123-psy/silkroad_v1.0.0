<template>
  <div class="home">
    <Globe3D
      :cities="cities"
      :routes="routes"
      :auto-rotate="true"
      class="globe-container"
      @city-hover="handleCityHover"
    />
    <CityInfoPanel :city="hoveredCity" @close="handleClosePanel" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Globe3D from '@/components/Globe3D.vue'
import CityInfoPanel from '@/components/CityInfoPanel.vue'
import { dataService } from '@/services/dataService'
import type { City, Route } from '@/types'

const cities = ref<City[]>([])
const routes = ref<Route[]>([])
const hoveredCity = ref<City | null>(null)
let hoverResetTimer: number | null = null

const handleCityHover = (city: City | null) => {
  if (hoverResetTimer) {
    window.clearTimeout(hoverResetTimer)
    hoverResetTimer = null
  }

  if (city) {
    hoveredCity.value = city
  } else {
    hoverResetTimer = window.setTimeout(() => {
      hoveredCity.value = null
      hoverResetTimer = null
    }, 150)
  }
}

const handleClosePanel = () => {
  console.log('关闭城市信息面板')
  if (hoverResetTimer) {
    window.clearTimeout(hoverResetTimer)
    hoverResetTimer = null
  }
  hoveredCity.value = null
}

onMounted(async () => {
  try {
    console.log('开始加载数据...')
    cities.value = await dataService.loadCities()
    console.log('城市数据加载成功:', cities.value.length, '个城市')

    routes.value = await dataService.loadRoutes()
    console.log('路线数据加载成功:', routes.value.length, '条路线')
  } catch (err) {
    console.error('Failed to load data:', err)
  }
})
</script>

<style scoped lang="scss">
.home {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.globe-container {
  width: 100%;
  height: 100%;
}
</style>
