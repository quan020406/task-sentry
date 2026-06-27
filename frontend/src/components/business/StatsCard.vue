<script setup lang="ts">
/**
 * StatsCard - 新野兽派统计卡片
 *
 * 用于个人中心使用统计区
 * - 图标 + 大数字 + 标签
 * - highlight 变体：金色背景
 * - dark 变体：黑底金字
 */
interface Props {
  /** 标签（全大写英文） */
  label: string
  /** 数值 */
  value: string | number
  /** 图标字符（单个字母或符号） */
  icon?: string
  /** 变体：default 白底 / highlight 金底 / dark 黑底金字 */
  variant?: 'default' | 'highlight' | 'dark'
}

withDefaults(defineProps<Props>(), {
  icon: '',
  variant: 'default',
})
</script>

<template>
  <div class="stats-card" :class="`stats-card--${variant}`">
    <!-- 图标 -->
    <span v-if="icon" class="stats-card__icon" aria-hidden="true">{{ icon }}</span>

    <!-- 数值 -->
    <span class="stats-card__value">{{ value }}</span>

    <!-- 标签 -->
    <span class="stats-card__label">{{ label }}</span>
  </div>
</template>

<style scoped>
.stats-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: var(--space-md);
  border: var(--border-width-thick) solid var(--color-black);
  box-shadow: var(--shadow-sm);
  background: var(--color-cream-light);
  min-height: 96px;
}

/* 高亮变体：金色背景 */
.stats-card--highlight {
  background: var(--color-gold);
}

/* 深色变体：黑底金字 */
.stats-card--dark {
  background: var(--color-black);
  border-color: var(--color-black);
}

.stats-card__icon {
  font-family: var(--font-title);
  font-size: 18px;
  font-weight: var(--fw-black);
  color: var(--color-gold-dark);
  line-height: 1;
}

.stats-card--highlight .stats-card__icon {
  color: var(--color-black);
}

.stats-card--dark .stats-card__icon {
  color: var(--color-gold);
}

.stats-card__value {
  font-family: var(--font-title);
  font-size: var(--fs-num-xl);
  font-weight: var(--fw-black);
  color: var(--color-black);
  line-height: var(--lh-tight);
  letter-spacing: -2px;
}

.stats-card--dark .stats-card__value {
  color: var(--color-gold);
}

.stats-card__label {
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  color: var(--color-gray-2);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
  margin-top: auto;
}

.stats-card--highlight .stats-card__label {
  color: var(--color-black);
}

.stats-card--dark .stats-card__label {
  color: var(--color-gold);
  opacity: 0.7;
}

/* 响应式：小屏缩小数字 */
@media (max-width: 640px) {
  .stats-card__value {
    font-size: 64px;
  }
}
</style>
