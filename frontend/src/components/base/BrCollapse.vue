<script setup lang="ts">
/**
 * BrCollapse - 新野兽派折叠面板容器组件
 *
 * 支持多选（modelValue 为数组）
 * 粗黑边框分隔，展开/折叠箭头，hover 金色背景
 *
 * 用法：
 * <BrCollapse v-model="activeNames">
 *   <BrCollapseItem title="标题一" name="item1">内容一</BrCollapseItem>
 *   <BrCollapseItem title="标题二" name="item2">内容二</BrCollapseItem>
 * </BrCollapse>
 */
import { provide, ref, watch } from 'vue'

interface Props {
  modelValue?: (string | number)[]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: (string | number)[]]
}>()

// 当前展开的 name 列表（响应式）
const activeNames = ref<(string | number)[]>([...props.modelValue])

// 同步外部 v-model
watch(
  () => props.modelValue,
  (val) => {
    activeNames.value = [...val]
  },
)

// 切换某项展开/折叠
function toggle(name: string | number): void {
  const idx = activeNames.value.indexOf(name)
  if (idx > -1) {
    activeNames.value.splice(idx, 1)
  } else {
    activeNames.value.push(name)
  }
  emit('update:modelValue', [...activeNames.value])
}

// 提供给子组件
provide('br-collapse-active', activeNames)
provide('br-collapse-toggle', toggle)
</script>

<template>
  <div class="br-collapse">
    <slot />
  </div>
</template>

<style scoped>
.br-collapse {
  width: 100%;
  border: var(--border-width-thick) solid var(--color-black);
}
</style>
