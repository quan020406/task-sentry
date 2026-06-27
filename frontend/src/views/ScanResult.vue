<script setup lang="ts">
/**
 * ScanResult 页面 - 扫描结果页
 *
 * 完成内容：
 * - 顶部风险评分大卡片（RiskScorePanel，S07）
 * - 左栏：原始任务 + 模糊词高亮（HighlightText，S07）
 * - 中栏：风险扫描报告（RiskReport，S08）
 * - 右栏：追问清单（QuestionList，S08）
 * - 底部左上：安全开工路线（Roadmap，S09）
 * - 底部左下：最小交付版本（MvpSuggestion，S09）
 * - 底部右：确认话术（ConfirmScript，S09）
 * - 数据获取（store 优先，否则 API）
 * - loading / error 状态
 *
 * 路由：/result/:id
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useScanStore } from '@/stores/scan'
import { scanApi } from '@/api/scan'
import { useToast } from '@/composables/useToast'
import type { ScanResult } from '@/types/scan'
import RiskScorePanel from '@/components/business/RiskScorePanel.vue'
import HighlightText from '@/components/business/HighlightText.vue'
import RiskReport from '@/components/business/RiskReport.vue'
import QuestionList from '@/components/business/QuestionList.vue'
import Roadmap from '@/components/business/Roadmap.vue'
import MvpSuggestion from '@/components/business/MvpSuggestion.vue'
import ConfirmScript from '@/components/business/ConfirmScript.vue'
import ShareModal from '@/components/business/ShareModal.vue'
import BrButton from '@/components/base/BrButton.vue'

const props = defineProps<{ id: string }>()

const router = useRouter()
const scanStore = useScanStore()
const { toast } = useToast()

// ===== 状态 =====
const loading = ref(true)
const loadError = ref<string | null>(null)
const result = ref<ScanResult | null>(null)
const isFavorite = ref(false) // 收藏状态（S10 后端持久化）
const favoriteLoading = ref(false) // 收藏请求中
const shareModalVisible = ref(false) // 分享弹窗（S11）

// ===== 计算 =====
/** 模糊词数量 */
const highlightCount = computed(() => result.value?.highlightWords.length ?? 0)

/** 模糊词类型统计（按类型分组计数） */
const highlightTypeStats = computed(() => {
  if (!result.value) return [] as Array<{ type: string; count: number }>
  const map = new Map<string, number>()
  for (const hw of result.value.highlightWords) {
    const t = hw.type || '其他'
    map.set(t, (map.get(t) || 0) + 1)
  }
  return Array.from(map.entries()).map(([type, count]) => ({ type, count }))
})

/** 创建时间格式化 */
const createdAtText = computed(() => {
  if (!result.value) return ''
  try {
    const d = new Date(result.value.createdAt)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return result.value.createdAt
  }
})

/** 当前身份（优先用扫描记录中保存的身份，URL 直接访问时 store 可能为空） */
const currentIdentity = computed(() => result.value?.identity ?? scanStore.selectedIdentity ?? null)

// ===== 动作 =====
/** 重新扫描 */
function handleRescan(): void {
  scanStore.clearScanResult()
  router.push({ name: 'scan' })
}

/** 分享：打开分享弹窗（S11 接入真实分享功能） */
function handleShare(): void {
  if (!result.value) return
  shareModalVisible.value = true
}

/** 收藏 / 取消收藏（调用 API） */
async function handleToggleFavorite(): Promise<void> {
  if (!result.value || favoriteLoading.value) return
  favoriteLoading.value = true
  const prev = isFavorite.value
  // 乐观更新
  isFavorite.value = !prev
  try {
    await scanApi.toggleFavorite(result.value.id)
    toast.success(isFavorite.value ? '已收藏' : '已取消收藏')
  } catch (e) {
    // 回滚
    isFavorite.value = prev
    toast.error('操作失败，请稍后重试')
    console.error('[ScanResult] 收藏失败:', e)
  } finally {
    favoriteLoading.value = false
  }
}

/** 重试加载 */
async function handleRetry(): Promise<void> {
  loading.value = true
  loadError.value = null
  await loadResult()
}

/** 加载扫描结果 */
async function loadResult(): Promise<void> {
  // 优先从 store 读取（刚扫描完）
  if (scanStore.currentScanResult && scanStore.currentScanResult.id === props.id) {
    result.value = scanStore.currentScanResult
    // S10：从结果同步收藏状态
    isFavorite.value = scanStore.currentScanResult.isFavorite ?? false
    loading.value = false
    return
  }

  // 否则从 API 获取
  try {
    result.value = await scanApi.getScanResult(props.id)
    // S10：从后端返回的 isFavorite 同步收藏按钮状态
    isFavorite.value = result.value.isFavorite ?? false
    scanStore.setScanResult(result.value)
  } catch (e) {
    console.error('[ScanResult] 获取扫描结果失败:', e)
    loadError.value = e instanceof Error ? e.message : '获取扫描结果失败'
  } finally {
    loading.value = false
  }
}

onMounted(loadResult)
</script>

<template>
  <div class="result-page">
    <!-- ===== 加载中 ===== -->
    <div v-if="loading" class="result-status">
      <div class="result-status__spinner" aria-hidden="true"></div>
      <p class="result-status__text">// LOADING RESULT...</p>
      <p class="result-status__sub">正在载入扫描报告</p>
    </div>

    <!-- ===== 加载失败 ===== -->
    <div v-else-if="loadError || !result" class="result-status result-status--error">
      <p class="result-status__text">// LOAD FAILED</p>
      <p class="result-status__sub">{{ loadError || '未找到扫描结果' }}</p>
      <BrButton variant="primary" class="result-status__action" @click="handleRetry">
        重试
      </BrButton>
      <BrButton variant="outline" class="result-status__action" @click="handleRescan">
        返回扫描
      </BrButton>
    </div>

    <!-- ===== 结果展示 ===== -->
    <template v-else>
      <!-- 面包屑 + 元信息 -->
      <header class="result-meta">
        <span class="result-meta__crumb">// SCAN RESULT</span>
        <span class="result-meta__sep">/</span>
        <span class="result-meta__id">SCAN-{{ result.id.toUpperCase() }}</span>
        <span class="result-meta__spacer"></span>
        <span class="result-meta__time">{{ createdAtText }}</span>
      </header>

      <!-- 顶部：风险评分大卡片 -->
      <RiskScorePanel
        :result="result"
        :is-favorite="isFavorite"
        @rescan="handleRescan"
        @share="handleShare"
        @toggle-favorite="handleToggleFavorite"
      />

      <!-- 主体三栏布局 -->
      <div class="result-grid result-grid--three">
        <!-- ===== 左栏：原始任务 + 模糊词高亮 ===== -->
        <section class="result-card result-card--left">
          <header class="result-card__head">
            <span class="result-card__label">// ORIGINAL TASK</span>
            <h2 class="result-card__title">原始任务</h2>
          </header>

          <div class="result-card__body">
            <!-- 高亮文本 -->
            <HighlightText
              :text="result.originalText"
              :highlights="result.highlightWords"
            />

            <!-- 分隔线 -->
            <div class="result-card__divider"></div>

            <!-- 模糊词统计 -->
            <div class="hl-stats">
              <div class="hl-stats__head">
                <span class="hl-stats__count">{{ highlightCount }}</span>
                <span class="hl-stats__label">处模糊表达</span>
              </div>

              <!-- 类型分布 -->
              <ul v-if="highlightTypeStats.length" class="hl-stats__types">
                <li
                  v-for="stat in highlightTypeStats"
                  :key="stat.type"
                  class="hl-stats__type"
                >
                  <span class="hl-stats__dot" aria-hidden="true"></span>
                  <span class="hl-stats__type-name">{{ stat.type }}</span>
                  <span class="hl-stats__type-count">×{{ stat.count }}</span>
                </li>
              </ul>

              <!-- 模糊词标签列表 -->
              <ul v-if="result.highlightWords.length" class="hl-stats__tags">
                <li
                  v-for="(hw, idx) in result.highlightWords"
                  :key="`tag-${idx}-${hw.word}`"
                  class="hl-stats__tag"
                  :title="hw.explanation"
                >
                  {{ hw.word }}
                </li>
              </ul>

              <!-- 无模糊词 -->
              <p v-else class="hl-stats__empty">
                未识别到明显模糊表达，仍建议确认关键细节。
              </p>
            </div>
          </div>
        </section>

        <!-- ===== 中栏：风险扫描报告 ===== -->
        <section class="result-card result-card--middle">
          <RiskReport :groups="result.riskGroups" />
        </section>

        <!-- ===== 右栏：追问清单 ===== -->
        <section class="result-card result-card--right">
          <QuestionList
            :must-ask="result.questions.mustAsk"
            :later-ask="result.questions.laterAsk"
          />
        </section>
      </div>

      <!-- 底部两栏布局 -->
      <div class="result-grid result-grid--two">
        <!-- 左栏：安全开工路线 + 最小交付版本（上下堆叠） -->
        <div class="result-bottom-left">
          <section class="result-card result-card--bottom">
            <Roadmap :steps="result.roadmap" />
          </section>
          <section class="result-card result-card--bottom">
            <MvpSuggestion :mvp="result.mvp" />
          </section>
        </div>

        <!-- 右栏：确认话术 -->
        <section class="result-card result-card--bottom">
          <ConfirmScript
            :script="result.confirmScript"
            :identity="currentIdentity"
          />
        </section>
      </div>
    </template>

    <!-- 分享弹窗（S11） -->
    <ShareModal
      v-model="shareModalVisible"
      :scan-id="id"
    />
  </div>
</template>

<style scoped>
.result-page {
  padding: var(--space-xl) 0 var(--space-3xl);
}

/* ===== 加载 / 错误状态 ===== */
.result-status {
  min-height: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-3xl) var(--space-md);
}

.result-status--error {
  gap: var(--space-md);
}

.result-status__spinner {
  width: 32px;
  height: 32px;
  border: var(--border-width-thick) solid var(--color-black);
  border-top-color: transparent;
  animation: result-spin 0.7s linear infinite;
  margin-bottom: var(--space-sm);
}

@keyframes result-spin {
  to {
    transform: rotate(360deg);
  }
}

.result-status__text {
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  color: var(--color-black);
  letter-spacing: var(--ls-label-lg);
  margin: 0;
}

.result-status--error .result-status__text {
  color: var(--color-risk-high);
}

.result-status__sub {
  font-family: var(--font-body);
  font-size: var(--fs-body);
  color: var(--color-gray-2);
  margin: 0;
}

.result-status__action {
  margin-top: var(--space-xs);
}

/* ===== 元信息面包屑 ===== */
.result-meta {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-bottom: var(--space-md);
  flex-wrap: wrap;
}

.result-meta__crumb {
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  color: var(--color-gold-dark);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
}

.result-meta__sep {
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  color: var(--color-gray-1);
}

.result-meta__id {
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  color: var(--color-black);
  letter-spacing: var(--ls-label);
}

.result-meta__spacer {
  flex: 1;
}

.result-meta__time {
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  color: var(--color-gray-2);
  letter-spacing: var(--ls-label);
}

/* ===== 顶部面板下方间距 ===== */
.result-page > :deep(.risk-panel) {
  margin-bottom: var(--space-xl);
}

/* ===== Grid 布局 ===== */
.result-grid {
  display: grid;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.result-grid--three {
  grid-template-columns: 1fr 1.2fr 1fr;
}

.result-grid--two {
  grid-template-columns: 1fr 1fr;
}

/* 响应式（S12 断点对齐 1199/767）：
 * 平板：三栏重排为「上左+右 / 中全宽」，底部保持两栏
 * 移动：全部单列，垂直顺序 原始任务→风险报告→追问清单→开工路线→MVP→确认话术
 */
@media (max-width: 1199px) {
  .result-grid--three {
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      "left right"
      "middle middle";
  }
  .result-card--left {
    grid-area: left;
  }
  .result-card--middle {
    grid-area: middle;
  }
  .result-card--right {
    grid-area: right;
  }
}

@media (max-width: 767px) {
  .result-grid--three,
  .result-grid--two {
    grid-template-columns: 1fr;
    grid-template-areas: none;
  }
  .result-card--left,
  .result-card--middle,
  .result-card--right {
    grid-area: auto;
  }
  /* 中栏/右栏在移动端取消固定 min-height，按内容自适应 */
  .result-card--middle,
  .result-card--right {
    min-height: auto;
  }
  .result-card__title {
    font-size: 18px;
  }
  .hl-stats__count {
    font-size: 36px;
  }
}

/* ===== 通用卡片 ===== */
.result-card {
  background: var(--color-white);
  border: var(--border-width-thick) solid var(--color-black);
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
}

/* 中栏/右栏：组件自带边框，外层容器去除重复边框，仅保留硬阴影与定位 */
.result-card--middle,
.result-card--right {
  background: transparent;
  border: none;
  box-shadow: var(--shadow-md);
  /* 让内部组件高度撑满 */
  min-height: 420px;
}

.result-card--middle > :deep(*),
.result-card--right > :deep(*) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 底部卡片：组件自带边框，外层容器去除重复边框 */
.result-card--bottom {
  background: transparent;
  border: none;
  box-shadow: var(--shadow-md);
}

.result-card--bottom > :deep(*) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 底部左栏：Roadmap + MvpSuggestion 上下堆叠 */
.result-bottom-left {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.result-card__head {
  padding: var(--space-md) var(--space-lg);
  border-bottom: var(--border-width-thick) solid var(--color-black);
  background: var(--color-cream-light);
}

.result-card__label {
  display: block;
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  color: var(--color-gold-dark);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
  margin-bottom: 4px;
}

.result-card__title {
  font-family: var(--font-title);
  font-size: 20px;
  font-weight: var(--fw-black);
  color: var(--color-black);
  letter-spacing: var(--ls-h2);
  line-height: 1;
  margin: 0;
}

.result-card__body {
  padding: var(--space-lg);
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* ===== 左栏：分隔线 + 模糊词统计 ===== */
.result-card__divider {
  height: var(--border-width-thin);
  background: var(--color-black);
  margin: var(--space-lg) 0;
}

.hl-stats {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.hl-stats__head {
  display: flex;
  align-items: baseline;
  gap: var(--space-xs);
}

.hl-stats__count {
  font-family: var(--font-title);
  font-size: 42px;
  font-weight: var(--fw-black);
  color: var(--color-black);
  line-height: 0.85;
  letter-spacing: -1px;
}

.hl-stats__label {
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  color: var(--color-gray-2);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
}

/* 类型分布 */
.hl-stats__types {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs) var(--space-md);
}

.hl-stats__type {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: var(--fs-caption);
  font-weight: var(--fw-bold);
  color: var(--color-gray-3);
  letter-spacing: var(--ls-label);
}

.hl-stats__dot {
  width: 8px;
  height: 8px;
  background: var(--color-gold);
  border: var(--border-width-thin) solid var(--color-black);
  flex-shrink: 0;
}

.hl-stats__type-count {
  color: var(--color-gold-dark);
}

/* 模糊词标签列表 */
.hl-stats__tags {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.hl-stats__tag {
  font-family: var(--font-mono);
  font-size: var(--fs-caption);
  font-weight: var(--fw-bold);
  color: var(--color-black);
  background: var(--color-gold);
  padding: 4px 10px;
  border: var(--border-width-thin) solid var(--color-black);
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 2px;
  cursor: help;
}

.hl-stats__empty {
  font-family: var(--font-italic);
  font-style: italic;
  font-size: var(--fs-body);
  color: var(--color-gray-2);
  margin: 0;
}
</style>
