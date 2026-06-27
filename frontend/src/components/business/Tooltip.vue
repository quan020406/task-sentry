<script setup lang="ts">
/**
 * Tooltip - 新野兽派通用气泡提示
 *
 * 特性：
 * - 黑底金字 + 粗黑边框 + 硬阴影
 * - 尖角指示器（指向触发元素）
 * - 支持 top / bottom / left / right 四个方向
 * - hover 触发，自动边界检测（基础版：固定方向）
 * - 标签（JetBrains Mono 全大写）+ 正文（Work Sans）
 *
 * 使用方式：
 * <Tooltip label="程度模糊" position="top">
 *   <span class="my-trigger">高亮词</span>
 * </Tooltip>
 */
import { ref, computed } from 'vue'

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'

interface Props {
  /** 标签文字（JetBrains Mono 全大写，可选） */
  label?: string
  /** 正文内容 */
  content?: string
  /** 弹出方向 */
  position?: TooltipPosition
  /** 气泡最大宽度（px） */
  maxWidth?: number
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  content: '',
  position: 'top',
  maxWidth: 240,
})

const visible = ref(false)

let hideTimer: ReturnType<typeof setTimeout> | null = null

function show(): void {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  visible.value = true
}

function hide(): void {
  // 延迟隐藏，避免鼠标移动间隙闪烁
  hideTimer = setTimeout(() => {
    visible.value = false
  }, 80)
}

const positionClass = computed(() => `tooltip--${props.position}`)
const tooltipStyle = computed(() => ({
  maxWidth: `${props.maxWidth}px`,
}))
</script>

<template>
  <span
    class="br-tooltip-trigger"
    @mouseenter="show"
    @mouseleave="hide"
    @focus="show"
    @blur="hide"
  >
    <slot />
    <Transition name="tooltip-fade">
      <span
        v-show="visible"
        class="br-tooltip"
        :class="positionClass"
        :style="tooltipStyle"
        role="tooltip"
      >
        <span v-if="label" class="br-tooltip__label">{{ label }}</span>
        <span v-if="content" class="br-tooltip__content">{{ content }}</span>
        <span class="br-tooltip__arrow" aria-hidden="true"></span>
      </span>
    </Transition>
  </span>
</template>

<style scoped>
.br-tooltip-trigger {
  position: relative;
  display: inline;
  /* 允许接收 focus */
  outline: none;
}

/* ===== 气泡主体 ===== */
.br-tooltip {
  position: absolute;
  z-index: var(--z-dropdown);
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: var(--color-black);
  color: var(--color-gold);
  border: var(--border-width-thick) solid var(--color-black);
  box-shadow: var(--shadow-md);
  padding: 10px 12px;
  pointer-events: none;
  /* 不换行控制由 maxWidth 决定 */
  width: max-content;
}

/* ===== 标签 ===== */
.br-tooltip__label {
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
  color: var(--color-gold);
  white-space: nowrap;
  /* 标签下方细分隔线 */
  padding-bottom: 4px;
  border-bottom: var(--border-width-thin) solid var(--color-gold);
}

/* ===== 正文 ===== */
.br-tooltip__content {
  font-family: var(--font-body);
  font-size: var(--fs-caption);
  font-weight: var(--fw-regular);
  line-height: var(--lh-caption);
  color: var(--color-cream);
}

/* ===== 尖角指示器 ===== */
.br-tooltip__arrow {
  position: absolute;
  width: 0;
  height: 0;
  border-style: solid;
  border-color: var(--color-black);
}

/* ===== 方向定位 + 尖角 ===== */
/* top：气泡在触发元素上方 */
.tooltip--top {
  bottom: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
}
.tooltip--top .br-tooltip__arrow {
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  border-width: 10px 8px 0 8px;
  border-top-color: var(--color-black);
  border-right-color: transparent;
  border-bottom-color: transparent;
  border-left-color: transparent;
}

/* bottom：气泡在触发元素下方 */
.tooltip--bottom {
  top: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
}
.tooltip--bottom .br-tooltip__arrow {
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  border-width: 0 8px 10px 8px;
  border-top-color: transparent;
  border-right-color: transparent;
  border-bottom-color: var(--color-black);
  border-left-color: transparent;
}

/* left：气泡在触发元素左侧 */
.tooltip--left {
  right: calc(100% + 10px);
  top: 50%;
  transform: translateY(-50%);
}
.tooltip--left .br-tooltip__arrow {
  right: -10px;
  top: 50%;
  transform: translateY(-50%);
  border-width: 8px 0 8px 10px;
  border-top-color: transparent;
  border-right-color: transparent;
  border-bottom-color: transparent;
  border-left-color: var(--color-black);
}

/* right：气泡在触发元素右侧 */
.tooltip--right {
  left: calc(100% + 10px);
  top: 50%;
  transform: translateY(-50%);
}
.tooltip--right .br-tooltip__arrow {
  left: -10px;
  top: 50%;
  transform: translateY(-50%);
  border-width: 8px 10px 8px 0;
  border-top-color: transparent;
  border-right-color: var(--color-black);
  border-bottom-color: transparent;
  border-left-color: transparent;
}

/* ===== 过渡动画（直接、利落） ===== */
.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity var(--transition-fast), transform var(--transition-fast);
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
}

/* 各方向进入时的轻微位移 */
.tooltip--top.tooltip-fade-enter-from,
.tooltip--top.tooltip-fade-leave-to {
  transform: translateX(-50%) translateY(4px);
}
.tooltip--bottom.tooltip-fade-enter-from,
.tooltip--bottom.tooltip-fade-leave-to {
  transform: translateX(-50%) translateY(-4px);
}
.tooltip--left.tooltip-fade-enter-from,
.tooltip--left.tooltip-fade-leave-to {
  transform: translateY(-50%) translateX(4px);
}
.tooltip--right.tooltip-fade-enter-from,
.tooltip--right.tooltip-fade-leave-to {
  transform: translateY(-50%) translateX(-4px);
}
</style>
