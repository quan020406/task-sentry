/**
 * 结果存储验证脚本（S06 #1 临时测试脚本）
 *
 * 直接读取 SQLite 数据库，验证 scan_records 表的 result_json 完整性。
 *
 * 运行：npx ts-node scripts/verify-storage.ts
 */
import dotenv from 'dotenv'
import Database from 'better-sqlite3'
import path from 'node:path'

dotenv.config()

const dbPath = process.env.DB_PATH || './data/app.db'
const db = new Database(path.resolve(process.cwd(), dbPath))

interface ScanRecordRow {
  id: string
  user_id: number | null
  guest_id: string | null
  identity: string
  task_text: string
  score: number | null
  risk_level: string | null
  result_json: string | null
  is_favorite: number
  created_at: string
}

// 查询最近的 7 条扫描记录（1 条游客 + 6 条用户）
const rows = db
  .prepare(
    `SELECT id, user_id, guest_id, identity, task_text, score, risk_level, result_json, is_favorite, created_at
     FROM scan_records
     ORDER BY created_at DESC
     LIMIT 10`,
  )
  .all() as ScanRecordRow[]

console.log('=== scan_records 表存储验证 ===')
console.log(`找到 ${rows.length} 条记录\n`)

for (const row of rows) {
  console.log(`--- ID: ${row.id} ---`)
  console.log(`  identity: ${row.identity}`)
  console.log(`  score: ${row.score}`)
  console.log(`  risk_level: ${row.risk_level}`)
  console.log(`  user_id: ${row.user_id}, guest_id: ${row.guest_id}`)
  console.log(`  created_at: ${row.created_at}`)
  console.log(`  task_text 前 40 字符: ${row.task_text.slice(0, 40)}`)

  if (!row.result_json) {
    console.log('  ❌ result_json 为空')
    continue
  }

  try {
    const result = JSON.parse(row.result_json) as {
      score: number
      riskLevel: string
      summary: string
      highlightWords: Array<{ word: string; type: string; explanation: string }>
      riskGroups: Array<{
        name: string
        items: Array<{ text: string; level: string; reason: string; suggestion: string }>
      }>
      questions: { mustAsk: Array<{ q: string; why: string }>; laterAsk: Array<{ q: string; why: string }> }
      mvp: { do: string[]; dontDo: string[]; later: string[] }
      roadmap: Array<{ step: number; title: string; desc: string }>
      confirmScript: string
    }

    console.log(`  ✅ result_json 可正常 JSON.parse`)
    console.log(`     score: ${result.score}, riskLevel: ${result.riskLevel}`)
    console.log(`     summary 长度: ${result.summary.length}`)
    console.log(`     highlightWords: ${result.highlightWords.length} 项`)
    if (result.highlightWords.length > 0) {
      const hw = result.highlightWords[0]
      console.log(`       首项: word="${hw.word}", type="${hw.type}", explanation 长度=${hw.explanation.length}`)
      const hasTypeExp = result.highlightWords.every(
        (h) => h.type && h.explanation,
      )
      console.log(`       所有项含 type/explanation: ${hasTypeExp ? '✅' : '❌'}`)
    }
    console.log(`     riskGroups: ${result.riskGroups.length} 组`)
    if (result.riskGroups.length > 0 && result.riskGroups[0].items.length > 0) {
      const item = result.riskGroups[0].items[0]
      console.log(
        `       首项: text="${item.text.slice(0, 20)}", level=${item.level}, suggestion 长度=${item.suggestion.length}`,
      )
      const allHaveSuggestion = result.riskGroups.every((g) =>
        g.items.every((item) => item.suggestion && item.suggestion.length > 0),
      )
      console.log(`       所有 items 含 suggestion: ${allHaveSuggestion ? '✅' : '❌'}`)
    }
    console.log(
      `     questions: mustAsk=${result.questions.mustAsk.length}, laterAsk=${result.questions.laterAsk.length}`,
    )
    console.log(
      `     mvp: do=${result.mvp.do.length}, dontDo=${result.mvp.dontDo.length}, later=${result.mvp.later.length}`,
    )
    console.log(`     roadmap: ${result.roadmap.length} 步`)
    console.log(`     confirmScript 长度: ${result.confirmScript.length}`)
    console.log(`     confirmScript 前 30 字符: ${result.confirmScript.slice(0, 30)}`)
  } catch (e) {
    console.log(`  ❌ result_json 解析失败: ${e instanceof Error ? e.message : String(e)}`)
  }
  console.log('')
}

db.close()
