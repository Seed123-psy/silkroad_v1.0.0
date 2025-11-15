<template>
  <aside class="tool-sidebar">
    <div class="sidebar-header">
      <span class="logo">SilkRoad</span>
    </div>
    <nav class="sidebar-nav">
      <RouterLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ active: currentPath === item.path }"
      >
        <span class="nav-icon" aria-hidden="true">{{ item.icon }}</span>
        <span class="nav-label">{{ item.label }}</span>
      </RouterLink>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

interface NavItem {
  label: string
  path: string
  icon: string
}

const navItems: NavItem[] = [
  {
    label: '地球探索',
    path: '/',
    icon: '🌍',
  },
  {
    label: '贸易图表',
    path: '/trade',
    icon: '📊',
  },
  {
    label: '唐代交通',
    path: '/transport',
    icon: '🧭',
  },
    {
      label: '明清城区',
      path: '/mingqing',
      icon: '🏙️',
    },
]

const route = useRoute()

const currentPath = computed(() => route.path)
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;
@use '@/assets/styles/mixins.scss' as *;

.tool-sidebar {
  width: 80px;
  height: 100vh;
  background: rgba(10, 15, 30, 0.85);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(18px);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-lg $spacing-sm;
  gap: $spacing-lg;
  box-sizing: border-box;
}

.sidebar-header {
  color: $text-inverse;
  font-weight: $font-weight-semibold;
  font-size: $font-size-sm;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-align: center;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  width: 100%;
  align-items: center;
}

.nav-item {
  width: 100%;
  padding: $spacing-sm $spacing-xs;
  border-radius: $border-radius-lg;
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  font-size: $font-size-xs;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xs;
  transition:
    background $transition-duration-fast $transition-timing-function,
    color $transition-duration-fast $transition-timing-function,
    transform $transition-duration-fast $transition-timing-function;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: $text-inverse;
    transform: translateY(-2px);
  }
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.18);
  color: $text-inverse;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.nav-icon {
  font-size: 20px;
  line-height: 1;
}

.nav-label {
  font-size: 12px;
}

@include mobile {
  .tool-sidebar {
    width: 100%;
    height: 64px;
    flex-direction: row;
    justify-content: center;
    padding: $spacing-sm $spacing-md;
  }

  .sidebar-nav {
    flex-direction: row;
    justify-content: center;
    gap: $spacing-lg;
  }

  .nav-item {
    flex-direction: row;
    padding: $spacing-xs $spacing-md;
  }

  .nav-icon {
    font-size: 18px;
  }

  .nav-label {
    font-size: 13px;
  }
}
</style>
