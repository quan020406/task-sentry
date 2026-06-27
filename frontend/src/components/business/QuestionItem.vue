<script setup lang="ts">
/**
 * QuestionItem - 单条追问问题
 *
 * 新野兽派风格：
 * - 序号 + 问题文本 + 右侧复制按钮（图标）
 * - hover：金色背景
 * - 点击复制：显示"已复制"反馈
 *
 * 数据字段（types/scan.d.ts Question）：
 * - q: 问题文本
 * - why: 提问原因（可选展示）
 */
import { ref, computed } from 'vue'
import { useToast } from '@/composables/useToast'

interface Props {
  /** 问题文本 */
  question: string
  /** 序号（从 1 开始） */
  index: number
  /** 优先级标识颜色类（must / later） */
  variant?: 'must' | 'later'
  /** 是否显示 why 字段（默认不显示，保持简洁） */
  showReason?: boolean
  /** 提问原因 */
  reason?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'must',
  showReason: false,
  reason: '',
})

const { toast } = useToast()
const copied = ref(false)

async function handleCopy(): Promise<void> {
  if (!props.question) {
    toast.warning('无内容可复制')
    return
  }
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(props.question)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = props.question
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    copied.value = true
    toast.success('已复制')
    setTimeout(() => {
      copied.value = false
    }, 1500)
  } catch {
    toast.error('复制失败')
  }
}

const indexText = computed(() => String(props.index).padStart(2, '0'))
</script>

<template>
  <li class="q-item" :class="`q-item--${variant}`">
    <span class="q-item__index">{{ indexText }}</span>
    <div class="q-item__content">
      <p class="q-item__text">{{ question }}</p>
      <p v-if="showReason && reason" class="q-item__reason">// {{ reason }}</p>
    </div>
    <button
      class="q-item__copy"
      :class="{ 'q-item__copy--copied': copied }"
      type="button"
      :title="copied ? '已复制' : '复制此问题'"
      :aria-label="copied ? '已复制' : '复制此问题'"
      @click="handleCopy"
    >
      <!-- 复制图标 -->
      <svg v-if="!copied" class="q-item__icon" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="9" y="9" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" />
        <path d="M5 15V5h10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="miter" />
      </svg>
      <!-- 对勾图标 -->
      <svg v-else class="q-item__icon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M5 12l5 5 9-10"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="square"
          stroke-linejoin="miter"
        />
      </svg>
    </button>
  </li>
</template>

<style scoped>
.q-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--color-white);
  border: var(--border-width-thin) solid var(--color-black);
  transition: background var(--transition-fast);
  cursor: default;
}

.q-item:hover {
  background: var(--color-gold);
}

/* 序号 */
.q-item__index {
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  color: var(--color-gray-2);
  letter-spacing: var(--ls-label);
  padding-top: 2px;
  min-width: 24px;
}

.q-item:hover .q-item__index {
  color: var(--color-black);
}

/* 内容区 */
.q-item__content {
  flex: 1;
  min-width: 0;
}

.q-item__text {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: var(--fw-regular);
  line-height: var(--lh-body);
  color: var(--color-black);
  margin: 0;
  word-break: break-word;
}

.q-item__reason {
  font-family: var(--font-mono);
  font-size: var(--fs-caption);
  color: var(--color-gray-2);
  margin: 4px 0 0;
  letter-spacing: var(--ls-label);
}

.q-item:hover .q-item__reason {
  color: var(--color-gray-3);
}

/* 复制按钮 */
.q-item__copy {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--color-black);
  color: var(--color-gold);
  border: var(--border-width-thin) solid var(--color-black);
  cursor: pointer;
  transition: all var(--transition-fast);
  padding: 0;
}

.q-item__copy:hover {
  background: var(--color-gold);
  color: var(--color-black);
  border-color: var(--color-black);
}

.q-item__copy:active {
  transform: translate(1px, 1px);
}

.q-item__copy--copied {
  background: var(--color-risk-low);
  color: var(--color-black);
}

.q-item__icon {
  width: 14px;
  height: 14px;
}

/* 必问变体：左侧红色粗边框 */
.q-item--must {
  border-left: var(--border-width-thick) solid var(--color-risk-high);
}

/* 边做边问变体：左侧黄色粗边框 */
.q-item--later {
  border-left: var(--border-width-thick) solid var(--color-risk-mid);
}
</style>
