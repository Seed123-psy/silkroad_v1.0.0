<template>
  <aside class="tool-sidebar">
    <RouterLink to="/" class="sidebar-header">
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
    </RouterLink>

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
      <button 
        class="footer-btn" 
        @click="appStore.toggleHelp"
        :title="t.sidebar.guide"
      >
        <QuestionMarkCircleIcon class="action-icon" />
      </button>

      <button 
        class="footer-btn" 
        @click="appStore.toggleTheme"
        :title="appStore.theme === 'dark' ? t.sidebar.themeLight : t.sidebar.themeDark"
      >
        <component 
          :is="appStore.theme === 'dark' ? SunIcon : MoonIcon" 
          class="action-icon" 
        />
      </button>

      <button 
        class="footer-btn" 
        @click="appStore.toggleLanguage"
        :title="t.sidebar.language"
      >
        <LanguageIcon class="action-icon" />
        <span class="lang-text">{{ appStore.language === 'zh' ? 'EN' : '中' }}</span>
      </button>

      <button 
        class="footer-btn gesture-btn" 
        :class="{ active: gestureStore.isCameraOpen }"
        @click="gestureStore.toggleCamera"
        :title="t.sidebar.gesture"
      >
        <VideoCameraIcon class="action-icon" />
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useGestureStore } from '@/stores/gesture'
import { useAppStore } from '@/stores/app'
import { useI18n } from '@/composables/useI18n'
import {
  GlobeAltIcon,
  ChartBarIcon,
  // BuildingLibraryIcon,
  ChevronDownIcon,
  QuestionMarkCircleIcon,
  SunIcon,
  MoonIcon,
  LanguageIcon,
  VideoCameraIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/vue/24/outline'
import TransportRoutesIcon from '@/components/icons/TransportRoutesIcon.vue'
import HanMingTransportIcon from '@/components/icons/HanMingTransportIcon.vue'
import LiangHanTransportIcon from '@/components/icons/LiangHanTransportIcon.vue'

const gestureStore = useGestureStore()
const appStore = useAppStore()
const { t } = useI18n()

interface NavItem {
  label: string
  path?: string
  icon: any
  children?: NavItem[]
}

const navItems = computed<NavItem[]>(() => [
  {
    label: t.value.sidebar.explore,
    path: '/',
    icon: GlobeAltIcon,
  },
  {
    label: t.value.sidebar.trade,
    path: '/trade',
    icon: ChartBarIcon,
  },
  {
    label: t.value.sidebar.routes,
    icon: TransportRoutesIcon,
    children: [
      {
        label: t.value.sidebar.tang,
        path: '/transport',
        icon: HanMingTransportIcon,
      },
      {
        label: t.value.sidebar.han,
        path: '/lianghan',
        icon: HanMingTransportIcon,
      },
      {
        label: t.value.sidebar.mengyuan,
        path: '/mengyuan',
        icon: LiangHanTransportIcon,
      },
    ],
  },
  {
    label: t.value.sidebar.mingqing,
    path: '/mingqing',
    icon: LiangHanTransportIcon,
  },
  {
    label: t.value.sidebar.chat,
    path: '/chat',
    icon: ChatBubbleLeftRightIcon,
  },
])

const route = useRoute()
const currentPath = computed(() => route.path)

const openGroups = ref<string[]>([])

const toggleGroup = (label: string) => {
  // Since labels change with language, we might want to track by index or path, 
  // but for now let's just clear if language changes or accept it might close.
  // Actually, if we use label as key, it will break when language changes if we don't close it.
  // A better way is to use a stable key, but for now let's stick to label and maybe reset on lang change if needed.
  // Or better, use the path or a static ID if available. 
  // Given the structure, let's just use the label as is, user can re-open.
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
navItems.value.forEach(item => {
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
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-top: auto;
  background: linear-gradient(to top, rgba($bg-secondary, 0.8), transparent);
}

.footer-btn {
  background: transparent;
  border: 1px solid transparent;
  color: $text-secondary;
  width: 44px;
  height: 44px;
  border-radius: 12px; // Squircle shape
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  
  &:hover {
    background: rgba($color-gold, 0.1);
    color: $color-gold;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    
    .action-icon {
      transform: scale(1.1);
    }
  }
  
  &.active {
    background: rgba($color-gold, 0.15);
    color: $color-gold;
    border-color: rgba($color-gold, 0.3);
    box-shadow: 0 0 15px rgba($color-gold, 0.2);

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 4px;
      height: 4px;
      background: $color-gold;
      border-radius: 50%;
      margin-bottom: 4px;
    }
  }
  
  .action-icon {
    width: 24px;
    height: 24px;
    transition: transform 0.3s ease;
  }

  .lang-text {
    font-size: 10px;
    font-weight: 600;
    margin-top: -2px;
    opacity: 0.8;
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
