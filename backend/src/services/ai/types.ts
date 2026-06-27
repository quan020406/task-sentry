/**
 * AI 服务层类型定义
 *
 * 涵盖：服务提供方、聊天消息、调用参数、返回结果、用量统计等
 */
import type { IdentityType } from '@/types/identity'

/** AI 服务提供方 */
export type AIProviderName = 'doubao' | 'wenxin' | 'deepseek' | 'openai' | 'mock'

/** 聊天消息角色 */
export type ChatRole = 'system' | 'user' | 'assistant'

/** 聊天消息（OpenAI 兼容格式） */
export interface ChatMessage {
  role: ChatRole
  content: string
}

/** AI 调用参数 */
export interface AIChatParams {
  /** 模型名称（如 doubao-pro-32k） */
  model?: string
  /** 消息列表 */
  messages: ChatMessage[]
  /** 温度，0-1 */
  temperature?: number
  /** 最大输出 token */
  maxTokens?: number
  /** 是否强制 JSON 输出（部分模型支持 response_format） */
  jsonMode?: boolean
  /** 超时时间（毫秒） */
  timeoutMs?: number
}

/** AI 调用结果 */
export interface AIChatResult {
  /** 文本内容 */
  content: string
  /** 完成的 token 数 */
  completionTokens?: number
  /** 提示词 token 数 */
  promptTokens?: number
  /** 总 token 数 */
  totalTokens?: number
  /** 实际使用的模型 */
  model: string
  /** 实际使用的 provider */
  provider: AIProviderName
}

/** 高亮词类型分类 */
export type HighlightType =
  | '程度' // "简单""差不多""大概"
  | '质感' // "质感""体验""高级感"
  | '范围' // "优化一下""改一改"
  | '时间' // "尽快""明天"
  | '完整度' // "看个版本""Demo"
  | '参考' // "实际案例""参考"

/** AI 输出：高亮词 */
export interface AIHighlightWord {
  word: string
  type: HighlightType
  explanation: string
}

/** AI 输出：风险项 */
export interface AIRiskItem {
  level: 'high' | 'mid' | 'low'
  quote: string
  consequence: string
  suggestion: string
}

/** AI 输出：风险分组 */
export interface AIRiskGroup {
  name: string
  items: AIRiskItem[]
}

/** AI 输出：roadmap 步骤 */
export interface AIRoadmapStep {
  step: number
  title: string
  description: string
}

/** AI 输出：MVP 计划 */
export interface AIMvpPlan {
  do: string[]
  dontDo: string[]
  later: string[]
}

/** AI 输出：完整结构化扫描结果（严格 JSON） */
export interface AIScanResult {
  score: number
  riskLevel: 'high' | 'mid' | 'low'
  summary: string
  highlightWords: AIHighlightWord[]
  riskGroups: AIRiskGroup[]
  questions: {
    mustAsk: string[]
    laterAsk: string[]
  }
  mvp: AIMvpPlan
  roadmap: AIRoadmapStep[]
  confirmScript: string
}

/** 扫描请求参数 */
export interface ScanAIRequest {
  taskText: string
  identity: IdentityType
}

/** AI 服务调用上下文（含日志、降级标记） */
export interface AICallContext {
  /** 调用起始时间戳 */
  startTime: number
  /** 是否已降级到 mock */
  fallbackToMock: boolean
  /** 失败原因（降级时记录） */
  fallbackReason?: string
}

/** 单次调用日志 */
export interface AICallLog {
  /** ISO 时间戳 */
  timestamp: string
  /** 使用的 provider */
  provider: AIProviderName
  /** 使用的模型 */
  model: string
  /** 任务文本长度 */
  taskTextLength: number
  /** 用户身份 */
  identity: IdentityType
  /** 是否成功 */
  success: boolean
  /** 耗时（毫秒） */
  durationMs: number
  /** token 用量 */
  totalTokens?: number
  /** 失败原因 */
  errorMessage?: string
  /** 是否降级到 mock */
  fallbackToMock: boolean
}
