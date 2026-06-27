<script setup lang="ts">
/**
 * BrInput - 新野兽派输入框组件
 *
 * 支持 text / textarea / password 三种类型
 * focus：金色边框 + 硬阴影偏移
 * error：红色边框 + 错误提示文字
 */
type InputType = 'text' | 'textarea' | 'password'

interface Props {
  type?: InputType
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  rows?: number
  error?: string
  autocomplete?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  modelValue: '',
  placeholder: '',
  disabled: false,
  rows: 4,
  error: '',
  autocomplete: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function handleInput(e: Event): void {
  const target = e.target as HTMLInputElement | HTMLTextAreaElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div
    class="br-input-wrap"
    :class="{ 'br-input-wrap--disabled': disabled, 'br-input-wrap--error': !!error }"
  >
    <textarea
      v-if="type === 'textarea'"
      class="br-input br-textarea"
      :value="props.modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :rows="rows"
      @input="handleInput"
    />
    <input
      v-else
      class="br-input"
      :type="type"
      :value="props.modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :autocomplete="autocomplete || undefined"
      @input="handleInput"
    />
    <p v-if="error" class="br-input-error">{{ error }}</p>
  </div>
</template>

<style scoped>
.br-input-wrap {
  display: block;
  width: 100%;
}

.br-input {
  width: 100%;
  font-family: var(--font-body);
  font-size: var(--fs-body);
  color: var(--color-black);
  background: var(--color-white);
  border: var(--border-width-thick) solid var(--color-black);
  padding: var(--space-sm) var(--space-md);
  outline: none;
  transition: border-color var(--transition-fast);
  box-sizing: border-box;
}

.br-input::placeholder {
  color: var(--color-gray-1);
}

/* hover：边框变深金色 */
.br-input:not(:disabled):hover {
  border-color: var(--color-gold-dark);
}

/* focus：金色边框 + 硬阴影偏移 */
.br-input:focus {
  border-color: var(--color-gold-dark);
  box-shadow: var(--shadow-sm);
  background: var(--color-cream-light);
}

.br-textarea {
  resize: vertical;
  min-height: 80px;
  line-height: var(--lh-body);
}

.br-input-wrap--disabled .br-input {
  opacity: 0.4;
  cursor: not-allowed;
  background: var(--color-cream);
}

/* 错误状态：红色边框 */
.br-input-wrap--error .br-input {
  border-color: var(--color-risk-high);
}

.br-input-wrap--error .br-input:focus {
  box-shadow: 2px 2px 0 var(--color-risk-high);
}

/* 错误提示文字 */
.br-input-error {
  font-family: var(--font-mono);
  font-size: var(--fs-caption);
  font-weight: var(--fw-bold);
  color: var(--color-risk-high);
  margin: 6px 0 0;
  letter-spacing: 0.3px;
}

/* 响应式（S12）：移动端输入框最小高度 44px，保证触摸友好 */
@media (max-width: 767px) {
  .br-input:not(.br-textarea) {
    min-height: var(--touch-target);
  }
}
</style>
