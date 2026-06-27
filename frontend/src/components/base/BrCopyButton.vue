<script setup lang="ts">
/**
 * BrCopyButton - 复制按钮组件
 *
 * 点击复制文本，显示成功反馈
 * tag 风格按钮
 */
import { ref } from 'vue'
import { useToast } from '@/composables/useToast'

interface Props {
  text?: string
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  text: '',
  label: '复制',
})

const { toast } = useToast()
const copied = ref(false)

async function handleCopy(): Promise<void> {
  if (!props.text) {
    toast.warning('无内容可复制')
    return
  }

  try {
    // 优先使用 Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(props.text)
    } else {
      // 降级方案：textarea + execCommand
      const textarea = document.createElement('textarea')
      textarea.value = props.text
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }

    copied.value = true
    toast.success('已复制到剪贴板')
    setTimeout(() => {
      copied.value = false
    }, 1500)
  } catch (err) {
    toast.error('复制失败，请手动复制')
  }
}
</script>

<template>
  <button
    class="br-copy-btn"
    :class="{ 'br-copy-btn--copied': copied }"
    @click="handleCopy"
  >
    <span class="br-copy-btn__label">{{ copied ? '已复制' : label }}</span>
  </button>
</template>

<style scoped>
.br-copy-btn {
  display: inline-flex;
  align-items: center;
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
  padding: 4px 10px;
  background: var(--color-black);
  color: var(--color-gold);
  border: var(--border-width-thin) solid var(--color-black);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.br-copy-btn:hover {
  background: var(--color-gold);
  color: var(--color-black);
}

/* 复制成功状态 */
.br-copy-btn--copied {
  background: var(--color-gold);
  color: var(--color-black);
}
</style>
