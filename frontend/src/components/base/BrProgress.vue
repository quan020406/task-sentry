<script setup lang="ts">
/**
 * BrProgress - 新野兽派进度条组件
 *
 * 黑色边框，直角，填充色根据 variant 变化
 */
type ProgressVariant = 'default' | 'gold' | 'dark'

interface Props {
  percent?: number
  variant?: ProgressVariant
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  percent: 0,
  variant: 'default',
  height: '6px',
})

// 限制 0-100
function clamp(val: number): number {
  return Math.max(0, Math.min(100, val))
}
</script>

<template>
  <div class="br-progress" :style="{ height }">
    <div
      class="br-progress__fill"
      :class="`br-progress__fill--${props.variant}`"
      :style="{ width: `${clamp(props.percent)}%` }"
    />
  </div>
</template>

<style scoped>
.br-progress {
  width: 100%;
  background: var(--color-gray-5);
  border: var(--border-width-thin) solid var(--color-black);
  overflow: hidden;
  position: relative;
}

.br-progress__fill {
  height: 100%;
  transition: width var(--transition-normal);
}

/* default：金色填充 */
.br-progress__fill--default {
  background: var(--color-gold);
}

/**
 * gold：金色填充，default 的语义化别名
 * 用于需要强调金色语义的场景，与 default 样式完全一致
 * @see default
 */
.br-progress__fill--gold {
  background: var(--color-gold);
}

/* dark：黑色填充 */
.br-progress__fill--dark {
  background: var(--color-black);
}
</style>
