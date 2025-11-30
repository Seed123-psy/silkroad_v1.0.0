<template>
  <Transition name="slide-fade">
    <div v-if="city" class="city-info-panel glass-panel">
      <div class="panel-header">
        <h2 class="city-name">
          <span class="name-zh">{{ city.name }}</span>
          <span class="name-en">{{ city.nameEn }}</span>
        </h2>
        <button class="close-btn" aria-label="关闭" @click="handleClose">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="panel-content">
        <!-- 基本信息 -->
        <section class="info-section">
          <h3 class="section-title">基本信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">经度</span>
              <span class="info-value">{{ city.lng.toFixed(4) }}°</span>
            </div>
            <div class="info-item">
              <span class="info-label">纬度</span>
              <span class="info-value">{{ city.lat.toFixed(4) }}°</span>
            </div>
            <div class="info-item">
              <span class="info-label">重要性</span>
              <span class="info-value">
                <span class="importance-stars">
                  <span
                    v-for="i in 5"
                    :key="i"
                    class="star"
                    :class="{ active: i <= city.importance }"
                  >★</span>
                </span>
              </span>
            </div>
            <div v-if="city.population" class="info-item">
              <span class="info-label">人口</span>
              <span class="info-value">{{ formatPopulation(city.population) }}</span>
            </div>
          </div>
        </section>

        <!-- 描述 -->
        <section class="info-section">
          <h3 class="section-title">城市简介</h3>
          <p class="description">{{ city.description }}</p>
        </section>

        <!-- 历史时期 -->
        <section class="info-section">
          <h3 class="section-title">历史时期</h3>
          <div class="tag-group">
            <span v-for="period in city.period" :key="period" class="tag period-tag">
              {{ getPeriodName(period) }}
            </span>
          </div>
        </section>

        <!-- 贸易商品 -->
        <section v-if="city.tradeItems && city.tradeItems.length > 0" class="info-section">
          <h3 class="section-title">主要贸易商品</h3>
          <div class="tag-group">
            <span v-for="trade in city.tradeItems" :key="trade" class="tag trade-tag">
              {{ trade }}
            </span>
          </div>
        </section>

        <!-- 文化交流 -->
        <section v-if="city.culturalExchange" class="info-section">
          <h3 class="section-title">文化交流</h3>
          <p class="description">{{ city.culturalExchange }}</p>
        </section>

        <!-- 地理位置 -->
        <section v-if="city.geography" class="info-section">
          <h3 class="section-title">地理位置</h3>
          <p class="description">{{ city.geography }}</p>
        </section>

        <!-- 历史事件 -->
        <section v-if="city.events && city.events.length > 0" class="info-section">
          <h3 class="section-title">历史事件</h3>
          <ul class="event-list">
            <li v-for="(event, index) in city.events" :key="index" class="event-item">
              {{ event }}
            </li>
          </ul>
        </section>

        <!-- 现代遗址 -->
        <section v-if="city.modernSites && city.modernSites.length > 0" class="info-section">
          <h3 class="section-title">现代遗址</h3>
          <div class="tag-group">
            <span v-for="site in city.modernSites" :key="site" class="tag site-tag">
              {{ site }}
            </span>
          </div>
        </section>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { City } from '@/types/city'

interface Props {
  city: City | null
}

interface Emits {
  (e: 'close'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const handleClose = () => {
  emit('close')
}

const formatPopulation = (population: number): string => {
  if (population >= 10000) {
    return `${(population / 10000).toFixed(1)}万`
  }
  return population.toLocaleString()
}

// 时期代码到中文名称的映射
const periodMap: Record<string, string> = {
  han: '汉朝',
  tang: '唐朝',
  song: '宋朝',
  yuan: '元朝',
  ming: '明朝',
  qing: '清朝',
}

const getPeriodName = (period: string): string => {
  return periodMap[period] || period
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;
@use '@/assets/styles/mixins.scss' as *;

.city-info-panel {
  position: fixed;
  top: $spacing-lg;
  right: $spacing-lg;
  width: 400px;
  max-height: calc(100vh - #{$spacing-lg * 2});
  border-radius: $border-radius-xl;
  overflow: hidden;
  z-index: 50;
  display: flex;
  flex-direction: column;
  
  @include mobile {
    top: auto;
    bottom: 0;
    right: 0;
    left: 0;
    width: 100%;
    max-height: 80vh;
    border-radius: $border-radius-xl $border-radius-xl 0 0;
    border-bottom: none;
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: $spacing-lg $spacing-xl;
  background: linear-gradient(to bottom, rgba(255,255,255,0.05), transparent);
  border-bottom: 1px solid $border-color-light;
}

.city-name {
  .name-zh {
    display: block;
    font-size: $font-size-2xl;
    color: $color-gold;
    margin-bottom: $spacing-xs;
    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  }

  .name-en {
    display: block;
    font-size: $font-size-sm;
    color: $text-secondary;
    font-weight: $font-weight-normal;
    letter-spacing: 0.05em;
  }
}

.close-btn {
  padding: $spacing-xs;
  color: $text-tertiary;
  transition: color $transition-duration-fast;

  &:hover {
    color: $text-primary;
  }
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-lg $spacing-xl;
  
  // Hide scrollbar for cleaner look but keep functionality
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.1);
  }
}

.info-section {
  margin-bottom: $spacing-xl;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  font-size: $font-size-sm;
  color: $color-sand;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: $spacing-md;
  padding-bottom: $spacing-xs;
  border-bottom: 1px solid $border-color-light;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-md;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: $font-size-xs;
  color: $text-tertiary;
}

.info-value {
  font-size: $font-size-base;
  color: $text-primary;
  font-weight: $font-weight-medium;
}

.importance-stars {
  .star {
    color: $border-color-light;
    font-size: $font-size-base;
    margin-right: 2px;
    
    &.active {
      color: $color-gold;
    }
  }
}

.description {
  font-size: $font-size-base;
  color: $text-secondary;
  line-height: $line-height-loose;
  text-align: justify;
}

.tag-group {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
}

.tag {
  padding: 4px 12px;
  border-radius: $border-radius-full;
  font-size: $font-size-xs;
  border: 1px solid $border-color-light;
  background: rgba(255,255,255,0.03);
  color: $text-secondary;
  transition: all $transition-duration-fast;

  &:hover {
    border-color: $color-gold;
    color: $color-gold;
    background: rgba(226, 199, 146, 0.1);
  }
}

.period-tag {
  // Specific styles if needed
}

.trade-tag {
  border-color: rgba($color-terra, 0.3);
  &:hover {
    border-color: $color-terra;
    color: $color-terra;
    background: rgba($color-terra, 0.1);
  }
}

.site-tag {
  border-color: rgba($color-jade, 0.3);
  &:hover {
    border-color: $color-jade;
    color: $color-jade;
    background: rgba($color-jade, 0.1);
  }
}

.event-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.event-item {
  position: relative;
  padding-left: $spacing-lg;
  margin-bottom: $spacing-sm;
  font-size: $font-size-sm;
  color: $text-secondary;
  line-height: $line-height-base;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 8px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: $color-gold;
    box-shadow: 0 0 4px $color-gold;
  }
}

// Transitions
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
</style>
