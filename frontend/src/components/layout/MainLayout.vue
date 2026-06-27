<script setup lang="ts">
/**
 * MainLayout - 主布局容器
 *
 * 三段式结构：LayoutHeader + main 区域 + LayoutFooter
 * 挂载时自动初始化游客身份（未登录用户）
 */
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import LayoutHeader from './LayoutHeader.vue'
import LayoutFooter from './LayoutFooter.vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const route = useRoute()

// 应用启动时初始化游客身份
onMounted(() => {
  userStore.initGuest()
})
</script>

<template>
  <div class="main-layout">
    <LayoutHeader />
    <main class="main-layout__content">
      <div
        class="main-layout__inner"
        :class="{ 'main-layout__inner--full': route.meta.fullWidth }"
      >
        <slot />
      </div>
    </main>
    <LayoutFooter />
  </div>
</template>

<style scoped>
.main-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-layout__content {
  flex: 1;
  background: var(--color-cream);
  /* S12：设为 flex 容器，使 fullWidth 子页可用 flex:1 撑满高度，
     替代子页中硬编码的 calc(100vh - header - footer) */
  display: flex;
  flex-direction: column;
}

.main-layout__inner {
  max-width: var(--container-max);
  margin: 0 auto;
  width: 100%;
  padding: var(--space-lg) var(--container-px);
}

/* 登录/注册页/扫描动画页不需要最大宽度限制，并撑满内容区高度 */
.main-layout__inner--full {
  max-width: none;
  padding: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
