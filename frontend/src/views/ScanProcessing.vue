<script setup lang="ts">
/**
 * ScanProcessing 页面 - 扫描动画页
 *
 * 新野兽派风格扫描动画：
 * - 文档形状主体 + 粗黑边框
 * - 金色扫描线从上到下移动
 * - 4 个阶段进度文字
 * - 进度条 + 百分比
 * - API 返回后跳转结果页
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { scanApi } from '@/api/scan'
import { useScanStore } from '@/stores/scan'
import { useUserStore } from '@/stores/user'
import { useToast } from '@/composables/useToast'
import BrButton from '@/components/base/BrButton.vue'

const router = useRouter()
const scanStore = useScanStore()
const userStore = useUserStore()
const { toast } = useToast()

// ===== 状态 =====
type ScanStatus = 'scanning' | 'success' | 'error'
const status = ref<ScanStatus>('scanning')
const progress = ref(0) // 0-100
const errorMessage = ref('')
const isRetrying = ref(false)

// ===== 阶段定义 =====
const STAGES = [
  { name: '正在解析任务...', range: [0, 25] as const },
  { name: '识别模糊表达...', range: [25, 50] as const },
  { name: '扫描返工风险...', range: [50, 75] as const },
  { name: '生成确认话术...', range: [75, 100] as const },
]

// 当前阶段索引
const currentStageIndex = computed(() => {
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (progress.value >= STAGES[i].range[0]) {
      return i
    }
  }
  return 0
})

// 当前阶段文字
const currentStageName = computed(() => STAGES[currentStageIndex.value].name)

// 百分比显示
const percentText = computed(() => `${Math.floor(progress.value)}%`)

// ===== 定时器 =====
let progressTimer: ReturnType<typeof setInterval> | null = null
let completeTimer: ReturnType<typeof setTimeout> | null = null

/** 启动进度条动画（预估 4 秒走完 0→95%，剩余 5% 等 API 返回） */
function startProgressAnimation(): void {
  stopProgressAnimation()
  progress.value = 0

  // 每 80ms 增加约 2%，4 秒到 95%
  progressTimer = setInterval(() => {
    if (progress.value < 95) {
      // 缓动：越接近 95 越慢
      const remaining = 95 - progress.value
      const step = Math.max(0.3, remaining * 0.04)
      progress.value = Math.min(95, progress.value + step)
    }
  }, 80)
}

/** 停止进度条动画 */
function stopProgressAnimation(): void {
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
}

/** 完成进度条（跳到 100%） */
function completeProgress(): void {
  stopProgressAnimation()
  progress.value = 100
}

/** 发起扫描请求 */
async function startScan(): Promise<void> {
  // 检查必要参数
  if (!scanStore.hasIdentity || !scanStore.hasTaskText) {
    status.value = 'error'
    errorMessage.value = '缺少任务文本或身份信息，请返回重新输入'
    return
  }

  status.value = 'scanning'
  scanStore.setScanning(true)
  scanStore.setScanError(null)
  startProgressAnimation()

  try {
    const result = await scanApi.startScan({
      taskText: scanStore.taskText.trim(),
      identity: scanStore.selectedIdentity!,
    })

    // API 返回，完成进度条
    completeProgress()
    scanStore.setScanResult(result)

    // 更新游客剩余次数（前端预估）
    if (userStore.isGuest) {
      userStore.updateGuestRemaining(Math.max(0, userStore.guestRemaining - 1))
    }

    // 停留 600ms 后跳转结果页
    completeTimer = setTimeout(() => {
      status.value = 'success'
      router.push({ name: 'result', params: { id: result.id } })
    }, 600)
  } catch (e: unknown) {
    stopProgressAnimation()
    status.value = 'error'

    // 提取错误信息
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    errorMessage.value =
      err?.response?.data?.message ||
      err?.message ||
      '扫描失败，请稍后重试'

    scanStore.setScanError(errorMessage.value)
    toast.error(errorMessage.value)
  } finally {
    scanStore.setScanning(false)
  }
}

/** 重试 */
async function handleRetry(): Promise<void> {
  isRetrying.value = true
  await startScan()
  isRetrying.value = false
}

/** 返回输入页 */
function handleBack(): void {
  router.push({ name: 'scan' })
}

// ===== 生命周期 =====
onMounted(() => {
  startScan()
})

onUnmounted(() => {
  stopProgressAnimation()
  if (completeTimer) {
    clearTimeout(completeTimer)
  }
})
</script>

<template>
  <div class="processing-page">
    <div class="processing-page__inner">
      <!-- ===== 扫描中 / 成功 ===== -->
      <template v-if="status !== 'error'">
        <!-- 标题区 -->
        <header class="processing-header">
          <span class="processing-header__label">// SCANNING</span>
          <h1 class="processing-header__title">
            <span v-if="progress < 100">正在扫描</span>
            <span v-else>扫描完成</span>
          </h1>
        </header>

        <!-- 扫描主体动画区 -->
        <div class="scan-stage">
          <!-- 文档主体 -->
          <div class="scan-doc" :class="{ 'scan-doc--done': progress >= 100 }">
            <!-- 文档头部标签 -->
            <div class="scan-doc__tag">TASK</div>
            <!-- 文档内代表文字的横线 -->
            <div class="scan-doc__lines">
              <div class="scan-doc__line" v-for="i in 7" :key="i" :style="{ width: `${[100, 92, 96, 88, 100, 75, 60][i-1]}%` }" />
            </div>
            <!-- 扫描线 -->
            <div v-if="progress < 100" class="scan-line" />
            <!-- 完成标记 -->
            <div v-else class="scan-doc__done-mark">✓</div>
          </div>

          <!-- 装饰角标 -->
          <div class="scan-stage__corner scan-stage__corner--tl">◆</div>
          <div class="scan-stage__corner scan-stage__corner--tr">▌</div>
          <div class="scan-stage__corner scan-stage__corner--bl">●</div>
          <div class="scan-stage__corner scan-stage__corner--br">▲</div>
        </div>

        <!-- 阶段进度文字 -->
        <div class="stages">
          <div
            v-for="(stage, idx) in STAGES"
            :key="idx"
            class="stage"
            :class="{
              'stage--active': idx === currentStageIndex && progress < 100,
              'stage--done': idx < currentStageIndex || progress >= 100,
            }"
          >
            <span class="stage__dot" />
            <span class="stage__no">{{ String(idx + 1).padStart(2, '0') }}</span>
            <span class="stage__name">{{ stage.name }}</span>
          </div>
        </div>

        <!-- 进度条 -->
        <div class="progress-bar">
          <div class="progress-bar__track">
            <div class="progress-bar__fill" :style="{ width: `${progress}%` }" />
          </div>
          <span class="progress-bar__percent">{{ percentText }}</span>
        </div>

        <!-- 提示文字 -->
        <p class="processing-tip">
          {{ progress >= 100 ? '正在生成报告...' : 'AI 正在分析你的任务说明，请稍候' }}
        </p>
      </template>

      <!-- ===== 错误状态 ===== -->
      <template v-else>
        <div class="error-state">
          <div class="error-state__icon">!</div>
          <span class="error-state__label">// ERROR</span>
          <h1 class="error-state__title">扫描失败</h1>
          <p class="error-state__msg">{{ errorMessage }}</p>

          <div class="error-state__actions">
            <BrButton
              variant="primary"
              :loading="isRetrying"
              @click="handleRetry"
            >
              {{ isRetrying ? '重试中...' : '重新扫描' }}
            </BrButton>
            <BrButton variant="outline" @click="handleBack">
              返回修改
            </BrButton>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.processing-page {
  /* S12：用 flex:1 撑满 MainLayout 内容区，替代硬编码 calc(100vh - 64px - 64px) */
  flex: 1;
  min-height: 480px;
  background: var(--color-black);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl) var(--container-px);
  position: relative;
  overflow: hidden;
}

.processing-page__inner {
  width: 100%;
  max-width: 640px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 2;
}

/* ===== 标题区 ===== */
.processing-header {
  text-align: center;
  margin-bottom: var(--space-2xl);
}

.processing-header__label {
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  color: var(--color-gold);
  letter-spacing: var(--ls-label);
  opacity: 0.7;
}

.processing-header__title {
  font-family: var(--font-title);
  font-size: 48px;
  font-weight: var(--fw-black);
  color: var(--color-cream);
  letter-spacing: -1.5px;
  line-height: 1;
  margin: 8px 0 0;
}

/* ===== 扫描主体舞台 ===== */
.scan-stage {
  position: relative;
  width: 280px;
  height: 340px;
  margin-bottom: var(--space-2xl);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 文档主体 */
.scan-doc {
  width: 220px;
  height: 280px;
  background: var(--color-white);
  border: var(--border-width-heavy) solid var(--color-gold);
  box-shadow: 8px 8px 0 var(--color-gold);
  padding: var(--space-md) var(--space-md) 0;
  position: relative;
  overflow: hidden;
  transition: all var(--transition-normal);
}

.scan-doc--done {
  border-color: var(--color-gold);
  box-shadow: 8px 8px 0 var(--color-gold);
}

/* 文档头部标签 */
.scan-doc__tag {
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  color: var(--color-gold-dark);
  letter-spacing: var(--ls-label);
  padding-bottom: var(--space-sm);
  margin-bottom: var(--space-md);
  border-bottom: var(--border-width-thin) solid var(--color-black);
}

/* 文档内代表文字的横线 */
.scan-doc__lines {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.scan-doc__line {
  height: 6px;
  background: var(--color-gray-4);
}

/* 扫描线 - 金色粗横线，从上到下移动 */
.scan-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--color-gold);
  /* 硬边光效，不模糊 */
  box-shadow:
    0 -2px 0 var(--color-gold),
    0 2px 0 var(--color-gold),
    0 0 0 1px var(--color-black);
  animation: scan-line-move 2s ease-in-out infinite;
  z-index: 2;
}

@keyframes scan-line-move {
  0% {
    top: 0;
  }
  50% {
    top: calc(100% - 4px);
  }
  100% {
    top: 0;
  }
}

/* 完成标记 */
.scan-doc__done-mark {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-title);
  font-size: 80px;
  font-weight: var(--fw-black);
  color: var(--color-gold);
  background: var(--color-white);
  animation: done-pop 0.4s ease-out;
}

@keyframes done-pop {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  60% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 装饰角标 */
.scan-stage__corner {
  position: absolute;
  color: var(--color-gold);
  opacity: 0.3;
  font-family: var(--font-title);
  font-weight: var(--fw-black);
}

.scan-stage__corner--tl {
  top: 0;
  left: 0;
  font-size: 24px;
  transform: rotate(-15deg);
}

.scan-stage__corner--tr {
  top: 0;
  right: 0;
  font-size: 32px;
}

.scan-stage__corner--bl {
  bottom: 0;
  left: 0;
  font-size: 18px;
}

.scan-stage__corner--br {
  bottom: 0;
  right: 0;
  font-size: 28px;
  transform: rotate(15deg);
}

/* ===== 阶段进度文字 ===== */
.stages {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  margin-bottom: var(--space-xl);
}

.stage {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 8px 12px;
  border-left: var(--border-width-thin) solid transparent;
  transition: all var(--transition-fast);
}

.stage__dot {
  width: 8px;
  height: 8px;
  background: var(--color-gray-2);
  opacity: 0.3;
  flex-shrink: 0;
}

.stage--active {
  border-left-color: var(--color-gold);
  background: rgba(255, 215, 0, 0.08);
}

.stage--active .stage__dot {
  background: var(--color-gold);
  opacity: 1;
  animation: dot-blink 0.8s ease-in-out infinite;
}

@keyframes dot-blink {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(0.7);
  }
}

.stage--done .stage__dot {
  background: var(--color-gold);
  opacity: 0.6;
}

.stage__no {
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  color: var(--color-gray-1);
  opacity: 0.4;
  letter-spacing: var(--ls-label);
}

.stage--active .stage__no,
.stage--done .stage__no {
  color: var(--color-gold);
  opacity: 1;
}

.stage__name {
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  color: var(--color-gray-1);
  opacity: 0.5;
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
}

.stage--active .stage__name,
.stage--done .stage__name {
  color: var(--color-cream);
  opacity: 1;
}

/* ===== 进度条 ===== */
.progress-bar {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.progress-bar__track {
  flex: 1;
  height: 20px;
  background: var(--color-cream);
  border: var(--border-width-thick) solid var(--color-gold);
  position: relative;
  overflow: hidden;
}

.progress-bar__fill {
  height: 100%;
  background: var(--color-gold);
  /* 条纹装饰 */
  background-image: repeating-linear-gradient(
    -45deg,
    transparent,
    transparent 6px,
    rgba(0, 0, 0, 0.15) 6px,
    rgba(0, 0, 0, 0.15) 12px
  );
  transition: width 0.1s linear;
}

.progress-bar__percent {
  font-family: var(--font-title);
  font-size: 24px;
  font-weight: var(--fw-black);
  color: var(--color-gold);
  letter-spacing: -0.5px;
  min-width: 64px;
  text-align: right;
}

/* ===== 提示文字 ===== */
.processing-tip {
  font-family: var(--font-italic);
  font-style: italic;
  font-size: var(--fs-body);
  color: var(--color-gray-1);
  opacity: 0.7;
  margin: 0;
  text-align: center;
}

/* ===== 错误状态 ===== */
.error-state {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-2xl);
  background: var(--color-white);
  border: var(--border-width-heavy) solid var(--color-risk-high);
  box-shadow: var(--shadow-lg);
  max-width: 480px;
}

.error-state__icon {
  width: 64px;
  height: 64px;
  background: var(--color-risk-high);
  color: var(--color-white);
  font-family: var(--font-title);
  font-size: 48px;
  font-weight: var(--fw-black);
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  margin-bottom: var(--space-sm);
}

.error-state__label {
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  color: var(--color-risk-high);
  letter-spacing: var(--ls-label);
}

.error-state__title {
  font-family: var(--font-title);
  font-size: 36px;
  font-weight: var(--fw-black);
  color: var(--color-black);
  letter-spacing: -1px;
  line-height: 1;
  margin: 4px 0;
}

.error-state__msg {
  font-family: var(--font-body);
  font-size: var(--fs-body);
  color: var(--color-gray-2);
  line-height: var(--lh-card);
  margin: 0 0 var(--space-md);
  max-width: 360px;
}

.error-state__actions {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}

/* ===== 响应式（S12 断点对齐）===== */
@media (max-width: 767px) {
  .processing-page {
    padding: var(--space-xl) var(--space-lg);
  }
  .processing-header__title {
    font-size: 36px;
  }
  .scan-stage {
    width: 240px;
    height: 300px;
  }
  .scan-doc {
    width: 180px;
    height: 240px;
  }
  .progress-bar__percent {
    font-size: 20px;
    min-width: 52px;
  }
  .stage__name {
    font-size: 11px;
  }
}
</style>
