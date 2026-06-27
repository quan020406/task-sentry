/**
 * AI Provider 抽象基类
 *
 * 定义所有 provider 必须实现的 chat 方法
 * 提供通用的超时、HTTP 错误处理工具
 */
import type { AIChatParams, AIChatResult, AIProviderName } from '../types'

export abstract class BaseAIProvider {
  /** provider 名称 */
  abstract readonly name: AIProviderName

  /** 默认模型 */
  abstract readonly defaultModel: string

  /** API Key（不记录到日志） */
  protected readonly apiKey: string

  /** Base URL */
  protected readonly baseUrl: string

  constructor(opts: { apiKey: string; baseUrl: string }) {
    this.apiKey = opts.apiKey
    this.baseUrl = opts.baseUrl
  }

  /** 检查配置是否就绪 */
  isConfigured(): boolean {
    return this.apiKey.length > 0 && this.baseUrl.length > 0
  }

  /**
   * 调用 AI 接口
   * 子类必须实现
   */
  abstract chat(params: AIChatParams): Promise<AIChatResult>

  /**
   * 创建带超时的 fetch 请求
   * @returns [response, abortController] 用于在需要时手动 abort
   */
  protected async fetchWithTimeout(
    url: string,
    init: RequestInit,
    timeoutMs: number,
  ): Promise<Response> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      })
      return response
    } finally {
      clearTimeout(timer)
    }
  }

  /**
   * 提取 OpenAI 兼容格式的响应
   * 各 provider 共用
   */
  protected parseOpenAIResponse(data: unknown): {
    content: string
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
  } {
    const obj = data as Record<string, unknown>
    const choices = obj.choices as Array<Record<string, unknown>> | undefined
    const content =
      (choices?.[0]?.message as Record<string, unknown>)?.content ?? ''
    const usage = (obj.usage as Record<string, unknown>) || undefined
    return {
      content: typeof content === 'string' ? content : String(content ?? ''),
      promptTokens: usage?.prompt_tokens as number | undefined,
      completionTokens: usage?.completion_tokens as number | undefined,
      totalTokens: usage?.total_tokens as number | undefined,
    }
  }

  /**
   * 构造 OpenAI 兼容请求体
   */
  protected buildOpenAIBody(params: AIChatParams): Record<string, unknown> {
    const body: Record<string, unknown> = {
      model: params.model || this.defaultModel,
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? 2000,
      stream: false,
    }
    if (params.jsonMode) {
      body.response_format = { type: 'json_object' }
    }
    return body
  }
}
