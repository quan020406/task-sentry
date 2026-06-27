/**
 * DeepSeek Provider
 * 使用 OpenAI 兼容接口
 * 文档：https://platform.deepseek.com/api-docs
 */
import { OpenAICompatibleProvider, PROVIDER_DEFAULTS } from './openai'

export class DeepSeekProvider extends OpenAICompatibleProvider {
  constructor(opts: { apiKey: string; baseUrl?: string; model?: string }) {
    super({
      name: 'deepseek',
      apiKey: opts.apiKey,
      baseUrl: opts.baseUrl || PROVIDER_DEFAULTS.deepseek.baseUrl,
      defaultModel: opts.model || PROVIDER_DEFAULTS.deepseek.defaultModel,
    })
  }
}
