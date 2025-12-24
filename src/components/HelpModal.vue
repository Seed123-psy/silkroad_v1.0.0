<template>
  <transition name="modal-fade">
    <div v-if="isOpen" class="modal-overlay" @click="close">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ t.help.title }}</h2>
          <button class="close-btn" @click="close">×</button>
        </div>
        
        <div class="modal-body">
          <section class="guide-section">
            <h3>{{ t.help.keyboard.title }}</h3>
            <div class="key-groups">
              <div class="key-group">
                <div class="key-row">
                  <span class="key">W</span>
                  <span class="key">S</span>
                </div>
                <span class="desc">{{ t.help.keyboard.move }}</span>
              </div>
              <div class="key-group">
                <div class="key-row">
                  <span class="key">A</span>
                  <span class="key">D</span>
                </div>
                <span class="desc">{{ t.help.keyboard.strafe }}</span>
              </div>
              <div class="key-group">
                <div class="key-row">
                  <span class="key">Q</span>
                  <span class="key">E</span>
                </div>
                <span class="desc">{{ t.help.keyboard.elevation }}</span>
              </div>
              <div class="key-group">
                <div class="key-row">
                  <span class="key">↑</span>
                  <span class="key">↓</span>
                  <span class="key">←</span>
                  <span class="key">→</span>
                </div>
                <span class="desc">{{ t.help.keyboard.rotate }}</span>
              </div>
            </div>
          </section>

          <section class="guide-section">
            <h3>{{ t.help.gestures.title }}</h3>
            <ul class="feature-list">
              <li v-for="(item, index) in t.help.gestures.items" :key="index">
                <strong>{{ item.label }}</strong>：{{ item.desc }}
              </li>
            </ul>
          </section>

          <section class="guide-section">
            <h3>{{ t.help.routes.title }}</h3>
            <ul class="feature-list">
              <li v-for="(item, index) in t.help.routes.items" :key="index">
                <strong>{{ item.label }}</strong>：{{ item.desc }}
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
// no direct Vue imports needed here
import { useI18n } from '@/composables/useI18n'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits(['close'])
const { t } = useI18n()

const close = () => {
  emit('close')
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba($color-ink, 0.75);
  backdrop-filter: $backdrop-blur-md;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: $bg-glass;
  backdrop-filter: $backdrop-blur-xl;
  border: 1px solid $border-color-medium;
  border-radius: $border-radius-xl;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: $box-shadow-xl, $box-shadow-gold-soft;
  color: $text-primary;

  // 顶部金线装饰
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 60%;
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      $color-gold 50%,
      transparent 100%
    );
    border-radius: 0 0 2px 2px;
  }
}

.modal-header {
  padding: $spacing-lg $spacing-xl;
  border-bottom: 1px solid $border-color-medium;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    margin: 0;
    font-family: $font-family-serif;
    font-size: $font-size-2xl;
    font-weight: $font-weight-semibold;
    color: $color-gold;
    letter-spacing: $letter-spacing-wide;
  }

  .close-btn {
    background: none;
    border: none;
    color: $text-tertiary;
    font-size: $font-size-2xl;
    cursor: pointer;
    line-height: 1;
    padding: 0;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $border-radius-base;
    transition: all $transition-duration-base $ease-ancient;

    &:hover {
      color: $color-gold;
      background: rgba(212, 175, 55, 0.1);
      transform: rotate(90deg);
    }
  }
}

.modal-body {
  padding: $spacing-xl;
}

.guide-section {
  margin-bottom: $spacing-2xl;

  &:last-child {
    margin-bottom: 0;
  }

  h3 {
    font-family: $font-family-serif;
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $info-color;
    margin-bottom: $spacing-md;
    border-left: 3px solid $info-color;
    padding-left: $spacing-md;
  }
}

.key-groups {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-md;
  justify-content: center;
}

.key-group {
  background: $gradient-card-subtle;
  border: 1px solid $border-color;
  padding: $spacing-md;
  border-radius: $border-radius-lg;
  text-align: center;
  flex: 1 0 auto;
  min-width: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all $transition-duration-base $ease-ancient;

  &:hover {
    background: rgba(212, 175, 55, 0.08);
    border-color: $border-color-medium;
    transform: translateY(-2px);
    box-shadow: $box-shadow-gold-subtle;
  }

  .key-row {
    display: flex;
    justify-content: center;
    gap: $spacing-sm;
    margin-bottom: $spacing-sm;
  }

  .key {
    display: inline-block;
    min-width: 24px;
    height: 24px;
    padding: 0 6px;
    border: 1px solid $border-color-medium;
    border-radius: $border-radius-sm;
    font-family: $font-family-code;
    font-weight: $font-weight-semibold;
    font-size: $font-size-xs;
    line-height: 22px;
    background: $bg-tertiary;
    color: $color-gold;
    box-shadow: $box-shadow-inset-subtle;
  }

  .desc {
    font-size: $font-size-sm;
    color: $text-tertiary;
  }
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;

  li {
    margin-bottom: $spacing-md;
    padding-left: $spacing-lg;
    position: relative;
    color: $text-secondary;
    line-height: $line-height-relaxed;

    &::before {
      content: "◆";
      color: $color-gold;
      position: absolute;
      left: 0;
      font-size: $font-size-xs;
      top: 2px;
    }

    strong {
      color: $color-gold;
      font-weight: $font-weight-medium;
    }
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity $transition-duration-slow $ease-ancient-out;

  .modal-content {
    transition: transform $transition-duration-base $ease-elastic;
  }
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;

  .modal-content {
    transform: scale(0.95) translateY(20px);
  }
}
</style>