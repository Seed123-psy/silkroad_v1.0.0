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
    path: '/lianghan',
    name: 'LiangHan',
    component: () => import('@/views/LiangHan.vue'),
  },
  {
    path: '/mengyuan',
    name: 'MengYuan',
    component: () => import('@/views/MengYuanRoutes.vue'),
  },
  {
    path: '/mingqing',
    name: 'MingQing',
    component: () => import('@/views/MingQing.vue'),
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('@/views/Chat.vue'),
  },
  {
    path: '/architecture',
    name: 'Architecture',
    component: () => import('@/views/ArchitectureParticles.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
