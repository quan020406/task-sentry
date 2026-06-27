/**
 * 豆包（字节跳动）Provider
 * 使用 OpenAI 兼容接口
 * 文档：https://www.volcengine.com/docs/82379
 */
import { OpenAICompatibleProvider, PROVIDER_DEFAULTS } from './openai'

export class DoubaoProvider extends OpenAICompatibleProvider {
  constructor(opts: { apiKey: string; baseUrl?: string; model?: string }) {
    super({
      name: 'doubao',
      apiKey: opts.apiKey,
      baseUrl: opts.baseUrl || PROVIDER_DEFAULTS.doubao.baseUrl,
      defaultModel: opts.model || PROVIDER_DEFAULTS.doubao.defaultModel,
    })
  }
}
