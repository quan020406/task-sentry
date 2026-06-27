<script setup lang="ts">
/**
 * BrCollapseItem - 折叠面板项
 * 必须配合 BrCollapse 使用
 *
 * 粗黑边框分隔，展开/折叠箭头，hover 金色背景
 */
import { inject, computed, type Ref } from 'vue'

interface Props {
  title?: string
  name?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  name: '',
})

// 从父级注入
const activeNames = inject<Ref<(string | number)[]>>('br-collapse-active')!
const toggle = inject<(name: string | number) => void>('br-collapse-toggle')!

const isActive = computed(() => activeNames.value.includes(props.name))

function handleToggle(): void {
  toggle(props.name)
}
</script>

<template>
  <div class="br-collapse-item" :class="{ 'br-collapse-item--active': isActive }">
    <button class="br-collapse-item__header" @click="handleToggle">
      <span class="br-collapse-item__title">{{ title }}</span>
      <span class="br-collapse-item__arrow" :class="{ 'br-collapse-item__arrow--open': isActive }">▶</span>
    </button>
    <div v-show="isActive" class="br-collapse-item__body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.br-collapse-item {
  border-bottom: var(--border-width-thin) solid var(--color-black);
}

.br-collapse-item:last-child {
  border-bottom: none;
}

.br-collapse-item__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--space-md) var(--space-lg);
  background: var(--color-white);
  font-family: var(--font-mono);
  font-size: var(--fs-caption);
  font-weight: var(--fw-bold);
  color: var(--color-black);
  text-transform: uppercase;
  letter-spacing: var(--ls-label);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: left;
}

.br-collapse-item__header:hover {
  background: var(--color-gold);
}

.br-collapse-item--active .br-collapse-item__header {
  background: var(--color-cream-light);
  border-bottom: var(--border-width-thin) solid var(--color-black);
}

.br-collapse-item__title {
  flex: 1;
}

.br-collapse-item__arrow {
  font-size: 10px;
  transition: transform var(--transition-fast);
}

.br-collapse-item__arrow--open {
  transform: rotate(90deg);
}

.br-collapse-item__body {
  padding: var(--space-lg);
  background: var(--color-cream-light);
  line-height: var(--lh-body);
}
</style>
