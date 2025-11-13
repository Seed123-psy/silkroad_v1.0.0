<template>
  <Transition name="slide-fade">
    <div v-if="city" class="city-info-panel">
      <div class="panel-header">
        <h2 class="city-name">
          <span class="name-zh">{{ city.name }}</span>
          <span class="name-en">{{ city.nameEn }}</span>
        </h2>
        <button class="close-btn" aria-label="关闭" @click="handleClose">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
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
                  >
                    ★
                  </span>
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
          <div class="period-tags">
            <span v-for="period in city.period" :key="period" class="tag period-tag">
              {{ getPeriodName(period) }}
            </span>
          </div>
        </section>

        <!-- 贸易商品 -->
        <section v-if="city.tradeItems && city.tradeItems.length > 0" class="info-section">
          <h3 class="section-title">主要贸易商品</h3>
          <div class="trade-tags">
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
          <div class="site-tags">
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
@use '@/assets/styles/variables.scss' as *;
@use '@/assets/styles/mixins.scss' as *;

.city-info-panel {
  position: fixed;
  top: $spacing-xl;
  right: $spacing-xl;
  width: 380px;
  max-height: calc(100vh - #{$spacing-xl * 2});
  background: rgba(255, 255, 255, 0.1); // 纯白色半透明
  backdrop-filter: blur(24px) saturate(180%); // 强毛玻璃效果
  -webkit-backdrop-filter: blur(24px) saturate(180%); // Safari支持
  border: 1px solid rgba(255, 255, 255, 0.18); // 白色边框
  border-radius: $border-radius-xl;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37); // 柔和阴影
  overflow: hidden;
  z-index: 100;

  @include mobile {
    top: $spacing-md;
    right: $spacing-md;
    left: $spacing-md;
    width: auto;
    max-height: calc(100vh - #{$spacing-md * 2});
  }
}

.panel-header {
  @include flex-between;
  padding: $spacing-lg $spacing-xl;
  background: rgba(255, 255, 255, 0.05); // 纯半透明
  color: $text-inverse;
  border-bottom: 1px solid rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(10px);
}

.city-name {
  margin: 0;
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  line-height: $line-height-tight;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3); // 文字阴影增强可读性

  .name-zh {
    display: block;
    margin-bottom: $spacing-xs;
  }

  .name-en {
    display: block;
    font-size: $font-size-sm;
    font-weight: $font-weight-normal;
    opacity: 0.95;
  }
}

.close-btn {
  @include button-base;
  padding: $spacing-xs;
  background: rgba(255, 255, 255, 0.2);
  color: $text-inverse;
  border-radius: $border-radius-base;
  @include transition(background);

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  svg {
    display: block;
  }
}

.panel-content {
  padding: $spacing-lg $spacing-xl;
  max-height: calc(100vh - #{$spacing-xl * 2} - 100px);
  overflow-y: auto;
  @include scrollbar(6px, transparent, rgba(255, 255, 255, 0.2));

  @include mobile {
    max-height: calc(100vh - #{$spacing-md * 2} - 100px);
    padding: $spacing-md;
  }
}

.info-section {
  margin-bottom: $spacing-lg;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  margin: 0 0 $spacing-md 0;
  font-size: $font-size-base;
  font-weight: $font-weight-semibold;
  color: rgba(255, 255, 255, 0.95); // 白色文字
  border-bottom: 2px solid rgba(255, 255, 255, 0.3); // 半透明白色边框
  padding-bottom: $spacing-xs;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-md;
}

.info-item {
  @include flex-column;
  gap: $spacing-xs;
}

.info-label {
  font-size: $font-size-xs;
  color: rgba(255, 255, 255, 0.6); // 半透明白色
  font-weight: $font-weight-medium;
}

.info-value {
  font-size: $font-size-base;
  color: rgba(255, 255, 255, 0.95); // 白色
  font-weight: $font-weight-semibold;
}

.importance-stars {
  display: inline-flex;
  gap: 2px;

  .star {
    color: $border-color;
    font-size: $font-size-lg;
    @include transition(color);

    &.active {
      color: $warning-color;
    }
  }
}

.description {
  margin: 0;
  font-size: $font-size-sm;
  line-height: $line-height-loose;
  color: rgba(255, 255, 255, 0.8); // 半透明白色
}

.period-tags,
.trade-tags,
.site-tags {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
}

.event-list {
  margin: 0;
  padding-left: $spacing-lg;
  list-style: none;
}

.event-item {
  position: relative;
  font-size: $font-size-sm;
  line-height: $line-height-loose;
  color: rgba(255, 255, 255, 0.8); // 半透明白色
  margin-bottom: $spacing-sm;
  padding-left: $spacing-md;

  &::before {
    content: '•';
    position: absolute;
    left: 0;
    color: rgba(255, 255, 255, 0.6); // 半透明白色
    font-weight: $font-weight-bold;
  }

  &:last-child {
    margin-bottom: 0;
  }
}

.tag {
  display: inline-block;
  padding: $spacing-xs $spacing-md;
  border-radius: $border-radius-xl;
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  @include transition(transform);

  &:hover {
    transform: translateY(-2px);
  }
}

.period-tag {
  background: rgba(255, 255, 255, 0.15); // 纯半透明
  color: $text-inverse;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.trade-tag {
  background: rgba(255, 255, 255, 0.15); // 纯半透明
  color: $text-inverse;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.site-tag {
  background: rgba(255, 255, 255, 0.15); // 纯半透明
  color: $text-inverse;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

// 过渡动画
.slide-fade-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 1, 1);
}

.slide-fade-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
