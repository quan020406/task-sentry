/**
 * AI 服务层统一入口
 *
 * 职责：
 * 1. 根据配置实例化对应 provider
 * 2. 提供扫描任务的统一调用接口 scanTask()
 * 3. 实现重试机制（指数退避）
 * 4. 实现超时控制（AbortController）
 * 5. 实现降级策略（API 失败时切换到 mock）
 * 6. 实现成本控制（每日 token 上限）
 * 7. 记录调用日志
 */
import { config } from '@/config'
import type { IdentityType } from '@/types/identity'
import type {
  AIProviderName,
  AIChatParams,
  AIChatResult,
  AIScanResult,
  AICallLog,
} from './types'
import { BaseAIProvider } from './providers/base'
import { OpenAICompatibleProvider, PROVIDER_DEFAULTS } from './providers/openai'
import { DoubaoProvider } from './providers/doubao'
import { WenxinProvider } from './providers/wenxin'
import { DeepSeekProvider } from './providers/deepseek'
import { OpenAIProvider } from './providers/openai'
import { MockProvider } from './providers/mock'
import { buildScanMessages } from './promptBuilder'
import { parseScanResult } from './resultParser'

/** 最大的重试次数（不含首次调用） */
const MAX_RETRIES = 2

/** 默认单次调用超时（毫秒） */
const DEFAULT_TIMEOUT_MS = 30000

/** 每日 token 上限（0 表示不限制） */
const DAILY_TOKEN_LIMIT = config.ai.dailyTokenLimit

/** 单次调用日志缓存（最多保留最近 100 条） */
const callLogs: AICallLog[] = []
const MAX_LOG_SIZE = 100

/** 每日 token 累计（按日期重置） */
let dailyTokenUsed = 0
let dailyTokenDate = new Date().toISOString().slice(0, 10)

/**
 * 根据配置创建 provider 实例
 */
function createProvider(): BaseAIProvider {
  const providerName = (config.ai.provider || 'mock') as AIProviderName

  // mock 模式直接返回
  if (providerName === 'mock') {
    return new MockProvider()
  }

  const apiKey = config.ai.apiKey
  const baseUrl = config.ai.baseUrl
  const model = config.ai.model

  // 缺少 API Key 时降级到 mock
  if (!apiKey) {
    console.warn('[AI] 未配置 AI_API_KEY，降级到 mock 模式')
    return new MockProvider()
  }

  try {
    switch (providerName) {
      case 'doubao':
        return new DoubaoProvider({
          apiKey,
          baseUrl: baseUrl || PROVIDER_DEFAULTS.doubao.baseUrl,
          model: model || PROVIDER_DEFAULTS.doubao.defaultModel,
        })
      case 'wenxin':
        return new WenxinProvider({
          apiKey,
          baseUrl: baseUrl || PROVIDER_DEFAULTS.wenxin.baseUrl,
          model: model || PROVIDER_DEFAULTS.wenxin.defaultModel,
        })
      case 'deepseek':
        return new DeepSeekProvider({
          apiKey,
          baseUrl: baseUrl || PROVIDER_DEFAULTS.deepseek.baseUrl,
          model: model || PROVIDER_DEFAULTS.deepseek.defaultModel,
        })
      case 'openai':
        return new OpenAIProvider({
          apiKey,
          baseUrl: baseUrl || undefined,
          model: model || undefined,
        })
      default:
        console.warn(`[AI] 未知 provider: ${providerName}，降级到 mock`)
        return new MockProvider()
    }
  } catch (e) {
    console.error('[AI] Provider 创建失败，降级到 mock:', e)
    return new MockProvider()
  }
}

/** 单例 provider（懒加载） */
let providerInstance: BaseAIProvider | null = null

/** 获取 provider 实例（含配置降级） */
function getProvider(): BaseAIProvider {
  if (providerInstance === null) {
    providerInstance = createProvider()
  }
  return providerInstance
}

/** 重置 provider 实例（配置变化时调用，测试用） */
export function resetProvider(): void {
  providerInstance = null
}

/**
 * 重置每日 token 计数（跨天时自动调用）
 */
function resetDailyIfNeeded(): void {
  const today = new Date().toISOString().slice(0, 10)
  if (today !== dailyTokenDate) {
    dailyTokenUsed = 0
    dailyTokenDate = today
  }
}

/**
 * 检查是否超出每日 token 上限
 */
function isOverDailyLimit(): boolean {
  if (DAILY_TOKEN_LIMIT <= 0) return false
  resetDailyIfNeeded()
  return dailyTokenUsed >= DAILY_TOKEN_LIMIT
}

/**
 * 累计每日 token 用量
 */
function addDailyTokens(tokens: number): void {
  resetDailyIfNeeded()
  dailyTokenUsed += tokens
}

/** 获取当前每日 token 用量 */
export function getDailyTokenUsage(): { date: string; used: number; limit: number } {
  resetDailyIfNeeded()
  return {
    date: dailyTokenDate,
    used: dailyTokenUsed,
    limit: DAILY_TOKEN_LIMIT,
  }
}

/**
 * 记录调用日志
 */
function logCall(log: AICallLog): void {
  callLogs.push(log)
  // 保持日志大小
  if (callLogs.length > MAX_LOG_SIZE) {
    callLogs.shift()
  }
  // 同时输出到控制台（不记录敏感内容）
  const status = log.success ? '✓' : '✗'
  const fallback = log.fallbackToMock ? '[MOCK]' : ''
  console.log(
    `[AI] ${status} ${log.provider}/${log.model} ${log.durationMs}ms ${log.totalTokens ?? 0}tokens ${fallback}`,
  )
  if (!log.success && log.errorMessage) {
    console.warn(`[AI] 失败原因: ${log.errorMessage}`)
  }
}

/** 获取最近的调用日志 */
export function getCallLogs(): AICallLog[] {
  return [...callLogs]
}

/**
 * 带重试的调用（指数退避）
 *
 * @param provider AI provider
 * @param params 调用参数
 * @param retries 剩余重试次数
 * @returns 调用结果
 */
async function callWithRetry(
  provider: BaseAIProvider,
  params: AIChatParams,
  retries = MAX_RETRIES,
): Promise<AIChatResult> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await provider.chat(params)
      // P0-3 修复：空响应视为失败，触发重试（避免后续 parser 直接走兜底）
      if (!result.content || result.content.trim().length === 0) {
        throw new Error('AI 返回空响应')
      }
      return result
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e))

      // 最后一次重试不再等待
      if (attempt === retries) break

      // 指数退避：500ms, 1000ms, 2000ms...
      const delay = 500 * Math.pow(2, attempt)
      console.warn(`[AI] 第 ${attempt + 1} 次调用失败，${delay}ms 后重试: ${lastError.message}`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

/**
 * 扫描任务（核心对外接口）
 *
 * 流程：
 * 1. 构建 prompt（system + user）
 * 2. 检查每日 token 上限，超额则降级 mock
 * 3. 调用 AI provider（带重试 + 超时）
 * 4. 解析返回结果
 * 5. 失败时降级到 mock provider
 * 6. 记录日志
 *
 * @param taskText 任务原文
 * @param identity 用户身份
 * @returns 解析后的扫描结果
 */
export async function scanTask(
  taskText: string,
  identity: IdentityType,
): Promise<{ result: AIScanResult; fallbackToMock: boolean; parseSuccess: boolean }> {
  const startTime = Date.now()
  const messages = buildScanMessages(taskText, identity)

  let provider = getProvider()
  let fallbackToMock = false
  let fallbackReason: string | undefined
  let chatResult: AIChatResult | null = null
  let errorMessage: string | undefined

  // 1. 检查每日 token 上限
  if (isOverDailyLimit()) {
    console.warn('[AI] 每日 token 上限已达到，降级到 mock')
    provider = new MockProvider()
    fallbackToMock = true
    fallbackReason = '每日 token 上限已达到'
  }

  // 2. 调用 AI provider
  if (!fallbackToMock && !provider.isConfigured()) {
    console.warn('[AI] Provider 未配置，降级到 mock')
    provider = new MockProvider()
    fallbackToMock = true
    fallbackReason = 'Provider 未配置'
  }

  try {
    chatResult = await callWithRetry(provider, {
      messages,
      temperature: config.ai.temperature,
      maxTokens: config.ai.maxTokens,
      jsonMode: true,
      timeoutMs: DEFAULT_TIMEOUT_MS,
    })

    // 累计 token 用量
    if (chatResult.totalTokens) {
      addDailyTokens(chatResult.totalTokens)
    }
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : String(e)
    console.error(`[AI] 调用失败，降级到 mock: ${errorMessage}`)

    // 3. 降级到 mock
    const mockProvider = new MockProvider()
    try {
      chatResult = await mockProvider.chat({
        messages,
        temperature: config.ai.temperature,
        maxTokens: config.ai.maxTokens,
      })
      fallbackToMock = true
      fallbackReason = `API 调用失败: ${errorMessage}`
    } catch (mockErr) {
      // mock 也失败（极小概率），抛出
      throw new Error(`AI 调用失败且 mock 也失败: ${mockErr}`)
    }
  }

  // 4. 解析返回结果
  const { result, success: parseSuccess, error: parseError } = parseScanResult(
    chatResult.content,
    taskText,
  )

  // 5. 记录日志
  const durationMs = Date.now() - startTime
  logCall({
    timestamp: new Date().toISOString(),
    provider: chatResult.provider,
    model: chatResult.model,
    taskTextLength: taskText.length,
    identity,
    success: parseSuccess && !fallbackToMock,
    durationMs,
    totalTokens: chatResult.totalTokens,
    errorMessage: errorMessage || parseError,
    fallbackToMock,
  })

  // 6. 如果解析失败但调用了真实 API，再次降级到 mock 保证数据可用
  if (!parseSuccess && !fallbackToMock) {
    console.warn('[AI] 真实 API 返回解析失败，降级到 mock 数据')
    const mockProvider = new MockProvider()
    const mockResult = await mockProvider.chat({
      messages,
      temperature: config.ai.temperature,
      maxTokens: config.ai.maxTokens,
    })
    const mockParsed = parseScanResult(mockResult.content, taskText)
    return { result: mockParsed.result, fallbackToMock: true, parseSuccess: mockParsed.success }
  }

  return { result, fallbackToMock, parseSuccess }
}

/**
 * 直接调用 chat 接口（通用入口，非扫描场景用）
 */
export async function chat(params: AIChatParams): Promise<AIChatResult> {
  const provider = getProvider()
  return callWithRetry(provider, params)
}

/** 重新导出常用类型和工具 */
export { MockProvider } from './providers/mock'
export { parseScanResult, buildFallbackResult } from './resultParser'
export { buildScanMessages, getIdentityDescription } from './promptBuilder'
export type {
  AIProviderName,
  AIChatParams,
  AIChatResult,
  AIScanResult,
  AIHighlightWord,
  AIRiskGroup,
  AIRiskItem,
  AIRoadmapStep,
  AIMvpPlan,
  AICallLog,
} from './types'
