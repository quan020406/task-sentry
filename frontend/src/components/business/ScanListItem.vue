<script setup lang="ts">
/**
 * ScanListItem - 历史记录单条卡片
 *
 * 新野兽派风格：
 * - 粗边框 + 硬阴影
 * - hover：金色背景 + 偏移
 * - 任务文本预览（2-3 行省略）
 * - 风险分数 + 等级标签
 * - 身份标签
 * - 时间
 * - 收藏按钮（空心/实心星）
 * - 分享按钮（S11）
 * - 删除按钮
 * - 点击整行跳转详情
 *
 * 事件：
 * - click：点击卡片
 * - toggle-favorite：切换收藏
 * - share：分享（S11）
 * - delete：删除
 */
import { computed } from 'vue'
import type { ScanRecordBrief } from '@/types/scan'
import type { IdentityType } from '@/types/user'

interface Props {
  item: ScanRecordBrief
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'click', item: ScanRecordBrief): void
  (e: 'toggle-favorite', item: ScanRecordBrief): void
  (e: 'share', item: ScanRecordBrief): void
  (e: 'delete', item: ScanRecordBrief): void
}>()

/** 身份标签映射 */
const IDENTITY_LABELS: Record<IdentityType, string> = {
  student: '学生',
  intern: '实习生',
  developer: '开发者',
  designer: '设计师',
  pm: '产品/运营',
  lead: '项目负责人',
}

/** 身份标签 */
const identityLabel = computed(() => IDENTITY_LABELS[props.item.identity] || props.item.identity)

/** 风险等级文字 */
const riskLabel = computed(() => {
  if (!props.item.riskLevel) return '未评估'
  const map = { high: '高风险', mid: '中风险', low: '低风险' }
  return map[props.item.riskLevel]
})

/** 风险等级变体 class */
const riskVariant = computed(() => props.item.riskLevel || 'none')

/** 分数文字 */
const scoreText = computed(() => {
  if (props.item.score === null) return '—'
  return String(Math.round(props.item.score))
})

/** 任务预览（截断到 2 行，CSS 控制） */

/** 时间格式化 */
const timeText = computed(() => {
  if (!props.item.createdAt) return ''
  try {
    const d = new Date(props.item.createdAt)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return props.item.createdAt
  }
})

/** 相对时间（如 "3 分钟前"） */
const relativeTime = computed(() => {
  if (!props.item.createdAt) return ''
  try {
    const d = new Date(props.item.createdAt)
    const diff = Date.now() - d.getTime()
    const min = Math.floor(diff / 60000)
    if (min < 1) return '刚刚'
    if (min < 60) return `${min} 分钟前`
    const hour = Math.floor(min / 60)
    if (hour < 24) return `${hour} 小时前`
    const day = Math.floor(hour / 24)
    if (day < 7) return `${day} 天前`
    return timeText.value
  } catch {
    return timeText.value
  }
})

function onClick(): void {
  emit('click', props.item)
}

function onToggleFavorite(e: Event): void {
  e.stopPropagation()
  emit('toggle-favorite', props.item)
}

function onShare(e: Event): void {
  e.stopPropagation()
  emit('share', props.item)
}

function onDelete(e: Event): void {
  e.stopPropagation()
  emit('delete', props.item)
}
</script>

<template>
  <article
    class="scan-item"
    :class="{ 'scan-item--favorite': item.isFavorite }"
    tabindex="0"
    @click="onClick"
    @keydown.enter="onClick"
  >
    <!-- 左侧：风险分数 + 等级 -->
    <div class="scan-item__score-col" :class="`risk-${riskVariant}`">
      <span class="scan-item__score">{{ scoreText }}</span>
      <span class="scan-item__score-unit">/100</span>
      <span class="scan-item__risk-tag" :class="`risk-${riskVariant}`">{{ riskLabel }}</span>
    </div>

    <!-- 中间：任务文本 + 元信息 -->
    <div class="scan-item__main">
      <p class="scan-item__task">{{ item.taskText }}</p>
      <div class="scan-item__meta">
        <span class="scan-item__identity">{{ identityLabel }}</span>
        <span class="scan-item__sep">·</span>
        <span class="scan-item__time">{{ relativeTime }}</span>
      </div>
    </div>

    <!-- 右侧：操作按钮 -->
    <div class="scan-item__actions">
      <button
        class="scan-item__btn scan-item__btn--fav"
        :class="{ 'scan-item__btn--fav-active': item.isFavorite }"
        type="button"
        :aria-pressed="item.isFavorite"
        :title="item.isFavorite ? '取消收藏' : '收藏'"
        @click="onToggleFavorite"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 18l-5.9 3 1.2-6.5L2.5 9.4l6.6-.9z"
            :fill="item.isFavorite ? 'currentColor' : 'none'"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linejoin="miter"
          />
        </svg>
      </button>
      <button
        class="scan-item__btn scan-item__btn--share"
        type="button"
        title="分享"
        @click="onShare"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="6" cy="12" r="2.5" fill="none" stroke="currentColor" stroke-width="2.5" />
          <circle cx="18" cy="6" r="2.5" fill="none" stroke="currentColor" stroke-width="2.5" />
          <circle cx="18" cy="18" r="2.5" fill="none" stroke="currentColor" stroke-width="2.5" />
          <path d="M8 11l8-4M8 13l8 4" fill="none" stroke="currentColor" stroke-width="2.5" />
        </svg>
      </button>
      <button
        class="scan-item__btn scan-item__btn--del"
        type="button"
        title="删除"
        @click="onDelete"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13M10 11v6M14 11v6"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="square"
            stroke-linejoin="miter"
          />
        </svg>
      </button>
    </div>
  </article>
</template>

<style scoped>
.scan-item {
  display: grid;
  grid-template-columns: 100px 1fr auto;
  gap: var(--space-md);
  align-items: stretch;
  background: var(--color-white);
  border: var(--border-width-thick) solid var(--color-black);
  box-shadow: var(--shadow-sm);
  padding: var(--space-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  outline: none;
}

/* hover：金色背景 + 偏移 */
.scan-item:hover,
.scan-item:focus-visible {
  background: var(--color-gold);
  transform: translate(-2px, -2px);
  box-shadow: var(--shadow-md);
}

/* ===== 左侧：风险分数列 ===== */
.scan-item__score-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: var(--space-xs);
  border-right: var(--border-width-thin) solid var(--color-black);
}

.scan-item__score {
  font-family: var(--font-title);
  font-size: 36px;
  font-weight: var(--fw-black);
  color: var(--color-black);
  line-height: 0.85;
  letter-spacing: -1px;
}

.scan-item__score-unit {
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  color: var(--color-gray-2);
  letter-spacing: var(--ls-label);
}

.scan-item__risk-tag {
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  letter-spacing: var(--ls-label);
  padding: 2px 6px;
  border: var(--border-width-thin) solid var(--color-black);
  margin-top: 2px;
  white-space: nowrap;
}

.scan-item__risk-tag.risk-high {
  background: var(--color-risk-high);
  color: var(--color-white);
}
.scan-item__risk-tag.risk-mid {
  background: var(--color-risk-mid);
  color: var(--color-black);
}
.scan-item__risk-tag.risk-low {
  background: var(--color-risk-low);
  color: var(--color-white);
}
.scan-item__risk-tag.risk-none {
  background: var(--color-gray-4);
  color: var(--color-black);
}

/* hover 时风险标签保持原色（避免被金色背景吞掉） */
.scan-item:hover .scan-item__risk-tag {
  border-color: var(--color-black);
}

/* ===== 中间：任务文本 + 元信息 ===== */
.scan-item__main {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--space-xs);
  min-width: 0;
}

.scan-item__task {
  font-family: var(--font-body);
  font-size: var(--fs-body);
  font-weight: var(--fw-regular);
  line-height: var(--lh-card);
  color: var(--color-black);
  margin: 0;
  /* 2 行省略 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.scan-item__meta {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  color: var(--color-gray-2);
  letter-spacing: var(--ls-label);
}

.scan-item__identity {
  padding: 2px 6px;
  border: var(--border-width-thin) solid var(--color-black);
  background: var(--color-cream);
  color: var(--color-black);
}

.scan-item:hover .scan-item__identity {
  background: var(--color-white);
}

.scan-item__sep {
  color: var(--color-gray-1);
}

/* ===== 右侧：操作按钮 ===== */
.scan-item__actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  justify-content: center;
}

.scan-item__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: var(--color-white);
  border: var(--border-width-thin) solid var(--color-black);
  color: var(--color-black);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.scan-item__btn svg {
  width: 14px;
  height: 14px;
}

.scan-item__btn:hover {
  background: var(--color-black);
  color: var(--color-gold);
}

.scan-item__btn:active {
  transform: translate(1px, 1px);
}

/* 收藏激活态：金色背景 */
.scan-item__btn--fav-active {
  background: var(--color-gold);
  color: var(--color-black);
}

.scan-item__btn--fav-active:hover {
  background: var(--color-black);
  color: var(--color-gold);
}

/* hover 卡片变金色时，按钮保持白底可见 */
.scan-item:hover .scan-item__btn {
  background: var(--color-white);
  color: var(--color-black);
}

.scan-item:hover .scan-item__btn:hover {
  background: var(--color-black);
  color: var(--color-gold);
}

.scan-item:hover .scan-item__btn--fav-active {
  background: var(--color-black);
  color: var(--color-gold);
}

/* ===== 响应式（S12 断点对齐 767）===== */
@media (max-width: 767px) {
  .scan-item {
    grid-template-columns: 72px 1fr;
    gap: var(--space-sm);
    padding: var(--space-sm);
  }
  .scan-item__actions {
    grid-column: 1 / -1;
    flex-direction: row;
    justify-content: flex-end;
    border-top: var(--border-width-thin) solid var(--color-black);
    padding-top: var(--space-xs);
  }
  /* 移动端操作按钮放大，保证触摸友好（≥44px） */
  .scan-item__btn {
    width: 36px;
    height: 36px;
  }
  .scan-item__btn svg {
    width: 16px;
    height: 16px;
  }
  .scan-item__score {
    font-size: 28px;
  }
}
</style>
