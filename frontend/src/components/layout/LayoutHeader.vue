<script setup lang="ts">
/**
 * LayoutHeader - 新野兽派顶部导航栏
 *
 * 黑色背景，金色文字，底部 3px 金色粗边框
 * 左侧品牌标识 + 标题，中间导航菜单，右侧用户状态/操作
 */
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { toast } = useToast()

// 导航菜单项
const navItems = [
  { name: 'home', label: '首页', path: '/' },
  { name: 'scan', label: '扫描', path: '/scan' },
  { name: 'history', label: '历史', path: '/history' },
]

// 当前激活的导航项
const activeNav = computed(() => route.name as string)

/** 隐藏登录/注册/个人中心等入口（分享页等公共页面） */
const hideAuth = computed(() => route.meta.hideAuth === true)

/** 过滤后的导航项：hideAuth 时隐藏需要登录的历史页 */
const visibleNavItems = computed(() =>
  hideAuth.value ? navItems.filter((i) => i.name !== 'history') : navItems,
)

// 是否已登录
const isLoggedIn = computed(() => userStore.isLoggedIn)
const isGuest = computed(() => userStore.isGuest)
const displayLabel = computed(() => userStore.displayLabel)

/** 跳转到登录页 */
function goLogin(): void {
  router.push({ name: 'login', query: { redirect: route.fullPath } })
}

/** 跳转到注册页 */
function goRegister(): void {
  router.push({ name: 'register' })
}

/** 跳转到个人中心 */
function goProfile(): void {
  router.push({ name: 'profile' })
}

/** 退出登录 */
function handleLogout(): void {
  userStore.logout()
  toast.success('已退出登录')
  router.push({ name: 'home' })
}

/** 点击导航项 */
function goNav(item: { name: string; path: string }): void {
  router.push(item.path)
}
</script>

<template>
  <header class="layout-header">
    <div class="layout-header__inner">
      <!-- 左侧：品牌标识 + 标题 -->
      <div class="layout-header__brand" @click="router.push('/')">
        <div class="layout-header__logo">
          <span class="layout-header__logo-text">先</span>
        </div>
        <div class="layout-header__titles">
          <span class="layout-header__title">先别开工</span>
          <span class="layout-header__subtitle">AI 任务需求防返工扫描仪</span>
        </div>
      </div>

      <!-- 中间：导航菜单 -->
      <nav class="layout-header__nav">
        <button
          v-for="item in visibleNavItems"
          :key="item.name"
          class="layout-header__nav-item"
          :class="{ 'layout-header__nav-item--active': activeNav === item.name }"
          @click="goNav(item)"
        >
          {{ item.label }}
        </button>
      </nav>

      <!-- 右侧：用户状态 / 操作（分享页等公共页面隐藏） -->
      <div v-if="!hideAuth" class="layout-header__actions">
        <!-- 已登录用户 -->
        <template v-if="isLoggedIn">
          <button class="layout-header__user-btn" @click="goProfile">
            <span class="layout-header__user-icon">{{ userStore.username?.charAt(0).toUpperCase() || 'U' }}</span>
            <span class="layout-header__user-name">{{ displayLabel }}</span>
          </button>
          <button class="layout-header__nav-btn" @click="handleLogout">退出</button>
        </template>

        <!-- 游客模式 -->
        <template v-else-if="isGuest">
          <span class="layout-header__guest-label">{{ displayLabel }}</span>
          <button class="layout-header__nav-btn" @click="goLogin">登录</button>
          <button class="layout-header__nav-btn layout-header__nav-btn--primary" @click="goRegister">注册</button>
        </template>

        <!-- 未登录 -->
        <template v-else>
          <button class="layout-header__nav-btn" @click="goLogin">登录</button>
          <button class="layout-header__nav-btn layout-header__nav-btn--primary" @click="goRegister">注册</button>
        </template>
      </div>
    </div>
  </header>
</template>

<style scoped>
.layout-header {
  background: var(--color-black);
  border-bottom: var(--border-width-thick) solid var(--color-gold);
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
}

.layout-header__inner {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: 0 var(--container-px);
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-lg);
}

/* ===== 品牌区域 ===== */
.layout-header__brand {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  cursor: pointer;
  flex-shrink: 0;
}

.layout-header__logo {
  width: 40px;
  height: 40px;
  background: var(--color-gold);
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(-4deg);
  transition: transform var(--transition-fast);
  flex-shrink: 0;
}

.layout-header__brand:hover .layout-header__logo {
  transform: rotate(0deg) scale(1.05);
}

.layout-header__logo-text {
  font-family: var(--font-title);
  font-size: 22px;
  font-weight: var(--fw-black);
  color: var(--color-black);
  line-height: 1;
}

.layout-header__titles {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.layout-header__title {
  font-family: var(--font-title);
  font-size: 22px;
  font-weight: var(--fw-black);
  color: var(--color-gold);
  letter-spacing: -0.5px;
  line-height: 1;
}

.layout-header__subtitle {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: var(--fw-regular);
  color: var(--color-gold);
  letter-spacing: var(--ls-label);
  opacity: 0.75;
}

/* ===== 中间导航 ===== */
.layout-header__nav {
  display: flex;
  align-items: center;
  gap: 0;
  flex: 1;
  justify-content: center;
}

.layout-header__nav-item {
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
  padding: 8px 18px;
  cursor: pointer;
  transition: all var(--transition-fast);
  border: none;
  border-bottom: var(--border-width-thick) solid transparent;
  background: transparent;
  color: var(--color-gold);
  opacity: 0.7;
}

.layout-header__nav-item:hover {
  opacity: 1;
  background: rgba(255, 215, 0, 0.1);
}

.layout-header__nav-item--active {
  opacity: 1;
  border-bottom-color: var(--color-gold);
}

/* ===== 右侧操作区 ===== */
.layout-header__actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-shrink: 0;
}

/* 游客标签 */
.layout-header__guest-label {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: var(--fw-bold);
  color: var(--color-gold);
  letter-spacing: var(--ls-label);
  padding: 4px 10px;
  border: var(--border-width-thin) solid var(--color-gold);
  opacity: 0.8;
}

/* 用户按钮 */
.layout-header__user-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px 4px 4px;
  cursor: pointer;
  transition: all var(--transition-fast);
  border: var(--border-width-thin) solid var(--color-gold);
  background: transparent;
}

.layout-header__user-btn:hover {
  background: rgba(255, 215, 0, 0.1);
}

.layout-header__user-icon {
  width: 28px;
  height: 28px;
  background: var(--color-gold);
  color: var(--color-black);
  font-family: var(--font-title);
  font-size: 14px;
  font-weight: var(--fw-black);
  display: flex;
  align-items: center;
  justify-content: center;
}

.layout-header__user-name {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: var(--fw-bold);
  color: var(--color-gold);
  letter-spacing: var(--ls-label);
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 通用按钮 */
.layout-header__nav-btn {
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
  padding: 6px 14px;
  cursor: pointer;
  transition: all var(--transition-fast);
  border: var(--border-width-thin) solid var(--color-gold);
  background: transparent;
  color: var(--color-gold);
}

.layout-header__nav-btn:hover {
  background: var(--color-gold);
  color: var(--color-black);
}

.layout-header__nav-btn:active {
  transform: translate(1px, 1px);
}

.layout-header__nav-btn--primary {
  background: var(--color-gold);
  color: var(--color-black);
}

.layout-header__nav-btn--primary:hover {
  background: var(--color-black);
  color: var(--color-gold);
}

/* 响应式：平板保持单行紧凑，移动端导航换行至第二行（保证可点击，非隐藏） */
@media (max-width: 1199px) {
  .layout-header__inner {
    gap: var(--space-md);
  }
  .layout-header__title {
    font-size: 20px;
  }
  .layout-header__nav-item {
    padding: 8px 14px;
  }
}

@media (max-width: 767px) {
  .layout-header__inner {
    flex-wrap: wrap;
    height: auto;
    padding: var(--space-xs) var(--container-px);
    gap: var(--space-xs);
  }
  /* 品牌：仅保留 logo + 标题 */
  .layout-header__subtitle {
    display: none;
  }
  .layout-header__brand {
    gap: var(--space-xs);
  }
  .layout-header__logo {
    width: 32px;
    height: 32px;
  }
  .layout-header__logo-text {
    font-size: 18px;
  }
  .layout-header__title {
    font-size: 18px;
  }
  /* 导航：换行至第二行，全宽展开，保证可点击 */
  .layout-header__nav {
    flex: 1 1 100%;
    order: 3;
    justify-content: flex-start;
    border-top: var(--border-width-thin) solid rgba(255, 215, 0, 0.3);
    padding-top: var(--space-xs);
    gap: 0;
  }
  .layout-header__nav-item {
    padding: 6px 12px;
    font-size: 10px;
  }
  /* 用户名隐藏，仅保留头像 */
  .layout-header__user-name {
    display: none;
  }
  .layout-header__user-btn {
    padding: 4px 8px 4px 4px;
  }
  .layout-header__actions {
    gap: var(--space-xs);
  }
  .layout-header__nav-btn {
    padding: 6px 10px;
    font-size: 10px;
  }
}
</style>
