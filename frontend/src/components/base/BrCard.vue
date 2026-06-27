<script setup lang="ts">
/**
 * BrCard - 新野兽派卡片组件
 *
 * 变体：
 * - default：白背景，3px 黑色边框
 * - dark：深黑背景，金色文字
 * - data：数据卡片，hover 金色背景 + 偏移 + 硬阴影
 */
type CardVariant = 'default' | 'dark' | 'data'

interface Props {
  variant?: CardVariant
  hoverable?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'default',
  hoverable: false,
})
</script>

<template>
  <div
    class="br-card"
    :class="[`br-card--${variant}`, { 'br-card--hoverable': hoverable }]"
  >
    <div v-if="$slots.header" class="br-card__header">
      <slot name="header" />
    </div>
    <div class="br-card__body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="br-card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
.br-card {
  position: relative;
  transition: all var(--transition-fast);
}

/* ===== 变体 ===== */
/* default：白背景，3px 黑色边框 */
.br-card--default {
  background: var(--color-white);
  border: var(--border-width-thick) solid var(--color-black);
  padding: var(--space-lg);
}

/* dark：深黑背景，金色文字 */
.br-card--dark {
  background: var(--color-black);
  color: var(--color-gold);
  border: var(--border-width-thick) solid var(--color-black);
  padding: var(--space-lg);
}

/* data：数据卡片 */
.br-card--data {
  background: var(--color-white);
  border: var(--border-width-thin) solid var(--color-black);
  padding: 18px var(--space-md);
}

/* ===== Header / Footer ===== */
.br-card__header {
  padding-bottom: var(--space-md);
  margin-bottom: var(--space-md);
  border-bottom: var(--border-width-thin) solid var(--color-black);
}

.br-card--dark .br-card__header {
  border-bottom-color: var(--color-gold);
}

.br-card__footer {
  padding-top: var(--space-md);
  margin-top: var(--space-md);
  border-top: var(--border-width-thin) solid var(--color-black);
}

.br-card--dark .br-card__footer {
  border-top-color: var(--color-gold);
}

.br-card__body {
  flex: 1;
}

/* ===== hoverable 效果 ===== */
.br-card--hoverable.br-card--default:hover,
.br-card--hoverable.br-card--data:hover {
  background: var(--color-gold);
  transform: translate(-2px, -2px);
  box-shadow: var(--shadow-md);
}

.br-card--hoverable.br-card--dark:hover {
  transform: translate(-2px, -2px);
  box-shadow: var(--shadow-gold);
}
</style>
