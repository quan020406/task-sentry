<script setup lang="ts">
/**
 * BrPagination - 新野兽派分页器
 *
 * - 上一页 / 下一页 + 页码
 * - 当前页金色背景，hover 金色背景
 * - 边界禁用
 * - 显示总数
 */
import { computed } from 'vue'

interface Props {
  /** 当前页（v-model:pageNum） */
  pageNum: number
  /** 每页条数 */
  pageSize: number
  /** 总条数 */
  total: number
  /** 显示的页码按钮数量（奇数，默认 5） */
  maxButtons?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxButtons: 5,
})

const emit = defineEmits<{
  'update:pageNum': [value: number]
  'change': [value: number]
}>()

/** 总页数 */
const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

/** 是否第一页 */
const isFirst = computed(() => props.pageNum <= 1)

/** 是否最后一页 */
const isLast = computed(() => props.pageNum >= totalPages.value)

/** 起始/结束数据序号 */
const rangeStart = computed(() => (props.total === 0 ? 0 : (props.pageNum - 1) * props.pageSize + 1))
const rangeEnd = computed(() => Math.min(props.pageNum * props.pageSize, props.total))

/** 计算显示的页码（滑动窗口） */
const pages = computed<number[]>(() => {
  const max = Math.max(3, props.maxButtons)
  const half = Math.floor(max / 2)
  let start = props.pageNum - half
  let end = props.pageNum + half
  if (start < 1) {
    end += 1 - start
    start = 1
  }
  if (end > totalPages.value) {
    start -= end - totalPages.value
    end = totalPages.value
  }
  start = Math.max(1, start)
  const arr: number[] = []
  for (let i = start; i <= end; i++) arr.push(i)
  return arr
})

function go(page: number): void {
  if (page < 1 || page > totalPages.value || page === props.pageNum) return
  emit('update:pageNum', page)
  emit('change', page)
}

function prev(): void {
  go(props.pageNum - 1)
}

function next(): void {
  go(props.pageNum + 1)
}
</script>

<template>
  <div v-if="total > 0" class="br-pagination">
    <!-- 数据范围 -->
    <span class="br-pagination__range">
      {{ rangeStart }}–{{ rangeEnd }} / {{ total }}
    </span>

    <div class="br-pagination__nav">
      <!-- 上一页 -->
      <button
        class="br-pagination__btn br-pagination__btn--arrow"
        :class="{ 'br-pagination__btn--disabled': isFirst }"
        :disabled="isFirst"
        type="button"
        @click="prev"
      >
        &lt;
      </button>

      <!-- 页码 -->
      <button
        v-for="p in pages"
        :key="p"
        class="br-pagination__btn"
        :class="{ 'br-pagination__btn--active': p === pageNum }"
        type="button"
        @click="go(p)"
      >
        {{ p }}
      </button>

      <!-- 下一页 -->
      <button
        class="br-pagination__btn br-pagination__btn--arrow"
        :class="{ 'br-pagination__btn--disabled': isLast }"
        :disabled="isLast"
        type="button"
        @click="next"
      >
        &gt;
      </button>
    </div>
  </div>
</template>

<style scoped>
.br-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.br-pagination__range {
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  color: var(--color-gray-2);
  letter-spacing: var(--ls-label);
}

.br-pagination__nav {
  display: flex;
  align-items: center;
  gap: 0;
}

.br-pagination__btn {
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  color: var(--color-black);
  background: var(--color-white);
  border: var(--border-width-thin) solid var(--color-black);
  border-right: none;
  padding: 8px 12px;
  min-width: 36px;
  cursor: pointer;
  user-select: none;
  transition: all var(--transition-fast);
  letter-spacing: var(--ls-label);
}

/* 最后一个按钮保留右边框 */
.br-pagination__nav > .br-pagination__btn:last-child {
  border-right: var(--border-width-thin) solid var(--color-black);
}

.br-pagination__btn:not(.br-pagination__btn--disabled):hover {
  background: var(--color-gold);
}

.br-pagination__btn:not(.br-pagination__btn--disabled):active {
  transform: translate(1px, 1px);
}

/* 当前页：金色背景 */
.br-pagination__btn--active {
  background: var(--color-gold);
}

/* 禁用态 */
.br-pagination__btn--disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* 箭头按钮 */
.br-pagination__btn--arrow {
  font-family: var(--font-mono);
  padding: 8px 10px;
}

/* 响应式：小屏隐藏页码，只保留上一页/下一页 */
@media (max-width: 480px) {
  .br-pagination {
    justify-content: center;
  }
}
</style>
