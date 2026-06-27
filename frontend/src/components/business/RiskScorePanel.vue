<script setup lang="ts">
/**
 * RiskScorePanel - 顶部风险评分大卡片
 *
 * 新野兽派风格：
 * - 深黑背景 + 3px 黑边 + 硬阴影
 * - 右上角金色 45° 斜纹装饰（半透明）
 * - 大分数（Archivo Black 96px 金色）+ /100 小字
 * - 风险等级标签（高红/中黄/低绿，JetBrains Mono 全大写）
 * - 一句话总结（Work Sans 浅灰）
 * - 进度条（粗边框 + 金色填充）
 * - 操作按钮区（重新扫描 / 分享 / 收藏，右对齐）
 *
 * 事件：
 * - rescan：重新扫描
 * - share：分享
 * - toggle-favorite：切换收藏状态
 */
import { computed } from 'vue'
import type { ScanResult, RiskLevel } from '@/types/scan'

interface Props {
  result: ScanResult
  /** 是否已收藏 */
  isFavorite?: boolean
  /** 只读模式（分享页）：隐藏所有操作按钮 */
  readOnly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isFavorite: false,
  readOnly: false,
})

const emit = defineEmits<{
  (e: 'rescan'): void
  (e: 'share'): void
  (e: 'toggle-favorite'): void
}>()

/** 风险等级文字 */
const riskLabel = computed(() => {
  const map: Record<RiskLevel, string> = {
    high: 'HIGH RISK / 高风险',
    mid: 'MID RISK / 中风险',
    low: 'LOW RISK / 低风险',
  }
  return map[props.result.riskLevel] || props.result.riskLevel
})

/** 风险等级变体 class */
const riskVariant = computed(() => `risk-${props.result.riskLevel}`)

/** 进度条宽度 */
const progressWidth = computed(() => `${Math.max(0, Math.min(100, props.result.score))}%`)

/** 分数（保证显示为整数） */
const scoreText = computed(() => String(Math.round(props.result.score)))

function onRescan(): void {
  emit('rescan')
}
function onShare(): void {
  emit('share')
}
function onToggleFavorite(): void {
  emit('toggle-favorite')
}
</script>

<template>
  <section class="risk-panel" :class="riskVariant">
    <!-- 右上角金色 45° 斜纹装饰 -->
    <div class="risk-panel__stripes" aria-hidden="true"></div>

    <!-- 顶部标签行 -->
    <div class="risk-panel__top">
      <span class="risk-panel__label">// RISK SCORE</span>
      <span class="risk-panel__level" :class="riskVariant">{{ riskLabel }}</span>
    </div>

    <!-- 大分数区 -->
    <div class="risk-panel__score-row">
      <span class="risk-panel__score">{{ scoreText }}</span>
      <span class="risk-panel__unit">/ 100</span>
    </div>

    <!-- 进度条 -->
    <div class="risk-panel__bar" :class="riskVariant">
      <div class="risk-panel__bar-fill" :style="{ width: progressWidth }"></div>
    </div>

    <!-- 一句话总结 -->
    <p class="risk-panel__summary" :class="{ 'risk-panel__summary--last': readOnly }">{{ result.summary }}</p>

    <!-- 操作按钮区（只读模式下隐藏） -->
    <div v-if="!readOnly" class="risk-panel__actions">
      <button class="risk-action risk-action--secondary" type="button" @click="onRescan">
        <svg class="risk-action__icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M3 12a9 9 0 0 1 15.5-6.3L21 8M21 8V3M21 8h-5"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="square"
            stroke-linejoin="miter"
          />
          <path
            d="M21 12a9 9 0 0 1-15.5 6.3L3 16M3 16v5M3 16h5"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="square"
            stroke-linejoin="miter"
          />
        </svg>
        <span>重新扫描</span>
      </button>
      <button class="risk-action risk-action--secondary" type="button" @click="onShare">
        <svg class="risk-action__icon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="6" cy="12" r="2.5" fill="none" stroke="currentColor" stroke-width="2.5" />
          <circle cx="18" cy="6" r="2.5" fill="none" stroke="currentColor" stroke-width="2.5" />
          <circle cx="18" cy="18" r="2.5" fill="none" stroke="currentColor" stroke-width="2.5" />
          <path d="M8 11l8-4M8 13l8 4" fill="none" stroke="currentColor" stroke-width="2.5" />
        </svg>
        <span>分享</span>
      </button>
      <button
        class="risk-action risk-action--icon"
        :class="{ 'risk-action--active': isFavorite }"
        type="button"
        :aria-pressed="isFavorite"
        :title="isFavorite ? '取消收藏' : '收藏'"
        @click="onToggleFavorite"
      >
        <svg class="risk-action__icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 18l-5.9 3 1.2-6.5L2.5 9.4l6.6-.9z"
            :fill="isFavorite ? 'currentColor' : 'none'"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linejoin="miter"
          />
        </svg>
      </button>
    </div>
  </section>
</template>

<style scoped>
.risk-panel {
  position: relative;
  background: var(--color-black);
  color: var(--color-gold);
  border: var(--border-width-thick) solid var(--color-black);
  box-shadow: var(--shadow-lg);
  padding: var(--space-xl) var(--space-xl) var(--space-lg);
  overflow: hidden;
  /* 防止斜纹溢出 */
  isolation: isolate;
}

/* ===== 右上角金色斜纹装饰 ===== */
.risk-panel__stripes {
  position: absolute;
  top: 0;
  right: 0;
  width: 180px;
  height: 180px;
  background-image: repeating-linear-gradient(
    45deg,
    var(--color-gold) 0,
    var(--color-gold) 8px,
    transparent 8px,
    transparent 16px
  );
  opacity: 0.12;
  pointer-events: none;
  z-index: 0;
  /* 斜切边缘，让装饰更有设计感 */
  clip-path: polygon(40% 0, 100% 0, 100% 60%);
}

/* ===== 顶部标签行 ===== */
.risk-panel__top {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.risk-panel__label {
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  color: var(--color-gold);
  letter-spacing: var(--ls-label-lg);
  text-transform: uppercase;
  opacity: 0.7;
}

/* ===== 风险等级标签 ===== */
.risk-panel__level {
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
  padding: 5px 10px;
  border: var(--border-width-thin) solid currentColor;
  white-space: nowrap;
}

.risk-panel__level.risk-high {
  color: var(--color-risk-high);
}
.risk-panel__level.risk-mid {
  color: var(--color-risk-mid);
}
.risk-panel__level.risk-low {
  color: var(--color-risk-low);
}

/* ===== 大分数 ===== */
.risk-panel__score-row {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: var(--space-md);
}

.risk-panel__score {
  font-family: var(--font-title);
  font-size: 112px;
  font-weight: var(--fw-black);
  color: var(--color-gold);
  line-height: 0.85;
  letter-spacing: -4px;
}

.risk-panel__unit {
  font-family: var(--font-mono);
  font-size: var(--fs-h3);
  font-weight: var(--fw-bold);
  color: var(--color-gold);
  opacity: 0.6;
  letter-spacing: var(--ls-label);
}

/* ===== 进度条 ===== */
.risk-panel__bar {
  position: relative;
  z-index: 1;
  height: 14px;
  background: var(--color-gray-5);
  border: var(--border-width-thin) solid var(--color-gold);
  margin-bottom: var(--space-md);
  overflow: hidden;
}

.risk-panel__bar-fill {
  height: 100%;
  background: var(--color-gold);
  transition: width 0.5s linear;
}

/* 不同风险等级的进度条填充颜色提示（保持金色为主，仅边框微调） */
.risk-panel__bar.risk-high {
  border-color: var(--color-risk-high);
}
.risk-panel__bar.risk-mid {
  border-color: var(--color-risk-mid);
}
.risk-panel__bar.risk-low {
  border-color: var(--color-risk-low);
}

/* ===== 一句话总结 ===== */
.risk-panel__summary {
  position: relative;
  z-index: 1;
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: var(--fw-regular);
  line-height: var(--lh-card);
  color: var(--color-cream);
  margin: 0 0 var(--space-lg);
  /* 引号装饰 */
  text-indent: 0;
}

.risk-panel__summary::before {
  content: '“';
  font-family: var(--font-italic);
  font-style: italic;
  font-size: 24px;
  color: var(--color-gold);
  margin-right: 4px;
  line-height: 0;
  vertical-align: -6px;
}

/* 只读模式（分享页）：作为最后一个元素，去掉底部间距 */
.risk-panel__summary--last {
  margin-bottom: 0;
}

/* ===== 操作按钮 ===== */
.risk-panel__actions {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: var(--space-sm);
  padding-top: var(--space-md);
  border-top: var(--border-width-thin) solid var(--color-gold);
}

.risk-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
  padding: 8px 14px;
  background: transparent;
  color: var(--color-gold);
  border: var(--border-width-thin) solid var(--color-gold);
  cursor: pointer;
  user-select: none;
  transition: all var(--transition-fast);
}

.risk-action__icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.risk-action--secondary:hover {
  background: var(--color-gold);
  color: var(--color-black);
}
.risk-action--secondary:active {
  transform: translate(1px, 1px);
}

/* 图标按钮（收藏） */
.risk-action--icon {
  padding: 8px;
  width: 36px;
  height: 36px;
  justify-content: center;
}
.risk-action--icon:hover {
  background: var(--color-gold);
  color: var(--color-black);
}
.risk-action--icon:active {
  transform: translate(1px, 1px);
}

/* 收藏激活态：金色填充 */
.risk-action--active {
  background: var(--color-gold);
  color: var(--color-black);
}

/* ===== 响应式（S12 断点对齐 767）===== */
@media (max-width: 767px) {
  .risk-panel {
    padding: var(--space-lg) var(--space-md) var(--space-md);
  }
  .risk-panel__score {
    font-size: 80px;
    letter-spacing: -3px;
  }
  .risk-panel__stripes {
    width: 120px;
    height: 120px;
  }
  .risk-panel__top {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-xs);
  }
  .risk-panel__actions {
    flex-wrap: wrap;
    justify-content: stretch;
  }
  /* 移动端操作按钮整行展开，保证触摸高度 */
  .risk-action {
    flex: 1;
    justify-content: center;
    min-height: var(--touch-target);
    padding: 10px 14px;
  }
  .risk-action--icon {
    flex: 0 0 var(--touch-target);
    width: var(--touch-target);
    height: var(--touch-target);
    padding: 8px;
  }
}
</style>
