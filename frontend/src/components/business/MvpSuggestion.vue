<script setup lang="ts">
/**
 * MvpSuggestion - 最小交付版本（MVP）建议
 *
 * 新野兽派风格：
 * - 三部分对比：第一版要做（绿）/ 先不要做（红）/ 后续增强（金）
 * - 每部分粗边框分隔 + 独立标题栏
 * - 列表项用方块项目符号
 *
 * 数据：scan.mvp
 *   MvpPlan = { do: string[], dontDo: string[], later: string[] }
 */
import { computed } from 'vue'
import type { MvpPlan } from '@/types/scan'

interface Props {
  mvp: MvpPlan
}

const props = defineProps<Props>()

interface MvpSection {
  key: 'do' | 'dontDo' | 'later'
  title: string
  symbol: string
  variant: 'do' | 'dont' | 'later'
  items: string[]
}

/** 三部分配置 + 数据 */
const sections = computed<MvpSection[]>(() => [
  {
    key: 'do',
    title: '第一版要做',
    symbol: '✓',
    variant: 'do',
    items: props.mvp.do || [],
  },
  {
    key: 'dontDo',
    title: '先不要做',
    symbol: '✕',
    variant: 'dont',
    items: props.mvp.dontDo || [],
  },
  {
    key: 'later',
    title: '后续增强',
    symbol: '→',
    variant: 'later',
    items: props.mvp.later || [],
  },
])

/** 总条目数 */
const totalCount = computed(() =>
  sections.value.reduce((sum, s) => sum + s.items.length, 0),
)
</script>

<template>
  <div class="mvp">
    <!-- 标题行 -->
    <header class="mvp__head">
      <div class="mvp__title-wrap">
        <span class="mvp__label">// MVP</span>
        <h2 class="mvp__title">最小交付版本</h2>
        <p class="mvp__subtitle">建议先做这些，减少返工</p>
      </div>
      <div class="mvp__count">
        <span class="mvp__count-num">{{ totalCount }}</span>
        <span class="mvp__count-label">ITEMS</span>
      </div>
    </header>

    <!-- 三部分 -->
    <div class="mvp__body">
      <section
        v-for="section in sections"
        :key="section.key"
        class="mvp__section"
        :class="`mvp__section--${section.variant}`"
      >
        <!-- 标题栏 -->
        <header class="mvp__section-head">
          <span class="mvp__section-symbol" aria-hidden="true">{{ section.symbol }}</span>
          <span class="mvp__section-title">{{ section.title }}</span>
          <span class="mvp__section-count">{{ section.items.length }}</span>
        </header>

        <!-- 列表 -->
        <ul v-if="section.items.length" class="mvp__list">
          <li
            v-for="(item, idx) in section.items"
            :key="`${section.key}-${idx}`"
            class="mvp__item"
          >
            <span class="mvp__item-bullet" aria-hidden="true"></span>
            <span class="mvp__item-text">{{ item }}</span>
          </li>
        </ul>

        <!-- 空状态 -->
        <p v-else class="mvp__section-empty">—</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.mvp {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* ===== 标题行 ===== */
.mvp__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: var(--space-md) var(--space-lg);
  background: var(--color-cream-light);
  border-bottom: var(--border-width-thick) solid var(--color-black);
}

.mvp__title-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mvp__label {
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  color: var(--color-gold-dark);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
}

.mvp__title {
  font-family: var(--font-title);
  font-size: 20px;
  font-weight: var(--fw-black);
  color: var(--color-black);
  letter-spacing: var(--ls-h2);
  line-height: 1;
  margin: 0;
}

.mvp__subtitle {
  font-family: var(--font-mono);
  font-size: var(--fs-caption);
  font-weight: var(--fw-bold);
  color: var(--color-gray-2);
  letter-spacing: var(--ls-label);
  margin: 0;
}

.mvp__count {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.mvp__count-num {
  font-family: var(--font-title);
  font-size: 36px;
  font-weight: var(--fw-black);
  color: var(--color-black);
  line-height: 0.85;
  letter-spacing: -1px;
}

.mvp__count-label {
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  color: var(--color-gray-2);
  letter-spacing: var(--ls-label);
}

/* ===== 主体：三部分 ===== */
.mvp__body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.mvp__section {
  border-bottom: var(--border-width-thick) solid var(--color-black);
}

.mvp__section:last-child {
  border-bottom: none;
}

/* 标题栏 */
.mvp__section-head {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-lg);
  border-bottom: var(--border-width-thin) solid var(--color-black);
}

/* 符号方块 */
.mvp__section-symbol {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: var(--fw-bold);
  border: var(--border-width-thin) solid var(--color-black);
  flex-shrink: 0;
}

/* 变体颜色 */
.mvp__section--do .mvp__section-head {
  background: var(--color-risk-low);
}
.mvp__section--do .mvp__section-symbol {
  background: var(--color-risk-low);
}

.mvp__section--dont .mvp__section-head {
  background: var(--color-risk-high);
}
.mvp__section--dont .mvp__section-symbol {
  background: var(--color-risk-high);
}

.mvp__section--later .mvp__section-head {
  background: var(--color-gold);
}
.mvp__section--later .mvp__section-symbol {
  background: var(--color-gold);
}

.mvp__section-title {
  flex: 1;
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  color: var(--color-black);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
}

.mvp__section-count {
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  color: var(--color-black);
  min-width: 24px;
  text-align: right;
}

/* 列表 */
.mvp__list {
  list-style: none;
  padding: var(--space-sm) var(--space-lg);
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mvp__item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  padding: 4px 0;
}

/* 项目符号：小方块 */
.mvp__item-bullet {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  margin-top: 7px;
  border: var(--border-width-thin) solid var(--color-black);
}

/* 变体项目符号颜色 */
.mvp__section--do .mvp__item-bullet {
  background: var(--color-risk-low);
}
.mvp__section--dont .mvp__item-bullet {
  background: var(--color-risk-high);
}
.mvp__section--later .mvp__item-bullet {
  background: var(--color-gold);
}

.mvp__item-text {
  flex: 1;
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: var(--fw-regular);
  line-height: var(--lh-body);
  color: var(--color-black);
  word-break: break-word;
}

/* 空状态 */
.mvp__section-empty {
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  color: var(--color-gray-2);
  margin: 0;
  padding: var(--space-sm) var(--space-lg);
  text-align: center;
}
</style>
