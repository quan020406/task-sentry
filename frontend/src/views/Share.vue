<script setup lang="ts">
/**
 * Share 页面 - 分享扫描结果（只读）
 *
 * 路由：/share/:id
 *
 * 特点：
 * - 游客可访问，无需登录
 * - 只读模式展示扫描结果（隐藏操作按钮）
 * - 顶部引导条："这是《先别开工》生成的扫描报告 → 我也要扫描"
 * - 底部 CTA："立即使用，扫描你的任务"
 * - 过期/不存在友好提示
 * - SEO 基础优化（title、description）
 *
 * 通过路由 meta.hideAuth 隐藏 LayoutHeader 的登录/个人中心入口
 */
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { shareApi } from '@/api/share'
import { BusinessError } from '@/api/request'
import type { ShareContentResult } from '@/types/share'
import RiskScorePanel from '@/components/business/RiskScorePanel.vue'
import HighlightText from '@/components/business/HighlightText.vue'
import RiskReport from '@/components/business/RiskReport.vue'
import QuestionList from '@/components/business/QuestionList.vue'
import Roadmap from '@/components/business/Roadmap.vue'
import ConfirmScript from '@/components/business/ConfirmScript.vue'
import MvpSuggestion from '@/components/business/MvpSuggestion.vue'
import BrButton from '@/components/base/BrButton.vue'

const props = defineProps<{ id: string }>()

const router = useRouter()

// ===== 状态 =====
const loading = ref(true)
const loadError = ref<string | null>(null)
const errorCode = ref<number | null>(null) // 10601=不存在, 10602=已过期
const shareData = ref<ShareContentResult | null>(null)

// ===== 计算 =====
/** 模糊词数量 */
const highlightCount = computed(() => shareData.value?.result.highlightWords.length ?? 0)

/** 创建时间格式化 */
const createdAtText = computed(() => {
  if (!shareData.value) return ''
  return formatTime(shareData.value.createdAt)
})

/** 过期时间文字 */
const expireText = computed(() => {
  if (!shareData.value?.expireAt) return '永久有效'
  return `${formatTime(shareData.value.expireAt)} 到期`
})

/** 扫描身份（用于确认话术标签） */
const currentIdentity = computed(() => shareData.value?.result.identity ?? null)

// ===== SEO =====
let originalTitle = ''
const defaultDescription = '《先别开工》—— AI 任务需求防返工扫描仪。粘贴任务说明，AI 帮你识别模糊表达、生成追问清单、给出最小交付建议。'

function applySEO(): void {
  originalTitle = document.title
  if (shareData.value) {
    const r = shareData.value.result
    const score = Math.round(r.score)
    const riskMap: Record<string, string> = { high: '高风险', mid: '中风险', low: '低风险' }
    const level = riskMap[r.riskLevel] || r.riskLevel
    document.title = `返工风险${level}（${score}分）| 先别开工 - AI 任务扫描报告`
    setMetaDescription(
      `${level}（${score}分）：${r.summary}。先别开工，先扫一遍返工风险。`,
    )
  } else {
    document.title = '扫描报告分享 | 先别开工 - AI 任务需求防返工扫描仪'
    setMetaDescription(defaultDescription)
  }
}

function setMetaDescription(content: string): void {
  let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'description'
    document.head.appendChild(meta)
  }
  meta.content = content
}

function restoreSEO(): void {
  if (originalTitle) document.title = originalTitle
}

// ===== 工具 =====
function formatTime(s: string): string {
  try {
    const d = new Date(s)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return s
  }
}

// ===== 动作 =====
/** 跳转到扫描页（引导转化） */
function goScan(): void {
  router.push({ name: 'scan' })
}

/** 跳转到首页 */
function goHome(): void {
  router.push({ name: 'home' })
}

/** 加载分享内容 */
async function loadShare(): Promise<void> {
  if (!props.id) {
    loadError.value = '分享链接无效'
    errorCode.value = 10601
    loading.value = false
    return
  }
  try {
    shareData.value = await shareApi.getShare(props.id)
    // 后端理论上不会返回已过期的内容（会抛 10602），此处兜底
    if (shareData.value.isExpired) {
      errorCode.value = 10602
      loadError.value = '该分享链接已过期'
    }
  } catch (e) {
    console.error('[Share] 加载分享失败:', e)
    // 优先读取业务错误码（request 拦截器抛出 BusinessError 含 code 字段）
    if (e instanceof BusinessError) {
      errorCode.value = e.code
      loadError.value = e.message
    } else {
      loadError.value = e instanceof Error ? e.message : '加载失败'
    }
  } finally {
    loading.value = false
    applySEO()
  }
}

// ===== 生命周期 =====
onMounted(loadShare)
onBeforeUnmount(restoreSEO)

// 路由参数变化时重新加载
watch(
  () => props.id,
  () => {
    if (props.id) {
      loading.value = true
      loadError.value = null
      errorCode.value = null
      shareData.value = null
      loadShare()
    }
  },
)
</script>

<template>
  <div class="share-page">
    <!-- ===== 顶部引导条 ===== -->
    <div class="share-guide">
      <div class="share-guide__inner">
        <span class="share-guide__label">// SHARED REPORT</span>
        <span class="share-guide__text">这是《先别开工》生成的扫描报告</span>
        <button class="share-guide__cta" type="button" @click="goScan">
          我也要扫描 →
        </button>
      </div>
    </div>

    <!-- ===== 加载中 ===== -->
    <div v-if="loading" class="share-status">
      <div class="share-status__spinner" aria-hidden="true"></div>
      <p class="share-status__text">// LOADING SHARED REPORT...</p>
      <p class="share-status__sub">正在载入扫描报告</p>
    </div>

    <!-- ===== 加载失败 / 过期 / 不存在 ===== -->
    <div v-else-if="loadError || !shareData" class="share-status share-status--error">
      <span class="share-status__icon" aria-hidden="true">{{
        errorCode === 10602 ? '⏱' : '✕'
      }}</span>
      <p class="share-status__text">
        // {{ errorCode === 10602 ? 'LINK EXPIRED' : 'LINK INVALID' }}
      </p>
      <p class="share-status__sub">
        {{ loadError || '该分享链接无效或已被删除' }}
      </p>
      <p class="share-status__hint">
        你可以自己生成一份任务扫描报告，开工前先扫一遍返工风险。
      </p>
      <div class="share-status__actions">
        <BrButton variant="primary" @click="goScan">立即扫描 →</BrButton>
        <BrButton variant="outline" @click="goHome">返回首页</BrButton>
      </div>
    </div>

    <!-- ===== 报告内容（只读） ===== -->
    <template v-else>
      <!-- 元信息条 -->
      <header class="share-meta">
        <span class="share-meta__crumb">// SHARED SCAN</span>
        <span class="share-meta__sep">/</span>
        <span class="share-meta__id">SHARE-{{ shareData.id.toUpperCase() }}</span>
        <span class="share-meta__spacer"></span>
        <span class="share-meta__views" title="浏览次数">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            />
            <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2" />
          </svg>
          {{ shareData.viewCount }} 次浏览
        </span>
        <span class="share-meta__time">{{ createdAtText }}</span>
        <span class="share-meta__expire">{{ expireText }}</span>
      </header>

      <!-- 顶部：风险评分（只读模式，隐藏操作按钮） -->
      <RiskScorePanel :result="shareData.result" read-only />

      <!-- 主体三栏布局 -->
      <div class="share-grid share-grid--three">
        <!-- 左栏：原始任务 + 模糊词高亮 -->
        <section class="share-card share-card--left">
          <header class="share-card__head">
            <span class="share-card__label">// ORIGINAL TASK</span>
            <h2 class="share-card__title">原始任务</h2>
          </header>
          <div class="share-card__body">
            <HighlightText
              :text="shareData.result.originalText"
              :highlights="shareData.result.highlightWords"
            />
            <div class="share-card__divider"></div>
            <div class="share-hl-summary">
              <span class="share-hl-summary__count">{{ highlightCount }}</span>
              <span class="share-hl-summary__label">处模糊表达</span>
            </div>
          </div>
        </section>

        <!-- 中栏：风险扫描报告 -->
        <section class="share-card share-card--middle">
          <RiskReport :groups="shareData.result.riskGroups" />
        </section>

        <!-- 右栏：追问清单 -->
        <section class="share-card share-card--right">
          <QuestionList
            :must-ask="shareData.result.questions.mustAsk"
            :later-ask="shareData.result.questions.laterAsk"
          />
        </section>
      </div>

      <!-- 底部两栏布局 -->
      <div class="share-grid share-grid--two">
        <!-- 左栏：安全开工路线 + 最小交付版本（上下堆叠） -->
        <div class="share-bottom-left">
          <section class="share-card share-card--bottom">
            <Roadmap :steps="shareData.result.roadmap" />
          </section>
          <section class="share-card share-card--bottom">
            <MvpSuggestion :mvp="shareData.result.mvp" />
          </section>
        </div>
        <!-- 右栏：确认话术 -->
        <section class="share-card share-card--bottom">
          <ConfirmScript
            :script="shareData.result.confirmScript"
            :identity="currentIdentity"
          />
        </section>
      </div>

      <!-- ===== 底部 CTA ===== -->
      <section class="share-bottom-cta">
        <div class="share-bottom-cta__inner">
          <p class="share-bottom-cta__small">// READY TO START?</p>
          <h2 class="share-bottom-cta__title">
            想给你的任务<span class="share-bottom-cta__title-accent">扫一遍</span>？
          </h2>
          <p class="share-bottom-cta__desc">
            粘贴任务说明，AI 帮你识别模糊表达、生成追问清单、给出最小交付建议
          </p>
          <BrButton variant="primary" size="lg" @click="goScan">
            立即使用，扫描你的任务 →
          </BrButton>
          <p class="share-bottom-cta__footer">
            《先别开工》—— AI 任务需求防返工扫描仪
          </p>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.share-page {
  padding: 0 0 var(--space-3xl);
}

/* ===== 顶部引导条 ===== */
.share-guide {
  background: var(--color-gold);
  border-bottom: var(--border-width-thick) solid var(--color-black);
}

.share-guide__inner {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: var(--space-sm) var(--container-px);
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.share-guide__label {
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  color: var(--color-black);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
  opacity: 0.7;
}

.share-guide__text {
  font-family: var(--font-body);
  font-size: var(--fs-body);
  font-weight: var(--fw-bold);
  color: var(--color-black);
}

.share-guide__cta {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  color: var(--color-black);
  background: var(--color-white);
  border: var(--border-width-thin) solid var(--color-black);
  padding: 6px 14px;
  cursor: pointer;
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
  transition: all var(--transition-fast);
}

.share-guide__cta:hover {
  background: var(--color-black);
  color: var(--color-gold);
}

.share-guide__cta:active {
  transform: translate(1px, 1px);
}

/* ===== 加载 / 错误状态 ===== */
.share-status {
  min-height: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-3xl) var(--container-px);
  text-align: center;
}

.share-status--error {
  gap: var(--space-md);
}

.share-status__spinner {
  width: 32px;
  height: 32px;
  border: var(--border-width-thick) solid var(--color-black);
  border-top-color: transparent;
  animation: share-spin 0.7s linear infinite;
  margin-bottom: var(--space-sm);
}

@keyframes share-spin {
  to {
    transform: rotate(360deg);
  }
}

.share-status__icon {
  font-size: 48px;
  font-weight: var(--fw-black);
  color: var(--color-risk-high);
  line-height: 1;
  margin-bottom: var(--space-xs);
}

.share-status__text {
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  color: var(--color-black);
  letter-spacing: var(--ls-label-lg);
  margin: 0;
}

.share-status--error .share-status__text {
  color: var(--color-risk-high);
}

.share-status__sub {
  font-family: var(--font-body);
  font-size: var(--fs-body);
  color: var(--color-gray-2);
  margin: 0;
}

.share-status__hint {
  font-family: var(--font-italic);
  font-style: italic;
  font-size: var(--fs-caption);
  color: var(--color-gray-3);
  margin: var(--space-sm) 0 0;
  max-width: 420px;
}

.share-status__actions {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-md);
  flex-wrap: wrap;
  justify-content: center;
}

/* ===== 元信息条 ===== */
.share-meta {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: var(--space-md) var(--container-px) var(--space-sm);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  flex-wrap: wrap;
}

.share-meta__crumb {
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  color: var(--color-gold-dark);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
}

.share-meta__sep {
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  color: var(--color-gray-1);
}

.share-meta__id {
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  color: var(--color-black);
  letter-spacing: var(--ls-label);
}

.share-meta__spacer {
  flex: 1;
}

.share-meta__views {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  color: var(--color-gray-2);
  letter-spacing: var(--ls-label);
}

.share-meta__views svg {
  width: 14px;
  height: 14px;
}

.share-meta__time {
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  color: var(--color-gray-2);
  letter-spacing: var(--ls-label);
}

.share-meta__expire {
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  color: var(--color-gold-dark);
  letter-spacing: var(--ls-label);
  padding: 2px 8px;
  background: var(--color-cream);
  border: var(--border-width-thin) solid var(--color-black);
}

/* ===== 顶部面板下方间距 ===== */
.share-page > :deep(.risk-panel) {
  max-width: var(--container-max);
  margin: 0 auto var(--space-xl);
  width: 100%;
}

/* ===== Grid 布局 ===== */
.share-grid {
  max-width: var(--container-max);
  margin: 0 auto var(--space-md);
  padding: 0 var(--container-px);
  display: grid;
  gap: var(--space-md);
}

.share-grid--three {
  grid-template-columns: 1fr 1.2fr 1fr;
}

.share-grid--two {
  grid-template-columns: 1fr 1fr;
}

/* 底部左栏：Roadmap + MvpSuggestion 上下堆叠 */
.share-bottom-left {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

/* 响应式（S12 断点对齐 1199/767，策略同 ScanResult）：
 * 平板：三栏重排为「上左+右 / 中全宽」，底部保持两栏
 * 移动：全部单列
 */
@media (max-width: 1199px) {
  .share-grid--three {
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      "left right"
      "middle middle";
  }
  .share-card--left {
    grid-area: left;
  }
  .share-card--middle {
    grid-area: middle;
  }
  .share-card--right {
    grid-area: right;
  }
}

@media (max-width: 767px) {
  .share-grid--three,
  .share-grid--two {
    grid-template-columns: 1fr;
    grid-template-areas: none;
  }
  .share-card--left,
  .share-card--middle,
  .share-card--right {
    grid-area: auto;
  }
  .share-card--middle,
  .share-card--right,
  .share-card--bottom {
    min-height: auto;
  }
  .share-card__title {
    font-size: 18px;
  }
  .share-hl-summary__count {
    font-size: 36px;
  }
}

/* ===== 通用卡片（左栏） ===== */
.share-card--left {
  background: var(--color-white);
  border: var(--border-width-thick) solid var(--color-black);
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
}

/* 中栏/右栏/底部：组件自带边框，外层容器仅保留硬阴影 */
.share-card--middle,
.share-card--right,
.share-card--bottom {
  background: transparent;
  border: none;
  box-shadow: var(--shadow-md);
  min-height: 360px;
}

.share-card--middle > :deep(*),
.share-card--right > :deep(*),
.share-card--bottom > :deep(*) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.share-card__head {
  padding: var(--space-md) var(--space-lg);
  border-bottom: var(--border-width-thick) solid var(--color-black);
  background: var(--color-cream-light);
}

.share-card__label {
  display: block;
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  color: var(--color-gold-dark);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
  margin-bottom: 4px;
}

.share-card__title {
  font-family: var(--font-title);
  font-size: 20px;
  font-weight: var(--fw-black);
  color: var(--color-black);
  letter-spacing: var(--ls-h2);
  line-height: 1;
  margin: 0;
}

.share-card__body {
  padding: var(--space-lg);
  flex: 1;
  display: flex;
  flex-direction: column;
}

.share-card__divider {
  height: var(--border-width-thin);
  background: var(--color-black);
  margin: var(--space-lg) 0;
}

.share-hl-summary {
  display: flex;
  align-items: baseline;
  gap: var(--space-xs);
}

.share-hl-summary__count {
  font-family: var(--font-title);
  font-size: 42px;
  font-weight: var(--fw-black);
  color: var(--color-black);
  line-height: 0.85;
  letter-spacing: -1px;
}

.share-hl-summary__label {
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  color: var(--color-gray-2);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
}

/* ===== 底部 CTA ===== */
.share-bottom-cta {
  background: var(--color-black);
  color: var(--color-gold);
  border-top: var(--border-width-thick) solid var(--color-gold);
  margin-top: var(--space-2xl);
  padding: var(--space-3xl) var(--container-px);
}

.share-bottom-cta__inner {
  max-width: var(--container-max);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-sm);
}

.share-bottom-cta__small {
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  color: var(--color-gold);
  letter-spacing: var(--ls-label-lg);
  text-transform: uppercase;
  opacity: 0.7;
  margin: 0;
}

.share-bottom-cta__title {
  font-family: var(--font-title);
  font-size: 48px;
  font-weight: var(--fw-black);
  color: var(--color-cream);
  letter-spacing: -2px;
  line-height: 1;
  margin: 0;
}

.share-bottom-cta__title-accent {
  color: var(--color-gold);
}

.share-bottom-cta__desc {
  font-family: var(--font-body);
  font-size: 16px;
  color: var(--color-gray-1);
  line-height: var(--lh-body);
  margin: 0 var(--space-md) var(--space-md);
  max-width: 540px;
}

.share-bottom-cta__footer {
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  color: var(--color-gold);
  letter-spacing: var(--ls-label);
  opacity: 0.6;
  margin: var(--space-md) 0 0;
}

/* ===== 响应式：引导条 + 底部 CTA（S12 断点对齐 767）===== */
@media (max-width: 767px) {
  .share-guide__inner {
    gap: var(--space-xs);
  }
  .share-guide__text {
    font-size: var(--fs-caption);
  }
  .share-guide__cta {
    margin-left: 0;
    width: 100%;
    text-align: center;
    padding: 8px 12px;
    min-height: var(--touch-target);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .share-bottom-cta__title {
    font-size: 32px;
    letter-spacing: -1px;
  }
  .share-bottom-cta__desc {
    font-size: 14px;
    margin-left: 0;
    margin-right: 0;
  }
}
</style>
