<script setup lang="ts">
/**
 * ShareModal - 分享弹窗组件
 *
 * 新野兽派风格：
 * - 粗边框 + 硬阴影
 * - 有效期选择（7 天 / 30 天 / 永久）
 * - 生成链接后醒目展示 + 大复制按钮
 * - 链接输入框只读
 *
 * 流程：选择有效期 → 生成链接 → 复制链接
 */
import { ref, watch } from 'vue'
import { shareApi } from '@/api/share'
import { useToast } from '@/composables/useToast'
import type { ExpireDays, CreateShareResult } from '@/types/share'
import BrModal from '@/components/base/BrModal.vue'
import BrButton from '@/components/base/BrButton.vue'

interface Props {
  modelValue: boolean
  /** 要分享的扫描记录 ID */
  scanId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'close': []
}>()

const { toast } = useToast()

// ===== 状态 =====
const expireDays = ref<ExpireDays>(7)
const generating = ref(false)
const shareResult = ref<CreateShareResult | null>(null)
const copied = ref(false)

/** 有效期选项 */
const expireOptions: Array<{ value: ExpireDays; label: string; desc: string }> = [
  { value: 7, label: '7 天', desc: '短期分享' },
  { value: 30, label: '30 天', desc: '一个月' },
  { value: 0, label: '永久', desc: '长期有效' },
]

// ===== 动作 =====
/** 生成分享链接 */
async function handleGenerate(): Promise<void> {
  if (generating.value || !props.scanId) return
  generating.value = true
  copied.value = false
  try {
    const result = await shareApi.createShare(props.scanId, expireDays.value)
    shareResult.value = result
    toast.success('分享链接已生成')
  } catch (e) {
    console.error('[ShareModal] 生成分享失败:', e)
  } finally {
    generating.value = false
  }
}

/** 复制链接 */
async function handleCopy(): Promise<void> {
  if (!shareResult.value?.url) return
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(shareResult.value.url)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = shareResult.value.url
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    copied.value = true
    toast.success('链接已复制到剪贴板')
    setTimeout(() => {
      copied.value = false
    }, 1500)
  } catch (err) {
    toast.error('复制失败，请手动复制')
    console.error('[ShareModal] 复制失败:', err)
  }
}

/** 关闭弹窗 */
function handleClose(): void {
  emit('update:modelValue', false)
  emit('close')
}

/** 弹窗打开/关闭时重置状态 */
watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      // 打开时重置
      expireDays.value = 7
      shareResult.value = null
      copied.value = false
      generating.value = false
    }
  },
)
</script>

<template>
  <BrModal
    :model-value="modelValue"
    title="分享扫描结果"
    width="520px"
    @update:model-value="emit('update:modelValue', $event)"
    @close="handleClose"
  >
    <div class="share-modal">
      <!-- 有效期选择 -->
      <div class="share-modal__section">
        <label class="share-modal__label">// VALIDITY</label>
        <p class="share-modal__hint">选择分享链接的有效期</p>
        <div class="share-modal__options">
          <button
            v-for="opt in expireOptions"
            :key="opt.value"
            class="share-modal__option"
            :class="{ 'share-modal__option--active': expireDays === opt.value }"
            type="button"
            :disabled="generating"
            @click="expireDays = opt.value"
          >
            <span class="share-modal__option-label">{{ opt.label }}</span>
            <span class="share-modal__option-desc">{{ opt.desc }}</span>
          </button>
        </div>
      </div>

      <!-- 未生成：生成按钮 -->
      <div v-if="!shareResult" class="share-modal__section">
        <BrButton
          variant="primary"
          block
          :loading="generating"
          @click="handleGenerate"
        >
          {{ generating ? '生成中...' : '生成分享链接' }}
        </BrButton>
      </div>

      <!-- 已生成：链接展示 + 复制 -->
      <div v-else class="share-modal__section">
        <label class="share-modal__label">// SHARE LINK</label>
        <p class="share-modal__hint">复制链接发送给他人，无需登录即可查看</p>

        <!-- 链接输入框（只读） -->
        <div class="share-modal__link">
          <input
            class="share-modal__link-input"
            :value="shareResult.url"
            readonly
            @click="($event.target as HTMLInputElement).select()"
          />
        </div>

        <!-- 大复制按钮 -->
        <BrButton
          variant="primary"
          block
          class="share-modal__copy-btn"
          @click="handleCopy"
        >
          {{ copied ? '✓ 已复制' : '复制链接' }}
        </BrButton>

        <!-- 重新生成 -->
        <button
          class="share-modal__regenerate"
          type="button"
          :disabled="generating"
          @click="handleGenerate"
        >
          重新生成链接
        </button>
      </div>
    </div>

    <template #footer>
      <BrButton variant="secondary" @click="handleClose">关闭</BrButton>
    </template>
  </BrModal>
</template>

<style scoped>
.share-modal {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.share-modal__section {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.share-modal__label {
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  color: var(--color-gold-dark);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
}

.share-modal__hint {
  font-family: var(--font-body);
  font-size: var(--fs-caption);
  color: var(--color-gray-2);
  margin: 0 0 var(--space-xs);
}

/* ===== 有效期选项 ===== */
.share-modal__options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-xs);
}

.share-modal__option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: var(--space-sm) var(--space-xs);
  background: var(--color-white);
  border: var(--border-width-thick) solid var(--color-black);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-family: var(--font-mono);
}

.share-modal__option:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.share-modal__option:hover:not(:disabled) {
  background: var(--color-gold);
  transform: translate(-1px, -1px);
  box-shadow: var(--shadow-sm);
}

/* 激活态：黑底金字 */
.share-modal__option--active {
  background: var(--color-black);
  color: var(--color-gold);
}

.share-modal__option--active:hover:not(:disabled) {
  background: var(--color-black);
  color: var(--color-gold);
  transform: none;
  box-shadow: none;
}

.share-modal__option-label {
  font-family: var(--font-title);
  font-size: 18px;
  font-weight: var(--fw-black);
  letter-spacing: var(--ls-h2);
}

.share-modal__option-desc {
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  letter-spacing: var(--ls-label);
  opacity: 0.7;
}

/* ===== 链接展示 ===== */
.share-modal__link {
  margin-bottom: var(--space-sm);
}

.share-modal__link-input {
  width: 100%;
  font-family: var(--font-mono);
  font-size: var(--fs-caption);
  font-weight: var(--fw-bold);
  color: var(--color-black);
  background: var(--color-cream-light);
  border: var(--border-width-thick) solid var(--color-black);
  padding: var(--space-sm) var(--space-md);
  outline: none;
  cursor: pointer;
  box-sizing: border-box;
  letter-spacing: 0.2px;
}

.share-modal__link-input:focus {
  background: var(--color-gold);
}

/* ===== 复制按钮 ===== */
.share-modal__copy-btn {
  margin-bottom: var(--space-sm);
}

/* ===== 重新生成 ===== */
.share-modal__regenerate {
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  color: var(--color-gray-2);
  background: transparent;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
  letter-spacing: var(--ls-label);
  transition: color var(--transition-fast);
  align-self: center;
}

.share-modal__regenerate:hover:not(:disabled) {
  color: var(--color-black);
}

.share-modal__regenerate:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
