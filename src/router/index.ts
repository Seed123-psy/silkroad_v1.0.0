import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
  },
  {
    path: '/trade',
    name: 'Trade',
    component: () => import('@/views/Trade.vue'),
  },
  {
    path: '/transport',
    name: 'Transport',
    component: () => import('@/views/Transport.vue'),
  },
  {
    path: '/mingqing',
    name: 'MingQing',
    component: () => import('@/views/MingQing.vue'),
  },
  {
    path: '/silkroad',
    name: 'Silkroad',
    component: () => import('@/views/DamingPalace.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
