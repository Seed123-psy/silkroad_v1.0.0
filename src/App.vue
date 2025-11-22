<template>
  <div class="app-shell">
    <ToolSidebar class="app-sidebar" />
    <main class="app-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import ToolSidebar from '@/components/layout/ToolSidebar.vue'
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
