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
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: #1a1d24;
  border: 1px solid rgba(226, 199, 146, 0.3);
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  color: #f0f6fc;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h2 {
    margin: 0;
    font-size: 1.5rem;
    color: #e2c792;
  }
  
  .close-btn {
    background: none;
    border: none;
    color: #8b949e;
    font-size: 2rem;
    cursor: pointer;
    line-height: 1;
    padding: 0;
    
    &:hover {
      color: #fff;
    }
  }
}

.modal-body {
  padding: 24px;
}

.guide-section {
  margin-bottom: 32px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  h3 {
    font-size: 1.1rem;
    color: #58a6ff;
    margin-bottom: 16px;
    border-left: 3px solid #58a6ff;
    padding-left: 10px;
  }
}

.key-groups {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
}

.key-group {
  background: rgba(255, 255, 255, 0.05);
  padding: 16px;
  border-radius: 12px;
  text-align: center;
  flex: 1 0 auto;
  min-width: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: background 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .key-row {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-bottom: 8px;
  }
  
  .key {
    display: inline-block;
    min-width: 24px;
    height: 24px;
    padding: 0 6px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 4px;
    font-family: monospace;
    font-weight: bold;
    line-height: 22px;
    background: rgba(0, 0, 0, 0.3);
    color: #e2c792;
  }
  
  .desc {
    font-size: 0.85rem;
    color: #8b949e;
  }
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
  
  li {
    margin-bottom: 12px;
    padding-left: 20px;
    position: relative;
    color: #d0d7de;
    
    &::before {
      content: "•";
      color: #e2c792;
      position: absolute;
      left: 0;
      font-weight: bold;
    }
    
    strong {
      color: #e2c792;
    }
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
  
  .modal-content {
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  
  .modal-content {
    transform: scale(0.9) translateY(20px);
  }
}
</style>