<script setup lang="ts">
/**
 * CollapseGroup - 新野兽派可折叠分组
 *
 * 特性：
 * - 头部：标题 + 数量角标 + 展开/折叠箭头
 * - hover：金色背景
 * - 点击切换展开/折叠
 * - 箭头旋转动画（干脆利落）
 * - 内容区高度过渡动画
 * - 支持默认展开 / 默认折叠
 * - 空状态插槽
 *
 * 使用方式：
 * <CollapseGroup title="目标不清" :count="3" :default-open="true">
 *   <RiskItem ... />
 * </CollapseGroup>
 */
import { ref, computed, watch } from 'vue'

interface Props {
  /** 分组标题 */
  title: string
  /** 数量角标 */
  count?: number
  /** 默认展开（非受控模式） */
  defaultOpen?: boolean
  /** 是否为空状态 */
  empty?: boolean
  /** 受控模式：是否展开。传入则切换为受控，需配合 toggle 事件 */
  open?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,
  defaultOpen: false,
  empty: false,
  open: undefined,
})

const emit = defineEmits<{
  (e: 'toggle', value: boolean): void
}>()

/** 内部状态（非受控模式） */
const innerOpen = ref(props.defaultOpen)

/** 是否为受控模式 */
const isControlled = computed(() => props.open !== undefined)

/** 当前展开状态：受控模式用 props.open，否则用内部状态 */
const isOpen = computed(() => (isControlled.value ? !!props.open : innerOpen.value))

// 受控模式下，defaultOpen 变化时同步内部状态（用于切回非受控）
watch(
  () => props.defaultOpen,
  (val) => {
    if (!isControlled.value) {
      innerOpen.value = val
    }
  },
)

function toggle(): void {
  if (isControlled.value) {
    emit('toggle', !isOpen.value)
  } else {
    innerOpen.value = !innerOpen.value
    emit('toggle', innerOpen.value)
  }
}

const hasContent = computed(() => !props.empty && props.count > 0)

// S13 修复（S08 #1）：折叠动画改用 JS 钩子动态测量 scrollHeight，
// 替代原先 max-height: 1200px 硬编码上限，避免风险条目过多时内容被截断。
function onBeforeEnter(el: Element): void {
  const target = el as HTMLElement
  target.style.maxHeight = '0'
  target.style.opacity = '0'
}

function onEnter(el: Element, done: () => void): void {
  const target = el as HTMLElement
  // 测量实际内容高度并应用为过渡终点
  target.style.maxHeight = `${target.scrollHeight}px`
  target.style.opacity = '1'
  // transitionend 后解除 max-height 限制，避免窗口缩放时被卡住
  const onEnd = (): void => {
    target.style.maxHeight = 'none'
    target.removeEventListener('transitionend', onEnd)
    done()
  }
  target.addEventListener('transitionend', onEnd)
}

function onLeave(el: Element, done: () => void): void {
  const target = el as HTMLElement
  // 先固定当前高度，再置 0 触发折叠动画
  target.style.maxHeight = `${target.scrollHeight}px`
  void target.offsetHeight // 强制重排
  target.style.maxHeight = '0'
  target.style.opacity = '0'
  const onEnd = (): void => {
    target.removeEventListener('transitionend', onEnd)
    done()
  }
  target.addEventListener('transitionend', onEnd)
}
</script>

<template>
  <div class="collapse-group" :class="{ 'collapse-group--open': isOpen }">
    <button
      class="collapse-group__header"
      :class="{ 'collapse-group__header--has-risk': hasContent }"
      type="button"
      :aria-expanded="isOpen"
      @click="toggle"
    >
      <span class="collapse-group__title">{{ title }}</span>
      <span class="collapse-group__meta">
        <span
          v-if="hasContent"
          class="collapse-group__badge"
          :class="{ 'collapse-group__badge--zero': count === 0 }"
        >{{ count }}</span>
        <span
          v-else
          class="collapse-group__check"
          aria-label="无风险"
        >✓</span>
        <span class="collapse-group__arrow" :class="{ 'collapse-group__arrow--open': isOpen }">▶</span>
      </span>
    </button>

    <Transition :css="false" @before-enter="onBeforeEnter" @enter="onEnter" @leave="onLeave">
      <div v-show="isOpen" class="collapse-group__body">
        <!-- 有内容：默认插槽 -->
        <slot v-if="hasContent" />

        <!-- 空状态 -->
        <div v-else class="collapse-group__empty">
          <span class="collapse-group__empty-icon" aria-hidden="true">✓</span>
          <span class="collapse-group__empty-text">未发现此类风险</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.collapse-group {
  border-bottom: var(--border-width-thin) solid var(--color-black);
}

.collapse-group:last-child {
  border-bottom: none;
}

/* ===== 头部 ===== */
.collapse-group__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--space-md) var(--space-lg);
  background: var(--color-white);
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  color: var(--color-black);
  text-transform: uppercase;
  letter-spacing: var(--ls-label);
  cursor: pointer;
  transition: background var(--transition-fast);
  text-align: left;
  border: none;
}

.collapse-group__header:hover {
  background: var(--color-gold);
}

.collapse-group--open .collapse-group__header {
  background: var(--color-cream-light);
  border-bottom: var(--border-width-thin) solid var(--color-black);
}

/* 有风险的分组标题左侧加金色色块标识 */
.collapse-group__header--has-risk::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 16px;
  background: var(--color-gold);
  margin-right: var(--space-sm);
  flex-shrink: 0;
}

.collapse-group__title {
  flex: 1;
}

.collapse-group__meta {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
}

/* 数量角标 */
.collapse-group__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  background: var(--color-black);
  color: var(--color-gold);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: var(--fw-bold);
  border: var(--border-width-thin) solid var(--color-black);
}

.collapse-group__badge--zero {
  background: var(--color-cream);
  color: var(--color-gray-2);
}

/* 无风险对勾 */
.collapse-group__check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  background: var(--color-risk-low);
  color: var(--color-black);
  font-size: 14px;
  font-weight: var(--fw-bold);
  border: var(--border-width-thin) solid var(--color-black);
}

/* 箭头 */
.collapse-group__arrow {
  font-size: 10px;
  transition: transform var(--transition-fast);
  color: var(--color-black);
}

.collapse-group__arrow--open {
  transform: rotate(90deg);
}

/* ===== 内容区 ===== */
.collapse-group__body {
  background: var(--color-cream-light);
  padding: var(--space-md) var(--space-lg);
  overflow: hidden;
}

/* 空状态 */
.collapse-group__empty {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) 0;
  font-family: var(--font-body);
  font-size: var(--fs-caption);
  color: var(--color-gray-2);
}

.collapse-group__empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: var(--color-risk-low);
  color: var(--color-black);
  font-size: 12px;
  font-weight: var(--fw-bold);
  border: var(--border-width-thin) solid var(--color-black);
}

.collapse-group__empty-text {
  font-style: italic;
}

/* ===== 折叠动画（JS 钩子驱动，max-height 由 JS 动态设置） ===== */
.collapse-group__body {
  transition: max-height var(--transition-base) linear, opacity var(--transition-fast) linear;
  overflow: hidden;
}
</style>
