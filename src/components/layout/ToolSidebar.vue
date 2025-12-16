<template>
  <aside class="tool-sidebar">
    <div class="sidebar-header">
      <div class="logo-icon">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2L2 7L12 12L22 7L12 2Z"
            stroke="#D4AF37"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M2 17L12 22L22 17"
            stroke="#D4AF37"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M2 12L12 17L22 12"
            stroke="#D4AF37"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
      <span class="logo-text">SilkRoad</span>
    </div>

    <nav class="sidebar-nav">
      <template v-for="item in navItems" :key="item.label">
        <RouterLink
          v-if="!item.children"
          :to="item.path!"
          class="nav-item"
          :class="{ active: currentPath === item.path }"
        >
          <component :is="item.icon" class="nav-icon" aria-hidden="true" />
          <span class="nav-label">{{ item.label }}</span>

          <!-- Active Indicator -->
          <div v-if="currentPath === item.path" class="active-indicator"></div>
        </RouterLink>

        <div v-else class="nav-group-container">
          <div
            class="nav-item group-header"
            :class="{ active: isGroupActive(item) }"
            @click="toggleGroup(item.label)"
          >
            <component :is="item.icon" class="nav-icon" aria-hidden="true" />
            <div class="label-row">
              <span class="nav-label">{{ item.label }}</span>
              <ChevronDownIcon
                class="group-arrow"
                :class="{ 'rotate-180': openGroups.includes(item.label) }"
              />
            </div>
          </div>

          <div v-show="openGroups.includes(item.label)" class="group-children">
            <RouterLink
              v-for="child in item.children"
              :key="child.path"
              :to="child.path!"
              class="nav-item child-item"
              :class="{ active: currentPath === child.path }"
            >
              <component :is="child.icon" class="nav-icon small" aria-hidden="true" />
              <span class="nav-label">{{ child.label }}</span>
              <div v-if="currentPath === child.path" class="active-indicator"></div>
            </RouterLink>
          </div>
        </div>
      </template>
    </nav>

    <div class="sidebar-footer">
      <!-- Placeholder for future settings or profile -->
      <button 
        class="gesture-toggle-btn" 
        :class="{ active: gestureStore.isCameraOpen }"
        @click="gestureStore.toggleCamera"
        title="手势控制"
      >
        <span class="icon">👋</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useGestureStore } from '@/stores/gesture'
import {
  GlobeAltIcon,
  ChartBarIcon,
  // BuildingLibraryIcon,
  ChevronDownIcon,
} from '@heroicons/vue/24/outline'
import TransportRoutesIcon from '@/components/icons/TransportRoutesIcon.vue'
import HanMingTransportIcon from '@/components/icons/HanMingTransportIcon.vue'
import LiangHanTransportIcon from '@/components/icons/LiangHanTransportIcon.vue'

const gestureStore = useGestureStore()

interface NavItem {
  label: string
  path?: string
  icon: any
  children?: NavItem[]
}

const navItems: NavItem[] = [
  {
    label: '地球探索',
    path: '/',
    icon: GlobeAltIcon,
  },
  {
    label: '贸易图表',
    path: '/trade',
    icon: ChartBarIcon,
  },
  {
    label: '交通路线',
    icon: TransportRoutesIcon,
    children: [
      {
        label: '唐代交通',
        path: '/transport',
        icon: HanMingTransportIcon,
      },
      {
        label: '两汉交通',
        path: '/lianghan',
        icon: HanMingTransportIcon,
      },
      {
        label: '蒙元路线',
        path: '/mengyuan',
        icon: LiangHanTransportIcon,
      },
    ],
  },
  {
    label: '明清城区',
    path: '/mingqing',
    icon: LiangHanTransportIcon,
  },
]

const route = useRoute()
const currentPath = computed(() => route.path)

const openGroups = ref<string[]>([])

const toggleGroup = (label: string) => {
  const index = openGroups.value.indexOf(label)
  if (index === -1) {
    openGroups.value.push(label)
  } else {
    openGroups.value.splice(index, 1)
  }
}

const isGroupActive = (item: NavItem) => {
  if (!item.children) return false
  return item.children.some(child => child.path === currentPath.value)
}

// Initialize openGroups
navItems.forEach(item => {
  if (isGroupActive(item)) {
    openGroups.value.push(item.label)
  }
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;
@use '@/assets/styles/mixins.scss' as *;

.tool-sidebar {
  width: $sidebar-width;
  height: 100vh;
  background: rgba(5, 8, 15, 0.85);
  border-right: 1px solid $border-color-light;
  backdrop-filter: $backdrop-blur-lg;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-lg 0;
  z-index: 100;
  transition: width $transition-duration-base;
}

.sidebar-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xs;
  margin-bottom: $spacing-2xl;
  color: $color-gold;
}

.logo-icon {
  filter: drop-shadow(0 0 8px rgba(212, 175, 55, 0.3));
}

.logo-text {
  font-family: $font-family-serif;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.9;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  width: 100%;
  padding: 0 $spacing-sm;
  box-sizing: border-box;
}

.nav-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 64px;
  border-radius: $border-radius-lg;
  color: $text-secondary;
  transition: all $transition-duration-fast;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: $text-primary;

    .nav-icon {
      transform: translateY(-2px);
    }
  }

  &.active {
    color: $color-gold;
    background: rgba(212, 175, 55, 0.1);

    .nav-icon {
      filter: drop-shadow(0 0 5px rgba(212, 175, 55, 0.4));
    }
  }
}

.nav-icon {
  width: 24px;
  height: 24px;
  margin-bottom: 4px;
  transition: transform $transition-duration-fast;
}

.nav-label {
  font-size: 10px;
  font-weight: $font-weight-medium;
}

.active-indicator {
  position: absolute;
  left: -8px; // Outside the padding
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 24px;
  background: $color-gold;
  border-radius: 0 2px 2px 0;
  box-shadow: 0 0 8px rgba(212, 175, 55, 0.6);
}

.nav-group-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.group-header {
  cursor: pointer;
}

.label-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.group-arrow {
  width: 12px;
  height: 12px;
  transition: transform 0.3s ease;
}

.rotate-180 {
  transform: rotate(180deg);
}

.group-children {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  background: rgba(0, 0, 0, 0.2);
  border-radius: $border-radius-lg;
  padding: $spacing-xs 0;
}

.child-item {
  height: 48px;
  background: transparent;

  .nav-icon.small {
    width: 20px;
    height: 20px;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.03);
  }
}

.sidebar-footer {
  padding: $spacing-md;
  border-top: 1px solid rgba($color-gold, 0.1);
  display: flex;
  justify-content: center;
}

.gesture-toggle-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba($color-gold, 0.3);
  color: $text-primary;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba($color-gold, 0.2);
    border-color: $color-gold;
  }
  
  &.active {
    background: $color-gold;
    color: $bg-primary;
    box-shadow: 0 0 10px rgba($color-gold, 0.5);
  }
  
  .icon {
    font-size: 1.2rem;
  }
}

@include mobile {
  .tool-sidebar {
    width: 100%;
    height: 64px;
    flex-direction: row;
    justify-content: space-between;
    padding: 0 $spacing-md;
    border-right: none;
    border-top: 1px solid $border-color-light;
    position: fixed;
    bottom: 0;
    top: auto;
  }

  .sidebar-header,
  .sidebar-footer {
    display: none;
  }

  .sidebar-nav {
    flex-direction: row;
    justify-content: space-around;
    padding: 0;
  }

  .nav-item {
    height: 48px;
    width: auto;
    flex: 1;
    border-radius: $border-radius-base;

    &:hover {
      background: transparent;
    }
  }

  .active-indicator {
    display: none;
  }

  .nav-item.active {
    background: transparent;
    color: $color-gold;

    &::after {
      content: '';
      position: absolute;
      top: -8px; // Top border for mobile
      left: 50%;
      transform: translateX(-50%);
      width: 24px;
      height: 3px;
      background: $color-gold;
      border-radius: 0 0 2px 2px;
      box-shadow: 0 0 8px rgba(212, 175, 55, 0.6);
    }
  }
}
</style>
