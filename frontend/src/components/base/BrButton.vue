<script setup lang="ts">
/**
 * BrButton - 新野兽派按钮组件
 *
 * 变体：
 * - primary：黑底金字，hover 金底黑字 + 斜切 -5°
 * - secondary：白底黑字黑边框，hover 金色背景
 * - outline：无边框背景，hover 黑底金字
 * - tag：黑底金字小尺寸，全大写
 */
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'tag'
type ButtonSize = 'sm' | 'md' | 'lg'

interface Props {
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  block?: boolean
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  block: false,
  loading: false,
})
</script>

<template>
  <button
    class="br-button"
    :class="[`br-button--${variant}`, `br-button--${size}`, { 'br-button--block': block, 'br-button--disabled': disabled || loading, 'br-button--loading': loading }]"
    :disabled="disabled || loading"
  >
    <span v-if="loading" class="br-button__spinner" aria-hidden="true"></span>
    <slot />
  </button>
</template>

<style scoped>
.br-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-weight: var(--fw-bold);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
  border: var(--border-width-thin) solid var(--color-black);
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  transition: all var(--transition-fast);
}

/* ===== 尺寸 ===== */
.br-button--sm {
  font-size: var(--fs-label-sm);
  padding: 6px 12px;
}
.br-button--md {
  font-size: var(--fs-label);
  padding: var(--space-xs) 20px;
}
.br-button--lg {
  font-size: var(--fs-caption);
  padding: 12px 28px;
}

/* ===== 变体 ===== */
/* primary：黑底金字，hover 金底黑字 + 斜切 */
.br-button--primary {
  background: var(--color-black);
  color: var(--color-gold);
  box-shadow: var(--shadow-sm);
}
.br-button--primary:not(.br-button--disabled):hover {
  background: var(--color-gold);
  color: var(--color-black);
  transform: skewX(-5deg);
  box-shadow: var(--shadow-md);
}
.br-button--primary:not(.br-button--disabled):active {
  transform: skewX(-5deg) translate(1px, 1px);
  box-shadow: 1px 1px 0 var(--color-black);
}

/* secondary：白底黑字黑边框，hover 金色背景 */
.br-button--secondary {
  background: var(--color-white);
  color: var(--color-black);
}
.br-button--secondary:not(.br-button--disabled):hover {
  background: var(--color-gold);
  box-shadow: var(--shadow-sm);
}
.br-button--secondary:not(.br-button--disabled):active {
  transform: translate(1px, 1px);
  box-shadow: none;
}

/* outline：无边框背景，hover 黑底金字，active 按压 */
.br-button--outline {
  background: transparent;
  color: var(--color-black);
  border-color: transparent;
}
.br-button--outline:not(.br-button--disabled):hover {
  background: var(--color-black);
  color: var(--color-gold);
}
.br-button--outline:not(.br-button--disabled):active {
  transform: translate(1px, 1px);
}

/* tag：黑底金字小尺寸，hover 金底黑字，active 按压 */
.br-button--tag {
  background: var(--color-black);
  color: var(--color-gold);
  font-size: var(--fs-label-sm);
  padding: 4px 10px;
  letter-spacing: var(--ls-label);
}
.br-button--tag:not(.br-button--disabled):hover {
  background: var(--color-gold);
  color: var(--color-black);
}
.br-button--tag:not(.br-button--disabled):active {
  transform: translate(1px, 1px);
}

/* ===== 块级 ===== */
.br-button--block {
  display: flex;
  width: 100%;
}

/* ===== 禁用 ===== */
.br-button--disabled {
  opacity: 0.4;
  cursor: not-allowed;
  box-shadow: none;
}

/* ===== 加载状态 ===== */
.br-button--loading {
  opacity: 0.7;
  cursor: wait;
  position: relative;
}

.br-button__spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  animation: br-button-spin 0.6s linear infinite;
  margin-right: 8px;
}

@keyframes br-button-spin {
  to {
    transform: rotate(360deg);
  }
}

/* ===== 响应式（S12）：移动端触摸友好，最小高度 44px =====
 * tag 变体保留小尺寸（装饰性标签，非主要操作）
 */
@media (max-width: 767px) {
  .br-button--sm,
  .br-button--md,
  .br-button--lg {
    min-height: var(--touch-target);
  }
}
</style>
