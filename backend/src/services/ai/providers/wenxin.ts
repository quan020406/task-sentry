/**
 * 文心一言（百度千帆）Provider
 * 使用 OpenAI 兼容接口（百度千帆 v2 API）
 * 文档：https://cloud.baidu.com/doc/WENXINWORKSHOP/index
 */
import { OpenAICompatibleProvider, PROVIDER_DEFAULTS } from './openai'

export class WenxinProvider extends OpenAICompatibleProvider {
  constructor(opts: { apiKey: string; baseUrl?: string; model?: string }) {
    super({
      name: 'wenxin',
      apiKey: opts.apiKey,
      baseUrl: opts.baseUrl || PROVIDER_DEFAULTS.wenxin.baseUrl,
      defaultModel: opts.model || PROVIDER_DEFAULTS.wenxin.defaultModel,
    })
  }
}
