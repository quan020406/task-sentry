<script setup lang="ts">
/**
 * RiskItem - 单条风险条目
 *
 * 新野兽派风格：
 * - 左侧大号序号数字（Archivo Black，浅灰，hover 金色）
 * - 等级标签（高红/中黄/低绿，JetBrains Mono 全大写）
 * - 发现依据（引用原文，左侧粗边框 + 浅米背景）
 * - 可能后果（红色前缀标签）
 * - 建议处理方式（金色前缀标签）
 * - 条目之间虚线分隔
 *
 * 数据字段（types/scan.d.ts RiskItem）：
 * - text: 发现依据（原文引用）
 * - level: high | mid | low
 * - reason: 可能后果
 * - suggestion: 建议处理方式
 */
import { computed } from 'vue'
import type { RiskItem as RiskItemType, RiskLevel } from '@/types/scan'

interface Props {
  item: RiskItemType
  /** 序号（从 1 开始） */
  index: number
}

const props = defineProps<Props>()

const levelLabel = computed(() => {
  const map: Record<RiskLevel, string> = {
    high: 'HIGH / 高',
    mid: 'MID / 中',
    low: 'LOW / 低',
  }
  return map[props.item.level] || props.item.level
})

const levelClass = computed(() => `risk-item--${props.item.level}`)

/** 序号补零（01、02...） */
const indexText = computed(() => String(props.index).padStart(2, '0'))
</script>

<template>
  <article class="risk-item" :class="levelClass">
    <!-- 顶部行：序号 + 等级标签 -->
    <div class="risk-item__top">
      <span class="risk-item__index">{{ indexText }}</span>
      <span class="risk-item__level">{{ levelLabel }}</span>
    </div>

    <!-- 发现依据（引用原文） -->
    <div class="risk-item__quote">
      <span class="risk-item__quote-label">// 依据</span>
      <p class="risk-item__quote-text">"{{ item.text }}"</p>
    </div>

    <!-- 可能后果 -->
    <div class="risk-item__field risk-item__field--consequence">
      <span class="risk-item__field-label">后果</span>
      <p class="risk-item__field-text">{{ item.reason }}</p>
    </div>

    <!-- 建议处理方式 -->
    <div class="risk-item__field risk-item__field--suggestion">
      <span class="risk-item__field-label">建议</span>
      <p class="risk-item__field-text">{{ item.suggestion }}</p>
    </div>
  </article>
</template>

<style scoped>
.risk-item {
  position: relative;
  padding: var(--space-md) 0;
  /* 虚线分隔 */
  border-bottom: 2px dashed var(--color-gray-3);
}

.risk-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.risk-item:first-child {
  padding-top: 0;
}

/* ===== 顶部行 ===== */
.risk-item__top {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

/* 序号 */
.risk-item__index {
  font-family: var(--font-title);
  font-size: 32px;
  font-weight: var(--fw-black);
  color: var(--color-gray-3);
  line-height: 0.85;
  letter-spacing: -1px;
  transition: color var(--transition-fast);
}

.risk-item:hover .risk-item__index {
  color: var(--color-gold);
}

/* 等级标签 */
.risk-item__level {
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
  padding: 3px 8px;
  border: var(--border-width-thin) solid currentColor;
  white-space: nowrap;
}

.risk-item--high .risk-item__level {
  color: var(--color-risk-high);
}
.risk-item--mid .risk-item__level {
  color: var(--color-risk-mid);
}
.risk-item--low .risk-item__level {
  color: var(--color-risk-low);
}

/* ===== 发现依据（引用原文） ===== */
.risk-item__quote {
  background: var(--color-cream-light);
  border-left: var(--border-width-thick) solid var(--color-black);
  padding: var(--space-sm) var(--space-md);
  margin-bottom: var(--space-sm);
}

.risk-item__quote-label {
  display: block;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: var(--fw-bold);
  color: var(--color-gray-2);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
  margin-bottom: 4px;
}

.risk-item__quote-text {
  font-family: var(--font-italic);
  font-style: italic;
  font-size: 14px;
  line-height: var(--lh-body);
  color: var(--color-black);
  margin: 0;
}

/* ===== 字段区（后果 / 建议） ===== */
.risk-item__field {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-xs);
  align-items: flex-start;
}

.risk-item__field:last-child {
  margin-bottom: 0;
}

.risk-item__field-label {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
  padding: 3px 8px;
  border: var(--border-width-thin) solid var(--color-black);
  white-space: nowrap;
  min-width: 48px;
  justify-content: center;
}

/* 后果：红色前缀 */
.risk-item__field--consequence .risk-item__field-label {
  background: var(--color-risk-high);
  color: var(--color-black);
}

/* 建议：金色前缀 */
.risk-item__field--suggestion .risk-item__field-label {
  background: var(--color-gold);
  color: var(--color-black);
}

.risk-item__field-text {
  font-family: var(--font-body);
  font-size: 14px;
  line-height: var(--lh-body);
  color: var(--color-black);
  margin: 0;
  flex: 1;
  padding-top: 4px;
}
</style>
