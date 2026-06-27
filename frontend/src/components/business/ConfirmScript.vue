<script setup lang="ts">
/**
 * ConfirmScript - 确认话术
 *
 * 新野兽派风格：
 * - 标题 + 右侧身份标签 + 一键复制按钮
 * - 引用样式：左侧粗金色边框 + 浅米背景
 * - 字体：Work Sans，行高 1.9
 * - 一键复制大按钮（醒目位置）
 *
 * 数据：scan.confirmScript（字符串）
 * 身份标签：来自 identity prop
 */
import { computed, ref } from 'vue'
import { useToast } from '@/composables/useToast'
import { IDENTITY_OPTIONS } from '@/stores/scan'
import type { IdentityType } from '@/types/user'

interface Props {
  /** 确认话术文本 */
  script: string
  /** 用户身份（用于显示身份标签） */
  identity?: IdentityType | null
}

const props = withDefaults(defineProps<Props>(), {
  identity: null,
})

const { toast } = useToast()
const copied = ref(false)

/** 身份标签文字（如"实习生版"） */
const identityLabel = computed(() => {
  if (!props.identity) return ''
  const opt = IDENTITY_OPTIONS.find((o) => o.type === props.identity)
  return opt ? `${opt.label}版` : ''
})

/** 是否有话术内容 */
const hasScript = computed(() => !!(props.script && props.script.trim()))

/** 话术按行分割（用于排版） */
const scriptLines = computed(() => {
  if (!hasScript.value) return []
  return props.script.split(/\r?\n/).filter((line) => line.trim())
})

async function handleCopy(): Promise<void> {
  if (!hasScript.value) {
    toast.warning('暂无话术可复制')
    return
  }
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(props.script)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = props.script
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    copied.value = true
    toast.success('已复制确认话术')
    setTimeout(() => {
      copied.value = false
    }, 1500)
  } catch {
    toast.error('复制失败')
  }
}
</script>

<template>
  <div class="confirm-script">
    <!-- 标题行 -->
    <header class="confirm-script__head">
      <div class="confirm-script__title-wrap">
        <span class="confirm-script__label">// CONFIRM SCRIPT</span>
        <h2 class="confirm-script__title">确认话术</h2>
      </div>
      <div class="confirm-script__head-right">
        <span v-if="identityLabel" class="confirm-script__identity">
          {{ identityLabel }}
        </span>
        <button
          class="confirm-script__copy-btn"
          :class="{ 'confirm-script__copy-btn--copied': copied }"
          type="button"
          @click="handleCopy"
        >
          <svg v-if="!copied" class="confirm-script__icon" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="9" y="9" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" />
            <path d="M5 15V5h10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="miter" />
          </svg>
          <svg v-else class="confirm-script__icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M5 12l5 5 9-10"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="square"
              stroke-linejoin="miter"
            />
          </svg>
          <span>{{ copied ? '已复制' : '复制' }}</span>
        </button>
      </div>
    </header>

    <!-- 主体 -->
    <div class="confirm-script__body">
      <template v-if="hasScript">
        <!-- 引用样式：左侧粗金色边框 + 浅米背景 -->
        <blockquote class="confirm-script__quote">
          <p
            v-for="(line, idx) in scriptLines"
            :key="`line-${idx}`"
            class="confirm-script__line"
          >{{ line }}</p>
        </blockquote>

        <!-- 大号复制按钮（底部醒目位置） -->
        <button
          class="confirm-script__copy-all"
          :class="{ 'confirm-script__copy-all--copied': copied }"
          type="button"
          @click="handleCopy"
        >
          <svg v-if="!copied" class="confirm-script__copy-all-icon" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="9" y="9" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" />
            <path d="M5 15V5h10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="miter" />
          </svg>
          <svg v-else class="confirm-script__copy-all-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M5 12l5 5 9-10"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="square"
              stroke-linejoin="miter"
            />
          </svg>
          <span>{{ copied ? '已复制，去确认吧' : '复制确认话术' }}</span>
        </button>
      </template>

      <!-- 空状态 -->
      <div v-else class="confirm-script__empty">
        <span class="confirm-script__empty-icon" aria-hidden="true">!</span>
        <p class="confirm-script__empty-text">暂无确认话术建议。</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.confirm-script {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* ===== 标题行 ===== */
.confirm-script__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: var(--space-md) var(--space-lg);
  background: var(--color-cream-light);
  border-bottom: var(--border-width-thick) solid var(--color-black);
  gap: var(--space-sm);
}

.confirm-script__title-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.confirm-script__label {
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  color: var(--color-gold-dark);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
}

.confirm-script__title {
  font-family: var(--font-title);
  font-size: 20px;
  font-weight: var(--fw-black);
  color: var(--color-black);
  letter-spacing: var(--ls-h2);
  line-height: 1;
  margin: 0;
}

.confirm-script__head-right {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-shrink: 0;
}

/* 身份标签 */
.confirm-script__identity {
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  color: var(--color-gold-dark);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
  padding: 4px 8px;
  background: var(--color-gold);
  border: var(--border-width-thin) solid var(--color-black);
  white-space: nowrap;
}

/* 标题栏小复制按钮 */
.confirm-script__copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
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

.confirm-script__copy-btn:hover {
  background: var(--color-gold);
  color: var(--color-black);
}

.confirm-script__copy-btn--copied {
  background: var(--color-risk-low);
  color: var(--color-black);
}

.confirm-script__icon {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

/* ===== 主体 ===== */
.confirm-script__body {
  flex: 1;
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

/* 引用块：左侧粗金色边框 + 浅米背景 */
.confirm-script__quote {
  flex: 1;
  background: var(--color-cream-light);
  border-left: var(--border-width-thick) solid var(--color-gold);
  border-top: var(--border-width-thin) solid var(--color-black);
  border-right: var(--border-width-thin) solid var(--color-black);
  border-bottom: var(--border-width-thin) solid var(--color-black);
  padding: var(--space-md) var(--space-lg);
  margin: 0;
}

.confirm-script__line {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: var(--fw-regular);
  line-height: 1.9;
  color: var(--color-black);
  margin: 0 0 6px;
  word-break: break-word;
}

.confirm-script__line:last-child {
  margin-bottom: 0;
}

/* 大号复制按钮（底部） */
.confirm-script__copy-all {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  width: 100%;
  padding: var(--space-md) var(--space-lg);
  background: var(--color-black);
  color: var(--color-gold);
  border: var(--border-width-thick) solid var(--color-black);
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.confirm-script__copy-all:hover {
  background: var(--color-gold);
  color: var(--color-black);
}

.confirm-script__copy-all:active {
  transform: translate(2px, 2px);
  box-shadow: none;
}

.confirm-script__copy-all--copied {
  background: var(--color-risk-low);
  color: var(--color-black);
  border-color: var(--color-black);
}

.confirm-script__copy-all-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* ===== 空状态 ===== */
.confirm-script__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-3xl) var(--space-md);
  text-align: center;
  flex: 1;
}

.confirm-script__empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: var(--color-cream);
  color: var(--color-gray-2);
  font-size: 28px;
  font-weight: var(--fw-bold);
  border: var(--border-width-thick) solid var(--color-black);
  box-shadow: var(--shadow-sm);
}

.confirm-script__empty-text {
  font-family: var(--font-italic);
  font-style: italic;
  font-size: var(--fs-body);
  color: var(--color-gray-2);
  margin: 0;
}
</style>
