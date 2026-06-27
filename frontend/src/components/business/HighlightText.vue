<script setup lang="ts">
/**
 * HighlightText - 带模糊词高亮的文本展示
 *
 * 特性：
 * - 将原始文本按模糊词切分，匹配部分渲染为高亮 span
 * - 高亮样式：金底黑字 + 黑色粗下划线 + 加粗
 * - 鼠标悬停高亮词显示 Tooltip（类型 + 解释）
 * - 支持同一词多次出现
 * - 不使用 v-html，全部通过模板渲染，防 XSS
 *
 * 使用方式：
 * <HighlightText
 *   :text="result.originalText"
 *   :highlights="result.highlightWords"
 * />
 */
import { computed } from 'vue'
import Tooltip from './Tooltip.vue'
import type { HighlightWord } from '@/types/scan'

interface Props {
  /** 原始文本 */
  text: string
  /** 模糊词列表 */
  highlights: HighlightWord[]
}

const props = defineProps<Props>()

/** 文本片段：普通文本 / 高亮词 */
interface TextSegment {
  type: 'plain' | 'highlight'
  text: string
  /** 仅高亮片段有 */
  highlight?: HighlightWord
}

/**
 * 将文本按模糊词切分为片段数组
 *
 * 算法：
 * 1. 收集所有 (词, 起始位置, 高亮信息) 三元组
 * 2. 按起始位置排序
 * 3. 跳过与已选区间重叠的匹配（避免嵌套）
 * 4. 按顺序填充 plain / highlight 片段
 */
const segments = computed<TextSegment[]>(() => {
  const text = props.text || ''
  const highlights = props.highlights || []

  if (!text || highlights.length === 0) {
    return [{ type: 'plain', text }]
  }

  // 收集所有匹配位置
  interface Match {
    start: number
    end: number
    highlight: HighlightWord
  }
  const matches: Match[] = []

  for (const hl of highlights) {
    if (!hl.word) continue
    // 转义正则特殊字符
    const escaped = hl.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escaped, 'g')
    let m: RegExpExecArray | null
    while ((m = regex.exec(text)) !== null) {
      matches.push({
        start: m.index,
        end: m.index + m[0].length,
        highlight: hl,
      })
      // 防止零宽匹配死循环
      if (m[0].length === 0) {
        regex.lastIndex++
      }
    }
  }

  // 无匹配则返回纯文本
  if (matches.length === 0) {
    return [{ type: 'plain', text }]
  }

  // 按起始位置排序，相同起始位置取较长者
  matches.sort((a, b) => a.start - b.start || b.end - a.end)

  // 去除重叠（保留先出现的）
  const nonOverlapping: Match[] = []
  let lastEnd = -1
  for (const m of matches) {
    if (m.start >= lastEnd) {
      nonOverlapping.push(m)
      lastEnd = m.end
    }
  }

  // 切分片段
  const result: TextSegment[] = []
  let cursor = 0
  for (const m of nonOverlapping) {
    if (m.start > cursor) {
      result.push({ type: 'plain', text: text.slice(cursor, m.start) })
    }
    result.push({
      type: 'highlight',
      text: text.slice(m.start, m.end),
      highlight: m.highlight,
    })
    cursor = m.end
  }
  if (cursor < text.length) {
    result.push({ type: 'plain', text: text.slice(cursor) })
  }

  return result
})

/**
 * 构造 Tooltip 标签："{type}模糊"
 * 例如 type="程度" → "程度模糊"
 */
function tooltipLabel(hl: HighlightWord): string {
  if (!hl.type) return '模糊表达'
  return `${hl.type}模糊`
}
</script>

<template>
  <div class="highlight-text">
    <template v-for="(seg, idx) in segments" :key="idx">
      <span v-if="seg.type === 'plain'" class="highlight-text__plain">{{ seg.text }}</span>
      <Tooltip
        v-else
        :label="tooltipLabel(seg.highlight!)"
        :content="seg.highlight!.explanation"
        position="top"
        :max-width="260"
      >
        <mark class="highlight-text__mark">{{ seg.text }}</mark>
      </Tooltip>
    </template>
  </div>
</template>

<style scoped>
.highlight-text {
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: var(--fw-regular);
  line-height: var(--lh-body);
  color: var(--color-black);
  word-break: break-word;
}

.highlight-text__plain {
  /* 继承父级样式 */
}

/* 高亮词：金底黑字 + 粗黑下划线 + 加粗 */
.highlight-text__mark {
  background: var(--color-gold);
  color: var(--color-black);
  font-weight: var(--fw-bold);
  padding: 1px 4px;
  /* 粗黑色下划线 */
  text-decoration: underline;
  text-decoration-color: var(--color-black);
  text-decoration-thickness: 2px;
  text-underline-offset: 3px;
  cursor: help;
  /* 严格直角，无圆角 */
  border-radius: 0;
  transition: background var(--transition-fast);
}

/* hover 时背景变为暗金色，强化反馈 */
.highlight-text__mark:hover {
  background: var(--color-gold-dark);
}
</style>
