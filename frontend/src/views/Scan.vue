<script setup lang="ts">
/**
 * Scan 页面 - 扫描输入页
 *
 * 包含：身份选择、任务文本输入、示例任务、开始扫描按钮、使用提示
 */
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  useScanStore,
  EXAMPLE_TASKS,
  type ExampleTask,
} from '@/stores/scan'
import { useUserStore } from '@/stores/user'
import { useToast } from '@/composables/useToast'
import type { IdentityType } from '@/types/user'
import BrButton from '@/components/base/BrButton.vue'
import BrInput from '@/components/base/BrInput.vue'

const router = useRouter()
const scanStore = useScanStore()
const userStore = useUserStore()
const { toast } = useToast()

// 从后端加载身份列表（失败时 store 自动回退本地常量）
onMounted(() => {
  scanStore.loadIdentities()
})

// 错误提示
const errors = reactive({
  identity: '',
  taskText: '',
})

// 提交中
const submitting = ref(false)

// 最大字符数
const MAX_CHARS = 2000

// 字符计数
const charCount = computed(() => scanStore.taskText.length)
const isOverLimit = computed(() => charCount.value > MAX_CHARS)

// 使用提示文案
const usageTip = computed(() => {
  if (userStore.isLoggedIn) {
    return `已扫描 ${userStore.userInfo?.scanCount || 0} 次`
  }
  if (userStore.isGuest) {
    return `游客剩余 ${userStore.guestRemaining} 次免费扫描`
  }
  return '未登录'
})

// 是否可提交
const canSubmit = computed(
  () => scanStore.hasIdentity && scanStore.hasTaskText && !isOverLimit.value && !submitting.value,
)

/** 选择身份 */
function handleSelectIdentity(identity: IdentityType): void {
  scanStore.setIdentity(identity)
  errors.identity = ''
}

/** 处理文本输入 */
function handleInput(value: string): void {
  scanStore.setTaskText(value)
  if (value.trim()) {
    errors.taskText = ''
  }
}

/** 应用示例任务 */
function handleApplyExample(example: ExampleTask): void {
  scanStore.applyExample(example)
  errors.identity = ''
  errors.taskText = ''
  toast.success(`已填充示例：${example.title}`)
}

/** 表单校验 */
function validate(): boolean {
  errors.identity = ''
  errors.taskText = ''

  if (!scanStore.hasIdentity) {
    errors.identity = '请选择你的身份'
  }

  if (!scanStore.hasTaskText) {
    errors.taskText = '请输入任务说明'
  } else if (isOverLimit.value) {
    errors.taskText = `任务说明不能超过 ${MAX_CHARS} 字符`
  }

  return !errors.identity && !errors.taskText
}

/** 开始扫描 */
async function handleStartScan(): Promise<void> {
  if (!validate()) {
    toast.error('请补全信息后再开始扫描')
    return
  }

  // 游客次数检查（前端预检）
  if (userStore.isGuest && userStore.guestRemaining <= 0) {
    toast.warning('今日免费扫描次数已用完，登录后可继续使用')
    router.push({ name: 'login', query: { redirect: '/scan' } })
    return
  }

  submitting.value = true
  try {
    // 短暂延迟，进入扫描动画页
    await new Promise((resolve) => setTimeout(resolve, 300))

    // 跳转到扫描动画页，由动画页发起真实扫描请求
    router.push({ name: 'scan-processing' })
  } catch (e) {
    console.error('[Scan] 启动扫描失败:', e)
  } finally {
    submitting.value = false
  }
}

/** 跳转到登录页 */
function goLogin(): void {
  router.push({ name: 'login', query: { redirect: '/scan' } })
}
</script>

<template>
  <div class="scan-page">
    <!-- ===== 页面标题 ===== -->
    <header class="scan-header">
      <span class="scan-header__breadcrumb">// SCAN INPUT</span>
      <h1 class="scan-header__title">任务返工风险扫描</h1>
      <p class="scan-header__desc">粘贴你的任务说明，AI 帮你扫描返工风险</p>
    </header>

    <!-- ===== 使用提示 ===== -->
    <div class="scan-usage" :class="{ 'scan-usage--guest': userStore.isGuest }">
      <div class="scan-usage__left">
        <span class="scan-usage__label">USAGE</span>
        <span class="scan-usage__value">{{ usageTip }}</span>
      </div>
      <button
        v-if="userStore.isGuest"
        class="scan-usage__login-btn"
        @click="goLogin"
      >
        登录解锁更多 →
      </button>
    </div>

    <!-- ===== 身份选择区域 ===== -->
    <section class="scan-section">
      <div class="scan-section__head">
        <span class="scan-section__label">// STEP 01</span>
        <h2 class="scan-section__title">选择你的身份</h2>
        <p class="scan-section__hint">不同身份会得到不同视角的风险分析</p>
      </div>

      <div class="identity-grid">
        <button
          v-for="opt in scanStore.identities"
          :key="opt.type"
          class="identity-card"
          :class="{ 'identity-card--active': scanStore.selectedIdentity === opt.type }"
          @click="handleSelectIdentity(opt.type)"
        >
          <span class="identity-card__icon">{{ opt.icon }}</span>
          <span class="identity-card__label">{{ opt.label }}</span>
          <span class="identity-card__desc">{{ opt.desc }}</span>
        </button>
      </div>

      <!-- 错误提示 -->
      <p v-if="errors.identity" class="scan-error">{{ errors.identity }}</p>
    </section>

    <!-- ===== 任务文本输入 ===== -->
    <section class="scan-section">
      <div class="scan-section__head">
        <span class="scan-section__label">// STEP 02</span>
        <h2 class="scan-section__title">任务说明</h2>
        <p class="scan-section__hint">把你收到的任务原文粘贴进来，越完整越好</p>
      </div>

      <div class="task-input">
        <BrInput
          :model-value="scanStore.taskText"
          type="textarea"
          :rows="8"
          placeholder="粘贴或输入你收到的任务说明..."
          :error="errors.taskText"
          @update:model-value="handleInput"
        />
        <div class="task-input__counter" :class="{ 'task-input__counter--over': isOverLimit }">
          <span class="task-input__counter-text">
            {{ charCount }} / {{ MAX_CHARS }}
          </span>
        </div>
      </div>
    </section>

    <!-- ===== 示例任务 ===== -->
    <section class="scan-section">
      <div class="scan-section__head">
        <span class="scan-section__label">// EXAMPLES</span>
        <h2 class="scan-section__title">试试这些示例</h2>
        <p class="scan-section__hint">点击卡片自动填充文本框和对应身份</p>
      </div>

      <div class="example-grid">
        <button
          v-for="ex in EXAMPLE_TASKS"
          :key="ex.id"
          class="example-card"
          :class="{ 'example-card--active': scanStore.currentExample === ex.id }"
          @click="handleApplyExample(ex)"
        >
          <div class="example-card__head">
            <span class="example-card__tag">{{ ex.title.split(' · ')[0] }}</span>
            <span class="example-card__arrow">↗</span>
          </div>
          <p class="example-card__text">"{{ ex.text }}"</p>
        </button>
      </div>
    </section>

    <!-- ===== 开始扫描按钮 ===== -->
    <section class="scan-action">
      <BrButton
        variant="primary"
        size="lg"
        block
        :disabled="!canSubmit"
        :loading="submitting"
        @click="handleStartScan"
      >
        {{ submitting ? '扫描中...' : '开 始 扫 描' }}
      </BrButton>
      <p class="scan-action__hint">
        扫描将消耗 1 次配额 · 完整报告包含风险评分、追问清单和工作路线
      </p>
    </section>
  </div>
</template>

<style scoped>
.scan-page {
  padding: var(--space-xl) 0;
  max-width: 960px;
  margin: 0 auto;
}

/* ===== 页面标题 ===== */
.scan-header {
  margin-bottom: var(--space-xl);
}

.scan-header__breadcrumb {
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  color: var(--color-gold-dark);
  letter-spacing: var(--ls-label);
}

.scan-header__title {
  font-family: var(--font-title);
  font-size: var(--fs-h1);
  font-weight: var(--fw-black);
  color: var(--color-black);
  letter-spacing: var(--ls-h1);
  line-height: var(--lh-normal);
  margin: 8px 0 8px;
}

.scan-header__desc {
  font-family: var(--font-body);
  font-size: var(--fs-body-lg);
  color: var(--color-gray-2);
  margin: 0;
}

/* ===== 使用提示条 ===== */
.scan-usage {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-md);
  background: var(--color-white);
  border: var(--border-width-thick) solid var(--color-black);
  margin-bottom: var(--space-xl);
}

.scan-usage--guest {
  background: var(--color-gold);
}

.scan-usage__left {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.scan-usage__label {
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  color: var(--color-gray-2);
  letter-spacing: var(--ls-label);
  padding: 2px 6px;
  border: var(--border-width-thin) solid var(--color-gray-3);
}

.scan-usage--guest .scan-usage__label {
  color: var(--color-black);
  border-color: var(--color-black);
}

.scan-usage__value {
  font-family: var(--font-mono);
  font-size: var(--fs-body);
  font-weight: var(--fw-bold);
  color: var(--color-black);
}

.scan-usage__login-btn {
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  color: var(--color-black);
  background: var(--color-black);
  color: var(--color-gold);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
  padding: 6px 12px;
  border: var(--border-width-thin) solid var(--color-black);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.scan-usage__login-btn:hover {
  background: var(--color-cream);
  color: var(--color-black);
}

/* ===== 通用 section ===== */
.scan-section {
  margin-bottom: var(--space-2xl);
}

.scan-section__head {
  margin-bottom: var(--space-md);
}

.scan-section__label {
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  color: var(--color-gold-dark);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
}

.scan-section__title {
  font-family: var(--font-title);
  font-size: var(--fs-h3);
  font-weight: var(--fw-black);
  color: var(--color-black);
  letter-spacing: var(--ls-h3);
  line-height: 1;
  margin: 6px 0 6px;
}

.scan-section__hint {
  font-family: var(--font-body);
  font-size: var(--fs-body);
  color: var(--color-gray-2);
  margin: 0;
}

/* ===== 身份选择网格 ===== */
.identity-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: var(--space-sm);
}

.identity-card {
  background: var(--color-white);
  border: var(--border-width-thick) solid var(--color-black);
  padding: var(--space-md) var(--space-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 6px;
  position: relative;
}

.identity-card:hover {
  background: var(--color-gold);
  transform: translate(-2px, -2px);
  box-shadow: var(--shadow-sm);
}

.identity-card--active {
  background: var(--color-gold);
  transform: skewX(-5deg) translate(-2px, -2px);
  box-shadow: var(--shadow-md);
}

.identity-card--active::before {
  content: '✓';
  position: absolute;
  top: 4px;
  right: 4px;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: var(--fw-bold);
  color: var(--color-black);
  background: var(--color-white);
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: var(--border-width-thin) solid var(--color-black);
  transform: skewX(5deg);
}

.identity-card__icon {
  font-family: var(--font-title);
  font-size: 28px;
  font-weight: var(--fw-black);
  color: var(--color-black);
  line-height: 1;
  width: 40px;
  height: 40px;
  background: var(--color-cream);
  display: flex;
  align-items: center;
  justify-content: center;
  border: var(--border-width-thin) solid var(--color-black);
  transition: all var(--transition-fast);
}

.identity-card:hover .identity-card__icon,
.identity-card--active .identity-card__icon {
  background: var(--color-black);
  color: var(--color-gold);
}

.identity-card__label {
  font-family: var(--font-title);
  font-size: 14px;
  font-weight: var(--fw-black);
  color: var(--color-black);
  letter-spacing: -0.2px;
  line-height: 1;
}

.identity-card__desc {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-gray-2);
  line-height: 1.3;
  letter-spacing: 0.2px;
}

.identity-card--active .identity-card__desc {
  color: var(--color-black);
  opacity: 0.7;
}

/* ===== 任务输入 ===== */
.task-input {
  position: relative;
}

.task-input__counter {
  display: flex;
  justify-content: flex-end;
  margin-top: 6px;
}

.task-input__counter-text {
  font-family: var(--font-mono);
  font-size: var(--fs-caption);
  font-weight: var(--fw-bold);
  color: var(--color-gray-2);
  letter-spacing: var(--ls-label);
}

.task-input__counter--over .task-input__counter-text {
  color: var(--color-risk-high);
}

/* ===== 示例任务 ===== */
.example-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-md);
}

.example-card {
  background: var(--color-cream);
  border: var(--border-width-thick) solid var(--color-black);
  padding: var(--space-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  text-align: left;
}

.example-card:hover {
  background: var(--color-gold);
  transform: translate(-3px, -3px);
  box-shadow: var(--shadow-md);
}

.example-card--active {
  background: var(--color-gold);
  box-shadow: var(--shadow-md);
}

.example-card--active::after {
  content: '已填充';
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: var(--fw-bold);
  color: var(--color-cream);
  background: var(--color-black);
  padding: 2px 6px;
  letter-spacing: var(--ls-label);
  align-self: flex-start;
}

.example-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.example-card__tag {
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  color: var(--color-gold-dark);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
}

.example-card:hover .example-card__tag,
.example-card--active .example-card__tag {
  color: var(--color-black);
}

.example-card__arrow {
  font-family: var(--font-title);
  font-size: 16px;
  font-weight: var(--fw-black);
  color: var(--color-black);
  transition: transform var(--transition-fast);
}

.example-card:hover .example-card__arrow {
  transform: translate(2px, -2px);
}

.example-card__text {
  font-family: var(--font-italic);
  font-style: italic;
  font-size: var(--fs-body);
  color: var(--color-gray-1);
  line-height: var(--lh-card);
  margin: 0;
}

.example-card:hover .example-card__text,
.example-card--active .example-card__text {
  color: var(--color-black);
}

/* ===== 错误提示 ===== */
.scan-error {
  font-family: var(--font-mono);
  font-size: var(--fs-caption);
  font-weight: var(--fw-bold);
  color: var(--color-risk-high);
  margin: var(--space-sm) 0 0;
  letter-spacing: 0.3px;
}

/* ===== 开始扫描按钮 ===== */
.scan-action {
  margin-top: var(--space-2xl);
  padding-top: var(--space-xl);
  border-top: var(--border-width-thick) solid var(--color-black);
}

.scan-action__hint {
  font-family: var(--font-mono);
  font-size: var(--fs-caption);
  color: var(--color-gray-2);
  text-align: center;
  margin: var(--space-md) 0 0;
  letter-spacing: var(--ls-label);
}

/* ===== 响应式（S12 断点对齐 1199/767）===== */
@media (max-width: 1199px) {
  .identity-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .example-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 767px) {
  .scan-page {
    padding: var(--space-lg) 0;
  }
  .scan-header__title {
    font-size: 40px;
    letter-spacing: -1px;
  }
  .identity-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-xs);
  }
  .example-grid {
    grid-template-columns: 1fr;
  }
  .identity-card {
    padding: var(--space-sm) var(--space-xs);
  }
  .identity-card__icon {
    width: 32px;
    height: 32px;
    font-size: 22px;
  }
  .identity-card__label {
    font-size: 12px;
  }
  .identity-card__desc {
    font-size: 9px;
  }
}
</style>
