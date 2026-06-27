import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

/**
 * 路由 meta 类型扩展
 */
declare module 'vue-router' {
  interface RouteMeta {
    /** 需要登录才能访问 */
    requiresAuth?: boolean
    /** 仅游客可访问（登录后禁止） */
    guestOnly?: boolean
    /** 页面是否全宽（取消 MainLayout 的 padding + max-width） */
    fullWidth?: boolean
    /** 隐藏登录/注册/个人中心等入口（分享页等公共页面） */
    hideAuth?: boolean
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/Home.vue'),
    meta: { fullWidth: true },
  },
  {
    path: '/components',
    name: 'components',
    component: () => import('@/views/Components.vue'),
  },
  {
    path: '/scan',
    name: 'scan',
    component: () => import('@/views/Scan.vue'),
  },
  {
    path: '/scan/processing',
    name: 'scan-processing',
    component: () => import('@/views/ScanProcessing.vue'),
    meta: { fullWidth: true },
  },
  {
    path: '/result/:id',
    name: 'result',
    component: () => import('@/views/ScanResult.vue'),
    props: true,
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/Login.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/Register.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/history',
    name: 'history',
    component: () => import('@/views/History.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/Profile.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/share/:id',
    name: 'share',
    component: () => import('@/views/Share.vue'),
    props: true,
    meta: { hideAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

/**
 * 全局前置守卫
 * - requiresAuth: 未登录跳转登录页
 * - guestOnly: 已登录用户禁止访问
 */
router.beforeEach((to, _from) => {
  const userStore = useUserStore()

  // 需要登录的页面
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // 仅游客可访问的页面（登录/注册）
  if (to.meta.guestOnly && userStore.isLoggedIn) {
    return { name: 'home' }
  }

  return true
})

export default router
