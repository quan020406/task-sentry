<script setup lang="ts">
/**
 * BrTabs - 新野兽派标签页容器组件
 *
 * 活动项：金色背景，斜切 -5°
 * 底部粗黑边框分隔
 *
 * 用法：
 * <BrTabs v-model="active">
 *   <BrTabPane label="标签一" name="tab1">内容一</BrTabPane>
 *   <BrTabPane label="标签二" name="tab2">内容二</BrTabPane>
 * </BrTabs>
 */
import { provide, computed, ref, useSlots, watch } from 'vue'

interface Props {
  modelValue?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const slots = useSlots()

// 当前活动 name（响应式，通过 provide 传给子组件）
const activeName = ref<string | number>(props.modelValue)

// 同步外部 v-model 变化
watch(
  () => props.modelValue,
  (val) => {
    activeName.value = val
  },
)

// 收集子组件 BrTabPane 的标签信息
const panes = computed(() => {
  const defaultSlot = slots.default?.() || []
  return defaultSlot
    .filter((v: any) => v?.type?.__name === 'BrTabPane')
    .map((v: any) => {
      const p = v.props || {}
      return { label: p.label || '', name: p.name || '' }
    })
})

// 提供给子组件 BrTabPane
provide('br-tabs-active', activeName)

function handleClick(name: string | number): void {
  activeName.value = name
  emit('update:modelValue', name)
}
</script>

<template>
  <div class="br-tabs">
    <div class="br-tabs__nav">
      <button
        v-for="pane in panes"
        :key="pane.name"
        class="br-tabs__tab"
        :class="{ 'br-tabs__tab--active': activeName === pane.name }"
        @click="handleClick(pane.name)"
      >
        {{ pane.label }}
      </button>
    </div>
    <div class="br-tabs__content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.br-tabs {
  width: 100%;
}

.br-tabs__nav {
  display: flex;
  gap: var(--space-xs);
  border-bottom: var(--border-width-thick) solid var(--color-black);
  padding-bottom: 0;
}

.br-tabs__tab {
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
  padding: var(--space-sm) var(--space-lg);
  background: transparent;
  color: var(--color-black);
  border: var(--border-width-thin) solid var(--color-black);
  border-bottom: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
  top: 1px;
}

.br-tabs__tab:hover {
  background: var(--color-cream-light);
}

/* 活动项：金色背景 + 斜切 -5° */
.br-tabs__tab--active {
  background: var(--color-gold);
  transform: skewX(-5deg);
}

.br-tabs__tab--active:hover {
  background: var(--color-gold);
}

.br-tabs__content {
  padding-top: var(--space-lg);
}
</style>
