<template>
  <div class="app-shell">
    <ToolSidebar v-if="!route.meta.hideSidebar" class="app-sidebar" />
    <main class="app-content">
      <router-view />
    </main>
    <GlobalGestureCursor />
    <HelpModal :is-open="appStore.showHelp" @close="appStore.toggleHelp" />
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import ToolSidebar from '@/components/layout/ToolSidebar.vue'
import GlobalGestureCursor from '@/components/GlobalGestureCursor.vue'
import HelpModal from '@/components/HelpModal.vue'
import { useGlobalGesture } from '@/composables/useGlobalGesture'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const appStore = useAppStore()

// 初始化全局手势控制
useGlobalGesture()
</script>

<style scoped lang="scss">
.app-shell {
  display: flex;
  width: 100%;
  height: 100%;
  // background handled in global.scss
  color: #fff;
}

.app-sidebar {
  flex-shrink: 0;
}

.app-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

@media (max-width: 768px) {
  .app-shell {
    flex-direction: column;
  }

  .app-content {
    height: calc(100% - 64px);
  }
}
</style>
