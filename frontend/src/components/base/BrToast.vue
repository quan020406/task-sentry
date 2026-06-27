<script setup lang="ts">
/**
 * BrToast - 新野兽派 Toast 通知组件
 *
 * 黑框、硬阴影、JetBrains Mono 标签
 * 支持四种类型：success / error / info / warning
 */
import { useToast, type ToastType } from '@/composables/useToast'

const { toasts, removeToast } = useToast()

// 类型标签文字
const typeLabels: Record<ToastType, string> = {
  success: 'OK',
  error: 'ERR',
  info: 'INFO',
  warning: 'WARN',
}
</script>

<template>
  <Teleport to="body">
    <div class="br-toast-container">
      <TransitionGroup name="br-toast">
        <div
          v-for="item in toasts"
          :key="item.id"
          class="br-toast"
          :class="`br-toast--${item.type}`"
          @click="removeToast(item.id)"
        >
          <span class="br-toast__label">{{ typeLabels[item.type] }}</span>
          <span class="br-toast__message">{{ item.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.br-toast-container {
  position: fixed;
  top: var(--space-lg);
  right: var(--space-lg);
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  pointer-events: none;
}

.br-toast {
  display: flex;
  align-items: stretch;
  background: var(--color-white);
  border: var(--border-width-thick) solid var(--color-black);
  box-shadow: var(--shadow-md);
  min-width: 280px;
  max-width: 420px;
  pointer-events: auto;
  cursor: pointer;
  overflow: hidden;
}

.br-toast__label {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  letter-spacing: var(--ls-label);
  padding: var(--space-sm) var(--space-md);
  background: var(--color-black);
  color: var(--color-white);
  min-width: 56px;
  text-align: center;
}

.br-toast__message {
  display: flex;
  align-items: center;
  font-family: var(--font-body);
  font-size: var(--fs-caption);
  color: var(--color-black);
  padding: var(--space-sm) var(--space-md);
  flex: 1;
  line-height: var(--lh-caption);
}

/* 类型样式：标签颜色区分 */
.br-toast--success .br-toast__label {
  background: var(--color-black);
  color: var(--color-risk-low);
}
.br-toast--error .br-toast__label {
  background: var(--color-black);
  color: var(--color-risk-high);
}
.br-toast--info .br-toast__label {
  background: var(--color-black);
  color: var(--color-gold);
}
.br-toast--warning .br-toast__label {
  background: var(--color-black);
  color: var(--color-risk-mid);
}

/* hover 时金色背景 */
.br-toast:hover {
  background: var(--color-gold);
}

/* 进出动画：直接、干脆 */
.br-toast-enter-active,
.br-toast-leave-active {
  transition: all var(--transition-fast);
}
.br-toast-enter-from {
  opacity: 0;
  transform: translateX(40px);
}
.br-toast-leave-to {
  opacity: 0;
  transform: translateX(40px);
}
</style>
