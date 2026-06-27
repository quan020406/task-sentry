<script setup lang="ts">
/**
 * BrTabPane - 标签页内容面板
 * 必须配合 BrTabs 使用
 *
 * 仅当父级 v-model 与 name 匹配时显示
 */
import { inject, computed, type Ref } from 'vue'

interface Props {
  label?: string
  name?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  name: '',
})

// 从父级 BrTabs 注入当前活动 name（响应式 ref）
const activeName = inject<Ref<string | number>>('br-tabs-active')!

const isActive = computed(() => activeName.value === props.name)
</script>

<template>
  <div v-show="isActive" class="br-tab-pane">
    <slot />
  </div>
</template>

<style scoped>
.br-tab-pane {
  width: 100%;
}
</style>
