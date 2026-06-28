/**
 * AI 返回结果解析器
 *
 * 职责：
 * 1. 从 AI 响应中提取 JSON（可能包裹在 markdown 代码块或多余文字中）
 * 2. 校验必填字段
 * 3. 数据清洗和标准化
 * 4. 解析失败时返回兜底数据结构
 * 5. 记录解析失败的日志
 */
import type {
  AIScanResult,
  AIHighlightWord,
  AIRiskGroup,
  AIRiskItem,
  AIRoadmapStep,
  AIMvpPlan,
  HighlightType,
} from './types'
import type { RiskLevel } from '@/services/scan.service'

/** 合法的高亮词类型集合 */
const VALID_HIGHLIGHT_TYPES: HighlightType[] = ['程度', '质感', '范围', '时间', '完整度', '参考']

/** 合法的风险等级集合 */
const VALID_RISK_LEVELS: RiskLevel[] = ['high', 'mid', 'low']

/**
 * 从原始响应中提取 JSON 字符串
 *
 * 处理场景：
 * 1. 纯 JSON（最理想）
 * 2. ```json ... ``` 代码块
 * 3. ``` ... ``` 普通代码块
 * 4. 前后有多余说明文字
 * 5. 第一个 { 到最后一个 }
 */
function extractJsonString(raw: string): string {
  const trimmed = raw.trim()

  // 场景 1: ```json ... ``` 或 ``` ... ```
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (codeBlockMatch && codeBlockMatch[1]) {
    return codeBlockMatch[1].trim()
  }

  // 场景 2: 找第一个 { 到最后一个 }
  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1)
  }

  return trimmed
}

/**
 * P0-3 修复：去除 JSON 字符串中的尾逗号
 *
 * DeepSeek 等模型常输出 `{"a":1,}` 或 `[1,2,]` 这类尾逗号，
 * JSON.parse 不支持，会报 "Unexpected token } in JSON"。
 * 这里用正则把 `,}` / `,]`（中间可有空白/换行）替换为 `}` / `]`。
 */
function removeTrailingCommas(jsonStr: string): string {
  // 匹配逗号 + 任意空白 + } 或 ]
  return jsonStr.replace(/,\s*([}\]])/g, '$1')
}

/** 安全的字符串提取 */
function asString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

/** 安全的数字提取（夹在 [min, max] 之间） */
function asNumber(value: unknown, fallback: number, min = -Infinity, max = Infinity): number {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return Math.max(min, Math.min(max, value))
  }
  if (typeof value === 'string') {
    const n = parseFloat(value)
    if (!Number.isNaN(n)) return Math.max(min, Math.min(max, n))
  }
  return fallback
}

/** 安全的字符串数组提取 */
function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((v) => asString(v)).filter((s) => s.length > 0)
}

/** 校验并标准化风险等级 */
function asRiskLevel(value: unknown): RiskLevel {
  const v = asString(value).toLowerCase()
  if (VALID_RISK_LEVELS.includes(v as RiskLevel)) return v as RiskLevel
  // 兜底：根据 score 推断（调用方负责）
  return 'mid'
}

/** 校验并标准化高亮词类型 */
function asHighlightType(value: unknown): HighlightType {
  const v = asString(value)
  if (VALID_HIGHLIGHT_TYPES.includes(v as HighlightType)) return v as HighlightType
  return '程度'
}

/** 标准化高亮词数组 */
function parseHighlightWords(value: unknown): AIHighlightWord[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item !== 'object' || item === null) return null
      const obj = item as Record<string, unknown>
      const word = asString(obj.word)
      if (!word) return null
      return {
        word,
        type: asHighlightType(obj.type),
        explanation: asString(obj.explanation),
      }
    })
    .filter((x): x is AIHighlightWord => x !== null)
}

/** 标准化风险项 */
function parseRiskItems(items: unknown): AIRiskItem[] {
  if (!Array.isArray(items)) return []
  return items
    .map((item) => {
      if (typeof item !== 'object' || item === null) return null
      const obj = item as Record<string, unknown>
      return {
        level: asRiskLevel(obj.level),
        quote: asString(obj.quote) || asString(obj.text), // 兼容 text 字段
        consequence: asString(obj.consequence) || asString(obj.reason), // 兼容 reason 字段
        suggestion: asString(obj.suggestion),
      }
    })
    .filter((x): x is AIRiskItem => x !== null)
}

/** 标准化风险分组 */
function parseRiskGroups(value: unknown): AIRiskGroup[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item !== 'object' || item === null) return null
      const obj = item as Record<string, unknown>
      const name = asString(obj.name)
      if (!name) return null
      return {
        name,
        items: parseRiskItems(obj.items),
      }
    })
    .filter((x): x is AIRiskGroup => x !== null && x.items.length > 0)
}

/** 标准化 roadmap */
function parseRoadmap(value: unknown): AIRoadmapStep[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item, idx) => {
      if (typeof item !== 'object' || item === null) return null
      const obj = item as Record<string, unknown>
      const title = asString(obj.title)
      if (!title) return null
      return {
        step: asNumber(obj.step, idx + 1, 1, 100),
        title,
        description: asString(obj.description) || asString(obj.desc), // 兼容 desc 字段
      }
    })
    .filter((x): x is AIRoadmapStep => x !== null)
}

/** 标准化 MVP 计划 */
function parseMvp(value: unknown): AIMvpPlan {
  if (typeof value !== 'object' || value === null) {
    return { do: [], dontDo: [], later: [] }
  }
  const obj = value as Record<string, unknown>
  return {
    do: asStringArray(obj.do),
    dontDo: asStringArray(obj.dontDo).length ? asStringArray(obj.dontDo) : asStringArray(obj.dont),
    later: asStringArray(obj.later),
  }
}

/** 根据分数推断风险等级 */
function inferRiskLevel(score: number): RiskLevel {
  if (score >= 61) return 'high'
  if (score >= 31) return 'mid'
  return 'low'
}

/** 兜底数据结构 */
export function buildFallbackResult(taskText: string): AIScanResult {
  return {
    score: 50,
    riskLevel: 'mid',
    summary: 'AI 分析暂时不可用，已返回基础评估结果。建议手动检查任务说明中的模糊表达。',
    highlightWords: [],
    riskGroups: [
      {
        name: '建议确认',
        items: [
          {
            level: 'mid',
            quote: taskText.slice(0, 50),
            consequence: '任务说明的关键细节未明确，可能影响交付质量',
            suggestion: '与任务方确认验收标准、交付时间、交付物形态',
          },
        ],
      },
    ],
    questions: {
      mustAsk: ['最终的验收标准是什么？', '期望的交付时间是什么时候？'],
      laterAsk: ['是否有参考案例？'],
    },
    mvp: {
      do: ['先完成核心功能', '阶段性对齐进展'],
      dontDo: ['不要做未明确要求的功能'],
      later: ['迭代优化'],
    },
    roadmap: [
      { step: 1, title: '需求确认', description: '明确验收标准和交付时间，30 分钟' },
      { step: 2, title: '方案设计', description: '确定执行方案，1 小时' },
      { step: 3, title: '核心实现', description: '完成主要功能' },
      { step: 4, title: '中期对齐', description: '阶段性同步进展' },
      { step: 5, title: '交付验收', description: '按标准交付' },
    ],
    confirmScript: `关于这个任务，想先确认几点：

1. 最终的验收标准是什么？什么程度算完成？
2. 期望的交付时间是什么时候？
3. 是否有参考案例或对标？

确认后我会立即开始，并在过程中阶段性同步进展。`,
  }
}

/**
 * 解析 AI 返回的扫描结果
 *
 * @param raw AI 原始返回文本
 * @param taskText 任务原文（用于兜底）
 * @returns 解析结果 + 是否成功
 */
export function parseScanResult(raw: string, taskText: string): {
  result: AIScanResult
  success: boolean
  error?: string
} {
  if (!raw || typeof raw !== 'string' || raw.trim().length === 0) {
    console.warn('[AI] 返回内容为空，使用兜底数据')
    return { result: buildFallbackResult(taskText), success: false, error: '空响应' }
  }

  // P0-3 修复：提取后清理尾逗号，再交给 JSON.parse
  const jsonStr = removeTrailingCommas(extractJsonString(raw))

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonStr)
  } catch (e) {
    console.warn('[AI] JSON 解析失败，使用兜底数据。错误:', e)
    console.debug('[AI] 原始返回:', raw.slice(0, 500))
    return {
      result: buildFallbackResult(taskText),
      success: false,
      error: `JSON 解析失败: ${e instanceof Error ? e.message : String(e)}`,
    }
  }

  if (typeof parsed !== 'object' || parsed === null) {
    console.warn('[AI] 解析结果不是对象，使用兜底数据')
    return { result: buildFallbackResult(taskText), success: false, error: '非对象响应' }
  }

  const obj = parsed as Record<string, unknown>

  // 标准化各字段
  const score = asNumber(obj.score, 50, 0, 100)
  const riskLevelRaw = asRiskLevel(obj.riskLevel)
  // 如果 score 和 riskLevel 不一致，以 score 为准
  const riskLevel: RiskLevel =
    VALID_RISK_LEVELS.includes(riskLevelRaw) &&
    ((score >= 61 && riskLevelRaw === 'high') ||
      (score >= 31 && score < 61 && riskLevelRaw === 'mid') ||
      (score < 31 && riskLevelRaw === 'low'))
      ? riskLevelRaw
      : inferRiskLevel(score)

  const questions = (typeof obj.questions === 'object' && obj.questions !== null
    ? obj.questions
    : {}) as Record<string, unknown>

  const result: AIScanResult = {
    score,
    riskLevel,
    summary: asString(obj.summary, '任务已扫描，请关注以下风险点。'),
    highlightWords: parseHighlightWords(obj.highlightWords),
    riskGroups: parseRiskGroups(obj.riskGroups),
    questions: {
      mustAsk: asStringArray(questions.mustAsk),
      laterAsk: asStringArray(questions.laterAsk),
    },
    mvp: parseMvp(obj.mvp),
    roadmap: parseRoadmap(obj.roadmap),
    confirmScript: asString(obj.confirmScript, ''),
  }

  // 校验关键字段，如果 confirmScript 为空，补充一个基础版本
  if (!result.confirmScript) {
    result.confirmScript = `关于这个任务，想先确认几点：

${result.questions.mustAsk.slice(0, 3).map((q, i) => `${i + 1}. ${q}`).join('\n')}

确认后我会立即开始，并在过程中阶段性同步进展。`
  }

  // 如果没有 mustAsk，至少补一个
  if (result.questions.mustAsk.length === 0) {
    result.questions.mustAsk = ['最终的验收标准是什么？']
  }

  return { result, success: true }
}
