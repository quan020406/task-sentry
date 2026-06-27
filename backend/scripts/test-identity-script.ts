/**
 * 6 种身份话术差异测试（S06 #1 临时测试脚本）
 *
 * 使用已注册用户 token（绕过游客限流），对同一任务文本分别用 6 种身份发起扫描，
 * 对比 confirmScript 开头差异。
 *
 * 运行：npx ts-node scripts/test-identity-script.ts
 */
import dotenv from 'dotenv'
dotenv.config()

const API_BASE = process.env.API_BASE || 'http://localhost:3000'
const USER_TOKEN = process.env.TEST_USER_TOKEN || ''

const IDENTITIES = ['student', 'intern', 'developer', 'designer', 'pm', 'lead'] as const
const TASK_TEXT = '帮我做一个公司官网的首页，要简洁大气，有质感，最好明天能出一版看看'

interface ScanResponse {
  code: number
  message: string
  data?: {
    id: string
    score: number
    riskLevel: string
    confirmScript: string
  }
}

async function main(): Promise<void> {
  if (!USER_TOKEN) {
    console.error('❌ 未设置 TEST_USER_TOKEN 环境变量')
    process.exit(1)
  }

  console.log('=== 6 种身份话术差异测试 ===')
  console.log(`任务文本：${TASK_TEXT}`)
  console.log(`API 地址：${API_BASE}\n`)

  const results: Array<{ identity: string; ok: boolean; firstLine: string; length: number; score: number; level: string; duration: number }> = []

  for (const identity of IDENTITIES) {
    const start = Date.now()
    try {
      const res = await fetch(`${API_BASE}/api/scans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${USER_TOKEN}`,
        },
        body: JSON.stringify({ taskText: TASK_TEXT, identity }),
      })
      const data = (await res.json()) as ScanResponse
      const duration = Date.now() - start

      if (data.code !== 0 || !data.data) {
        console.log(`❌ [${identity}] 扫描失败 - ${data.message}`)
        results.push({ identity, ok: false, firstLine: '', length: 0, score: 0, level: '', duration })
        continue
      }

      const script = data.data.confirmScript || ''
      const firstLine = script.split('\n')[0].slice(0, 100)
      console.log(`✅ [${identity}] ${duration}ms score=${data.data.score} level=${data.data.riskLevel}`)
      console.log(`   开头: ${firstLine}`)
      console.log(`   长度: ${script.length} 字符\n`)
      results.push({ identity, ok: true, firstLine, length: script.length, score: data.data.score, level: data.data.riskLevel, duration })
    } catch (e) {
      const duration = Date.now() - start
      console.log(`❌ [${identity}] 异常 - ${e instanceof Error ? e.message : String(e)}\n`)
      results.push({ identity, ok: false, firstLine: '', length: 0, score: 0, level: '', duration })
    }
  }

  // 汇总
  console.log('=== 汇总 ===')
  console.log('身份     | 耗时    | 分数 | 等级  | 开头')
  console.log('---------|---------|------|-------|-----')
  for (const r of results) {
    if (r.ok) {
      console.log(
        `${r.identity.padEnd(8)} | ${String(r.duration).padStart(5)}ms | ${String(r.score).padStart(4)} | ${r.level.padEnd(5)} | ${r.firstLine.slice(0, 50)}`,
      )
    } else {
      console.log(`${r.identity.padEnd(8)} | ${String(r.duration).padStart(5)}ms | 失败`)
    }
  }

  // 差异校验
  const okResults = results.filter((r) => r.ok)
  const firstLines = okResults.map((r) => r.firstLine)
  const uniqueFirstLines = new Set(firstLines)
  console.log(`\n差异校验：${okResults.length}/6 成功，${uniqueFirstLines.size} 种不同开头`)
  if (uniqueFirstLines.size === okResults.length && okResults.length === 6) {
    console.log('✅ 6 种身份的 confirmScript 开头均不同')
  } else if (uniqueFirstLines.size > 1) {
    console.log('⚠️ 部分身份开头相同（AI 生成存在随机性，关注语气差异即可）')
  } else {
    console.log('❌ 所有身份开头相同，话术差异未体现')
  }
}

main()
