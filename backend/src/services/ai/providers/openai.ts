/**
 * OpenAI 兼容 Provider
 *
 * 适用于：OpenAI / DeepSeek / 豆包 / 文心一言（OpenAI 兼容接口）
 * 都使用 /v1/chat/completions 端点，请求/响应格式一致
 *
 * 不同 provider 只是 baseUrl 和默认模型不同
 */
import { BaseAIProvider } from './base'
import type { AIChatParams, AIChatResult, AIProviderName } from '../types'

export class OpenAICompatibleProvider extends BaseAIProvider {
  readonly name: AIProviderName
  readonly defaultModel: string

  constructor(opts: {
    name: AIProviderName
    apiKey: string
    baseUrl: string
    defaultModel: string
  }) {
    super({ apiKey: opts.apiKey, baseUrl: opts.baseUrl })
    this.name = opts.name
    this.defaultModel = opts.defaultModel
  }

  async chat(params: AIChatParams): Promise<AIChatResult> {
    const url = `${this.baseUrl.replace(/\/$/, '')}/v1/chat/completions`
    const body = this.buildOpenAIBody(params)
    const timeoutMs = params.timeoutMs ?? 30000

    const response = await this.fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      },
      timeoutMs,
    )

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(
        `AI 接口返回 HTTP ${response.status}: ${errorText.slice(0, 200)}`,
      )
    }

    const data = await response.json()
    const parsed = this.parseOpenAIResponse(data)

    return {
      content: parsed.content,
      promptTokens: parsed.promptTokens,
      completionTokens: parsed.completionTokens,
      totalTokens: parsed.totalTokens,
      model: body.model as string,
      provider: this.name,
    }
  }
}

/** OpenAI 官方 Provider */
export class OpenAIProvider extends OpenAICompatibleProvider {
  constructor(opts: { apiKey: string; baseUrl?: string; model?: string }) {
    super({
      name: 'openai',
      apiKey: opts.apiKey,
      baseUrl: opts.baseUrl || PROVIDER_DEFAULTS.openai.baseUrl,
      defaultModel: opts.model || PROVIDER_DEFAULTS.openai.defaultModel,
    })
  }
}

/** 各 provider 的默认配置 */
export const PROVIDER_DEFAULTS: Record<
  Exclude<AIProviderName, 'mock'>,
  { baseUrl: string; defaultModel: string }
> = {
  doubao: {
    baseUrl: 'https://ark.cn-beijing.volces.com/api',
    defaultModel: 'doubao-pro-32k-241105',
  },
  wenxin: {
    baseUrl: 'https://qianfan.baidubce.com/v2',
    defaultModel: 'ernie-4.0-8k-latest',
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
  },
  openai: {
    baseUrl: 'https://api.openai.com',
    defaultModel: 'gpt-4o-mini',
  },
}
