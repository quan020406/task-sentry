<script setup lang="ts">
/**
 * QuestionList - 追问清单（右栏）
 *
 * 新野兽派风格：
 * - 卡片标题 + 右侧问题总数
 * - 两组分类：开工前必须问（红点）/ 可以边做边确认（黄点）
 * - 每条问题带复制按钮，hover 金色背景
 * - 底部一键复制全部问题（格式化文本）
 * - 空状态提示
 *
 * 数据：scan.questions { mustAsk: Question[], laterAsk: Question[] }
 *   Question = { q: string, why: string }
 */
import { computed } from 'vue'
import { useToast } from '@/composables/useToast'
import type { Question } from '@/types/scan'
import QuestionItem from './QuestionItem.vue'

interface Props {
  mustAsk: Question[]
  laterAsk: Question[]
}

const props = defineProps<Props>()

const { toast } = useToast()

/** 问题总数 */
const totalCount = computed(() => props.mustAsk.length + props.laterAsk.length)

/** 是否为空 */
const isEmpty = computed(() => totalCount.value === 0)

/** 必问问题数量（仅 q 字段非空） */
const mustCount = computed(() => props.mustAsk.filter((q) => q.q).length)

/** 边做边问数量 */
const laterCount = computed(() => props.laterAsk.filter((q) => q.q).length)

/**
 * 格式化全部问题为可复制文本
 *
 * 【开工前必须问】
 * 1. xxx
 * 2. xxx
 *
 * 【可以边做边确认】
 * 1. xxx
 * 2. xxx
 */
const allQuestionsText = computed(() => {
  const lines: string[] = []

  if (mustCount.value > 0) {
    lines.push('【开工前必须问】')
    props.mustAsk.forEach((q, i) => {
      if (q.q) lines.push(`${i + 1}. ${q.q}`)
    })
  }

  if (laterCount.value > 0) {
    if (lines.length > 0) lines.push('')
    lines.push('【可以边做边确认】')
    props.laterAsk.forEach((q, i) => {
      if (q.q) lines.push(`${i + 1}. ${q.q}`)
    })
  }

  return lines.join('\n')
})

async function copyAll(): Promise<void> {
  if (isEmpty.value) {
    toast.warning('暂无问题可复制')
    return
  }
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(allQuestionsText.value)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = allQuestionsText.value
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    toast.success('已复制全部问题')
  } catch {
    toast.error('复制失败')
  }
}
</script>

<template>
  <div class="q-list">
    <!-- 标题行 -->
    <header class="q-list__head">
      <div class="q-list__title-wrap">
        <span class="q-list__label">// QUESTIONS</span>
        <h2 class="q-list__title">追问清单</h2>
      </div>
      <div class="q-list__count">
        <span class="q-list__count-num">{{ totalCount }}</span>
        <span class="q-list__count-label">ITEMS</span>
      </div>
    </header>

    <!-- 主体 -->
    <div class="q-list__body">
      <template v-if="!isEmpty">
        <!-- 开工前必须问 -->
        <section class="q-list__group q-list__group--must">
          <header class="q-list__group-head">
            <span class="q-list__group-dot" aria-hidden="true"></span>
            <span class="q-list__group-title">开工前必须问</span>
            <span class="q-list__group-count">{{ mustCount }}</span>
          </header>
          <ul class="q-list__items">
            <QuestionItem
              v-for="(q, i) in mustAsk"
              v-show="q.q"
              :key="`must-${i}`"
              :question="q.q"
              :index="i + 1"
              variant="must"
            />
          </ul>
          <p v-if="mustCount === 0" class="q-list__group-empty">
            暂无必须确认的问题
          </p>
        </section>

        <!-- 可以边做边确认 -->
        <section class="q-list__group q-list__group--later">
          <header class="q-list__group-head">
            <span class="q-list__group-dot" aria-hidden="true"></span>
            <span class="q-list__group-title">可以边做边确认</span>
            <span class="q-list__group-count">{{ laterCount }}</span>
          </header>
          <ul class="q-list__items">
            <QuestionItem
              v-for="(q, i) in laterAsk"
              v-show="q.q"
              :key="`later-${i}`"
              :question="q.q"
              :index="i + 1"
              variant="later"
            />
          </ul>
          <p v-if="laterCount === 0" class="q-list__group-empty">
            暂无需要边做边确认的问题
          </p>
        </section>

        <!-- 一键复制全部 -->
        <button class="q-list__copy-all" type="button" @click="copyAll">
          <svg class="q-list__copy-all-icon" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="9" y="9" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" />
            <path d="M5 15V5h10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="miter" />
          </svg>
          <span>一键复制全部问题</span>
        </button>
      </template>

      <!-- 空状态 -->
      <div v-else class="q-list__empty">
        <span class="q-list__empty-icon" aria-hidden="true">✓</span>
        <p class="q-list__empty-text">未发现需要追问的问题。</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.q-list {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* ===== 标题行 ===== */
.q-list__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: var(--space-md) var(--space-lg);
  background: var(--color-cream-light);
  border-bottom: var(--border-width-thick) solid var(--color-black);
}

.q-list__title-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.q-list__label {
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  color: var(--color-gold-dark);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
}

.q-list__title {
  font-family: var(--font-title);
  font-size: 20px;
  font-weight: var(--fw-black);
  color: var(--color-black);
  letter-spacing: var(--ls-h2);
  line-height: 1;
  margin: 0;
}

.q-list__count {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.q-list__count-num {
  font-family: var(--font-title);
  font-size: 36px;
  font-weight: var(--fw-black);
  color: var(--color-black);
  line-height: 0.85;
  letter-spacing: -1px;
}

.q-list__count-label {
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  color: var(--color-gray-2);
  letter-spacing: var(--ls-label);
}

/* ===== 主体 ===== */
.q-list__body {
  flex: 1;
  padding: var(--space-md) var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  overflow-y: auto;
}

/* ===== 分组 ===== */
.q-list__group {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.q-list__group-head {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding-bottom: var(--space-xs);
  border-bottom: var(--border-width-thin) solid var(--color-black);
}

.q-list__group-dot {
  width: 12px;
  height: 12px;
  border: var(--border-width-thin) solid var(--color-black);
  flex-shrink: 0;
}

.q-list__group--must .q-list__group-dot {
  background: var(--color-risk-high);
}

.q-list__group--later .q-list__group-dot {
  background: var(--color-risk-mid);
}

.q-list__group-title {
  flex: 1;
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  color: var(--color-black);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
}

.q-list__group-count {
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  color: var(--color-gray-2);
  min-width: 24px;
  text-align: right;
}

.q-list__items {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.q-list__group-empty {
  font-family: var(--font-italic);
  font-style: italic;
  font-size: var(--fs-caption);
  color: var(--color-gray-2);
  margin: 0;
  padding: var(--space-xs) 0;
}

/* ===== 一键复制全部 ===== */
.q-list__copy-all {
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
  margin-top: var(--space-sm);
}

.q-list__copy-all:hover {
  background: var(--color-gold);
  color: var(--color-black);
}

.q-list__copy-all:active {
  transform: translate(2px, 2px);
  box-shadow: none;
}

.q-list__copy-all-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* ===== 空状态 ===== */
.q-list__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-3xl) var(--space-md);
  text-align: center;
}

.q-list__empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: var(--color-risk-low);
  color: var(--color-black);
  font-size: 28px;
  font-weight: var(--fw-bold);
  border: var(--border-width-thick) solid var(--color-black);
  box-shadow: var(--shadow-sm);
}

.q-list__empty-text {
  font-family: var(--font-italic);
  font-style: italic;
  font-size: var(--fs-body);
  color: var(--color-gray-2);
  margin: 0;
}
</style>
