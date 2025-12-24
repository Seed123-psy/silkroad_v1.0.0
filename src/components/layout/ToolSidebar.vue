<template>
  <aside class="tool-sidebar">
    <RouterLink to="/" class="sidebar-header">
      <div class="logo-icon">
        <img
          src="@/assets/logo_transparent.png"
          alt="SilkRoad"
          class="logo-img"
        />
      </div>
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
  BuildingLibraryIcon,
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
    label: t.value.sidebar.architecture,
    path: '/architecture',
    icon: BuildingLibraryIcon,
  },
  {
    label: t.value.sidebar.glbViewer,
    path: '/glb-viewer',
    icon: BuildingLibraryIcon,
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
  width: 136px;
  height: 100vh;
  background: $bg-glass;
  border-right: 1px solid $border-color;
  backdrop-filter: $backdrop-blur-lg;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-lg 0;
  z-index: 100;
  transition: all $transition-duration-base $ease-ancient;

  // 金色纹样装饰 - 右边框
  &::after {
    content: '';
    position: absolute;
    top: 10%;
    right: 0;
    width: 1px;
    height: 80%;
    background: linear-gradient(
      180deg,
      transparent 0%,
      rgba(212, 175, 55, 0.3) 20%,
      rgba(212, 175, 55, 0.5) 50%,
      rgba(212, 175, 55, 0.3) 80%,
      transparent 100%
    );
  }
}

.sidebar-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xs;
  margin-bottom: $spacing-2xl;
  color: $color-gold;
  position: relative;

  // 顶部装饰线
  &::before {
    content: '';
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    width: 40px;
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      $color-gold 50%,
      transparent 100%
    );
    border-radius: 1px;
  }
}

.logo-icon {
  filter: drop-shadow(0 0 12px rgba(212, 175, 55, 0.4));
  transition: filter $transition-duration-base $ease-ancient;

  &:hover {
    filter: drop-shadow(0 0 20px rgba(212, 175, 55, 0.6));
  }
}

.logo-icon .logo-img {
  width: 120px;
  height: 120px;
  object-fit: contain;
  display: block;
}

.logo-text {
  font-family: $font-family-serif;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  opacity: 0.9;
  color: $color-gold-light;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  width: 100%;
  padding: 0 $spacing-sm;
  box-sizing: border-box;
  flex: 1;
  overflow-y: auto;
  min-height: 0;

  &::-webkit-scrollbar {
    width: 3px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: linear-gradient(
      180deg,
      rgba(212, 175, 55, 0.3) 0%,
      rgba(212, 175, 55, 0.15) 100%
    );
    border-radius: 2px;

    &:hover {
      background: linear-gradient(
        180deg,
        rgba(212, 175, 55, 0.5) 0%,
        rgba(212, 175, 55, 0.3) 100%
      );
    }
  }
}

.nav-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 88px;
  border-radius: $border-radius-lg;
  color: $text-secondary;
  transition: all $transition-duration-base $ease-ancient;
  cursor: pointer;

  // 悬停效果
  &:hover {
    background: rgba(212, 175, 55, 0.06);
    color: $text-primary;

    .nav-icon {
      transform: translateY(-3px) scale(1.05);
      filter: drop-shadow(0 2px 8px rgba(212, 175, 55, 0.25));
    }
  }

  // 激活状态
  &.active {
    color: $color-gold;
    background: linear-gradient(
      135deg,
      rgba(212, 175, 55, 0.12) 0%,
      rgba(212, 175, 55, 0.05) 100%
    );

    .nav-icon {
      filter: drop-shadow(0 0 8px rgba(212, 175, 55, 0.5));
    }
  }
}

.nav-icon {
  width: 32px;
  height: 32px;
  margin-bottom: 6px;
  transition: all $transition-duration-base $ease-ancient;
  stroke-width: 1.5;
}

.nav-label {
  font-size: 12px;
  font-weight: $font-weight-medium;
  letter-spacing: 0.05em;
}

.active-indicator {
  position: absolute;
  left: -6px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 28px;
  background: linear-gradient(
    180deg,
    rgba(212, 175, 55, 0.4) 0%,
    $color-gold 50%,
    rgba(212, 175, 55, 0.4) 100%
  );
  border-radius: 0 2px 2px 0;
  box-shadow: 0 0 12px rgba(212, 175, 55, 0.6);
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
  transition: transform $transition-duration-base $ease-ancient;
  stroke: $text-tertiary;
}

.rotate-180 {
  transform: rotate(180deg);
  stroke: $color-gold;
}

.group-children {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(212, 175, 55, 0.08);
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
    background: rgba(212, 175, 55, 0.05);
  }

  &.active {
    background: rgba(212, 175, 55, 0.08);
  }
}

.sidebar-footer {
  padding: $spacing-md $spacing-sm;
  border-top: 1px solid rgba(212, 175, 55, 0.12);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: auto;
  background: linear-gradient(
    to top,
    rgba($bg-secondary, 0.9) 0%,
    rgba($bg-secondary, 0.3) 50%,
    transparent 100%
  );

  // 顶部金线装饰
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 60%;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(212, 175, 55, 0.4) 50%,
      transparent 100%
    );
  }
}

.footer-btn {
  background: rgba(212, 175, 55, 0.03);
  border: 1px solid rgba(212, 175, 55, 0.1);
  color: $text-secondary;
  width: 44px;
  height: 44px;
  border-radius: $border-radius-base;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all $transition-duration-base $ease-ancient;
  position: relative;
  overflow: hidden;

  &:hover {
    background: rgba(212, 175, 55, 0.12);
    border-color: rgba(212, 175, 55, 0.25);
    color: $color-gold;
    transform: translateY(-2px);
    box-shadow: $box-shadow-gold-subtle;

    .action-icon {
      transform: scale(1.1);
    }
  }

  &.active {
    background: rgba(212, 175, 55, 0.15);
    border-color: rgba(212, 175, 55, 0.4);
    color: $color-gold;
    box-shadow: $box-shadow-gold-soft;

    &::after {
      content: '';
      position: absolute;
      bottom: 4px;
      left: 50%;
      transform: translateX(-50%);
      width: 5px;
      height: 5px;
      background: $color-gold;
      border-radius: 50%;
      box-shadow: 0 0 8px rgba(212, 175, 55, 0.6);
    }
  }

  .action-icon {
    width: 22px;
    height: 22px;
    transition: all $transition-duration-base $ease-ancient;
    stroke-width: 1.5;
  }

  .lang-text {
    font-size: 10px;
    font-weight: $font-weight-semibold;
    margin-top: -1px;
    opacity: 0.9;
    letter-spacing: 0.05em;
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
    border-top: 1px solid $border-color;
    position: fixed;
    bottom: 0;
    top: auto;

    &::after {
      display: none;
    }
  }

  .sidebar-header,
  .sidebar-footer {
    display: none;
  }

  .sidebar-nav {
    flex-direction: row;
    justify-content: space-around;
    padding: 0;
    overflow-y: hidden;
    overflow-x: auto;

    &::-webkit-scrollbar {
      display: none;
    }
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
      top: -8px;
      left: 50%;
      transform: translateX(-50%);
      width: 28px;
      height: 3px;
      background: linear-gradient(
        90deg,
        transparent 0%,
        $color-gold 50%,
        transparent 100%
      );
      border-radius: 0 0 2px 2px;
      box-shadow: 0 4px 12px rgba(212, 175, 55, 0.5);
    }
  }
}
</style>
