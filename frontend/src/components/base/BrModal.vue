<script setup lang="ts">
/**
 * BrModal - 新野兽派模态框组件
 *
 * 黑色粗边框，白色背景，硬阴影
 * 标题用 Archivo Black
 */
interface Props {
  modelValue?: boolean
  title?: string
  width?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  title: '',
  width: '480px',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'close': []
}>()

function handleClose(): void {
  emit('update:modelValue', false)
  emit('close')
}

function handleMaskClick(e: MouseEvent): void {
  if (e.target === e.currentTarget) {
    handleClose()
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="props.modelValue" class="br-modal-mask" @click="handleMaskClick">
      <div class="br-modal" :style="{ maxWidth: width }">
        <div class="br-modal__header">
          <h3 class="br-modal__title">{{ title }}</h3>
          <button class="br-modal__close" @click="handleClose" aria-label="关闭">×</button>
        </div>
        <div class="br-modal__body">
          <slot />
        </div>
        <div v-if="$slots.footer" class="br-modal__footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.br-modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(26, 26, 26, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--space-lg);
}

.br-modal {
  width: 100%;
  background: var(--color-white);
  border: var(--border-width-heavy) solid var(--color-black);
  box-shadow: var(--shadow-lg);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.br-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-lg);
  border-bottom: var(--border-width-thick) solid var(--color-black);
}

.br-modal__title {
  font-family: var(--font-title);
  font-size: var(--fs-h2);
  font-weight: var(--fw-black);
  line-height: var(--lh-normal);
  color: var(--color-black);
}

.br-modal__close {
  font-family: var(--font-mono);
  font-size: 24px;
  font-weight: var(--fw-bold);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-white);
  border: var(--border-width-thin) solid var(--color-black);
  color: var(--color-black);
  transition: all var(--transition-fast);
}

.br-modal__close:hover {
  background: var(--color-gold);
  transform: rotate(90deg);
}

.br-modal__body {
  padding: var(--space-lg);
  overflow-y: auto;
  flex: 1;
}

.br-modal__footer {
  padding: var(--space-md) var(--space-lg);
  border-top: var(--border-width-thick) solid var(--color-black);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
}
</style>
