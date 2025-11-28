<template>
  <Transition name="slide-fade">
    <div v-if="feature" class="han-panel glass-panel">
      <div class="panel-header">
        <div class="title-block">
          <h2 class="title">{{ title }}</h2>
          <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
        </div>
        <button class="close-btn" aria-label="关闭侧栏" @click="emit('close')">
          <span aria-hidden="true">×</span>
        </button>
      </div>

      <div class="panel-content">
        <section class="info-section">
          <div class="tag-list">
            <span v-for="tag in tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
          <div v-if="timeframe" class="time-range">{{ timeframe }}</div>
        </section>

        <section v-if="locationEntries.length" class="info-section">
          <h3>地理信息</h3>
          <ul class="info-list">
            <li v-for="item in locationEntries" :key="item.label">
              <span class="label">{{ item.label }}</span>
              <span class="value">{{ item.value }}</span>
            </li>
          </ul>
        </section>

        <section v-if="siteEntries.length" class="info-section">
          <h3>遗址与功能</h3>
          <ul class="info-list">
            <li v-for="item in siteEntries" :key="item.label">
              <span class="label">{{ item.label }}</span>
              <span class="value">{{ item.value }}</span>
            </li>
          </ul>
        </section>

        <section v-if="showRouteNarratives" class="info-section narrative">
          <h3>丝绸之路路线说明</h3>
          <div class="narrative-wrapper">
            <div
              v-for="section in narrativeSections"
              :key="section.id"
              class="narrative-block"
            >
              <h4 class="narrative-title">{{ section.title }}</h4>
              <p
                v-for="(paragraph, idx) in section.content"
                :key="`${section.id}-p-${idx}`"
                class="narrative-text"
              >
                {{ paragraph }}
              </p>
              <div v-if="section.children?.length" class="narrative-children">
                <div
                  v-for="child in section.children"
                  :key="child.id"
                  class="narrative-subblock"
                >
                  <h5 class="narrative-subtitle">{{ child.title }}</h5>
                  <p
                    v-for="(paragraph, cIdx) in child.content"
                    :key="`${child.id}-p-${cIdx}`"
                    class="narrative-text"
                  >
                    {{ paragraph }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { HanFeaturePanelData } from '@/types/lianghan'
import { liangHanRouteNarratives, type RouteNarrativeBlock } from '@/assets/data/liangHan/routeNarratives'

interface Props {
  feature: HanFeaturePanelData | null
}

const props = defineProps<Props>()
const emit = defineEmits<{ (e: 'close'): void }>()
const narrativeSections = computed<RouteNarrativeBlock[]>(() => {
  if (!props.feature || props.feature.kind !== 'line') return []
  const directKey = props.feature.properties.name?.trim()
  if (directKey && liangHanRouteNarratives[directKey]) {
    return liangHanRouteNarratives[directKey]
  }

  const folderPath = props.feature.properties.folderPath || ''
  if (!folderPath) return []

  const folderSegments = folderPath
    .split('/')
    .map((segment) => segment.replace(/\.kmz$/i, '').trim())
    .filter(Boolean)

  for (const candidate of [...folderSegments].reverse()) {
    if (liangHanRouteNarratives[candidate]) {
      return liangHanRouteNarratives[candidate]
    }
  }

  return []
})

const title = computed(() => {
  if (!props.feature) return ''
  return props.feature.kind === 'point' ? props.feature.properties.nameZh : props.feature.properties.name
})

const subtitle = computed(() => {
  if (!props.feature) return ''
  if (props.feature.kind === 'point') {
    const { nameEn, dynasty } = props.feature.properties
    return [dynasty, nameEn].filter(Boolean).join(' · ')
  }
  return props.feature.properties.folderPath || ''
})

const tags = computed(() => {
  if (!props.feature) return [] as string[]
  if (props.feature.kind === 'point') {
    const { type, classification, dataset } = props.feature.properties
    return [dataset === 'western' ? '西汉交通点' : '东汉交通点', type, classification].filter(Boolean) as string[]
  }
  return ['两汉交通线']
})

const timeframe = computed(() => {
  if (!props.feature || props.feature.kind !== 'point') return ''
  const { beginYear, endYear } = props.feature.properties
  if (beginYear === undefined && endYear === undefined) return ''
  return `${formatYear(beginYear)} - ${formatYear(endYear)}`
})

const locationEntries = computed(() => {
  if (!props.feature) return [] as Array<{ label: string; value: string }>
  if (props.feature.kind !== 'point') return []
  const { province, prefecture, county, town, village } = props.feature.properties
  return [
    { label: '省份', value: province },
    { label: '府州', value: prefecture },
    { label: '郡县', value: county },
    { label: '乡镇', value: town },
    { label: '村落', value: village },
  ].filter((item) => Boolean(item.value)) as Array<{ label: string; value: string }>
})

const siteEntries = computed(() => {
  if (!props.feature) return [] as Array<{ label: string; value: string }>
  if (props.feature.kind === 'point') {
    const { site, postalCode } = props.feature.properties
    return [
      { label: '遗址', value: site },
      { label: '邮编', value: postalCode },
    ].filter((item) => Boolean(item.value)) as Array<{ label: string; value: string }>
  }
  const { length } = props.feature.properties
  return length
    ? ([{ label: '路线长度', value: `${length.toFixed(2)} km` }] as Array<{ label: string; value: string }>)
    : []
})

const showRouteNarratives = computed(() => props.feature?.kind === 'line' && narrativeSections.value.length > 0)

function formatYear(year?: number) {
  if (year === undefined || Number.isNaN(year)) return '不详'
  if (year < 0) return `公元前${Math.abs(year)}`
  return `公元${year}`
}
</script>

<style scoped lang="scss">
.han-panel {
  position: fixed;
  top: 24px;
  right: 24px;
  width: 380px;
  max-height: calc(100vh - 48px);
  border-radius: 16px;
  background: rgba(8, 12, 18, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
  color: #f6f8ff;
  display: flex;
  flex-direction: column;
  z-index: 3200;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 18px 20px 0 20px;
}

.title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
}

.subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

.close-btn {
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  font-size: 28px;
  cursor: pointer;
  line-height: 1;
}

.panel-content {
  padding: 12px 20px 20px 20px;
  overflow-y: auto;
}

.info-section {
  margin-bottom: 18px;
}

.info-section h3 {
  margin: 0 0 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 12px;
}

.time-range {
  margin-top: 10px;
  font-size: 15px;
  color: #ffdd99;
}

.info-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.info-list li {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.info-list .label {
  color: rgba(255, 255, 255, 0.6);
}

.info-list .value {
  color: #fff;
  text-align: right;
  margin-left: 12px;
}

.narrative-wrapper {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.narrative-block {
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.narrative-title {
  margin: 0 0 8px;
  font-size: 15px;
  color: #fdf2d0;
}

.narrative-subtitle {
  margin: 12px 0 6px;
  font-size: 14px;
  color: #f8d17a;
}

.narrative-text {
  margin: 0 0 8px;
  font-size: 14px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.88);
  text-align: justify;
}

.narrative-subblock {
  padding-left: 12px;
  border-left: 2px solid rgba(255, 255, 255, 0.1);
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(16px);
  opacity: 0;
}
</style>
