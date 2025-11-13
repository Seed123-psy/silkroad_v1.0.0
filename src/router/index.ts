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
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
