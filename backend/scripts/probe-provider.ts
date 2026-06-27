/**
 * Provider 探测脚本（S06 #1 临时测试脚本）
 *
 * 依次尝试 deepseek → doubao → openai → wenxin，找到第一个可用的 provider。
 * 所有 provider 均使用 OpenAI 兼容的 /v1/chat/completions 端点。
 *
 * 运行：npx ts-node scripts/probe-provider.ts
 */
import dotenv from 'dotenv'
dotenv.config()

const apiKey = process.env.DONGRUAN_SHIXUN_API_KEY || process.env.AI_API_KEY || ''
if (!apiKey) {
  console.error('❌ 未找到 API Key（DONGRUAN_SHIXUN_API_KEY / AI_API_KEY 均为空）')
  process.exit(1)
}
console.log(`✅ API Key 已配置（前 8 位: ${apiKey.slice(0, 8)}...，长度: ${apiKey.length}）`)

const PROVIDERS = [
  { name: 'deepseek', baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' },
  { name: 'doubao', baseUrl: 'https://ark.cn-beijing.volces.com/api', model: 'doubao-pro-32k-241105' },
  { name: 'openai', baseUrl: 'https://api.openai.com', model: 'gpt-4o-mini' },
  { name: 'wenxin', baseUrl: 'https://qianfan.baidubce.com/v2', model: 'ernie-4.0-8k-latest' },
]

async function probeProvider(p: (typeof PROVIDERS)[0]): Promise<boolean> {
  const url = `${p.baseUrl.replace(/\/$/, '')}/v1/chat/completions`
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: p.model,
        messages: [{ role: 'user', content: '回复"OK"两个字' }],
        max_tokens: 10,
        temperature: 0,
        stream: false,
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (res.ok) {
      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>
        usage?: { total_tokens?: number }
      }
      const content = data.choices?.[0]?.message?.content || ''
      const usage = data.usage || {}
      console.log(
        `✅ ${p.name} 可用（模型: ${p.model}，响应: ${content.slice(0, 50)}，tokens: ${usage.total_tokens ?? 'N/A'}）`,
      )
      return true
    } else {
      const text = await res.text().catch(() => '')
      console.log(
        `❌ ${p.name} 不可用（HTTP ${res.status}: ${text.slice(0, 150)}）`,
      )
      return false
    }
  } catch (e) {
    console.log(
      `❌ ${p.name} 不可用（${e instanceof Error ? e.message.slice(0, 150) : String(e)}）`,
    )
    return false
  }
}

async function main(): Promise<void> {
  console.log('\n=== 开始探测可用 provider ===\n')
  for (const p of PROVIDERS) {
    const ok = await probeProvider(p)
    if (ok) {
      console.log(`\n🎯 推荐 provider: ${p.name}`)
      console.log(`   AI_PROVIDER=${p.name}`)
      console.log(`   AI_BASE_URL=${p.baseUrl}`)
      console.log(`   AI_MODEL=${p.model}`)
      return
    }
  }
  console.log('\n❌ 所有 provider 均不可用，请检查 API Key 是否有效或网络是否能访问对应地址')
  process.exit(2)
}

main()
