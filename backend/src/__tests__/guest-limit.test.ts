/**
 * P0-2 单测：游客每日扫描次数限制
 *
 * 运行方式（项目根目录）：
 *   cd backend && npx ts-node -r tsconfig-paths/register src/__tests__/guest-limit.test.ts
 *
 * 设计说明：
 * - 使用 Node 内置 assert，不引入第三方测试框架
 * - 使用 :memory: SQLite 隔离测试，不影响真实数据库
 * - 必须在 require 业务模块之前设置 DB_PATH，否则 db 单例会用默认路径初始化
 */
/* eslint-disable @typescript-eslint/no-var-requires */
import assert from 'node:assert'

// ===== 必须在 require 业务模块前设置环境变量 =====
process.env.DB_PATH = ':memory:'
process.env.GUEST_DAILY_LIMIT = '3' // 测试用 3 次

const db = require('@/database').default
const { userService } = require('@/services/user.service')
const { BusinessError } = require('@/utils/response')

const DAILY_LIMIT = 3

let passed = 0
let failed = 0

function test(name: string, fn: () => void): void {
  try {
    fn()
    passed++
    console.log(`  ✓ ${name}`)
  } catch (e) {
    failed++
    console.error(`  ✗ ${name}`)
    console.error('    ', e instanceof Error ? e.message : e)
  }
}

function expectThrow10303(fn: () => void): void {
  assert.throws(
    fn,
    (err: unknown) => err instanceof BusinessError && (err as { code: number }).code === 10303,
    '应抛出 BusinessError(10303)',
  )
}

console.log('\n=== P0-2 游客每日次数限制单测 ===\n')

// 每个测试前清理表，避免相互污染
function resetTable(): void {
  db.prepare('DELETE FROM guest_sessions').run()
}

test('新游客连续扫描 N 次成功，第 N+1 次抛 10303', () => {
  resetTable()
  const guestId = 'guest_test_limit'
  for (let i = 1; i <= DAILY_LIMIT; i++) {
    const remaining = userService.incrementGuestScanCount(guestId)
    assert.ok(
      remaining >= 0,
      `第 ${i} 次应成功，期望 remaining >= 0，实际 ${remaining}`,
    )
  }
  expectThrow10303(() => userService.incrementGuestScanCount(guestId))
})

test('scan_count 正确递增（旧 bug：永远被重置为 0）', () => {
  resetTable()
  const guestId = 'guest_test_increment'
  userService.incrementGuestScanCount(guestId)
  userService.incrementGuestScanCount(guestId)
  const row = db
    .prepare('SELECT scan_count FROM guest_sessions WHERE id = ?')
    .get(guestId) as { scan_count: number } | undefined
  assert.strictEqual(row?.scan_count, 2, 'scan_count 必须为 2（旧 bug 会重置为 0）')
})

test('同一天内多次扫描，scan_count 持续累加不重置', () => {
  resetTable()
  const guestId = 'guest_test_no_reset'
  userService.incrementGuestScanCount(guestId)
  userService.incrementGuestScanCount(guestId)
  userService.incrementGuestScanCount(guestId) // 第 3 次（达到上限）
  const row = db
    .prepare('SELECT scan_count FROM guest_sessions WHERE id = ?')
    .get(guestId) as { scan_count: number } | undefined
  assert.strictEqual(row?.scan_count, DAILY_LIMIT, 'scan_count 必须为 3，不应被错误重置')
  // 第 4 次必须被拦截
  expectThrow10303(() => userService.incrementGuestScanCount(guestId))
})

test('跨天 reset 后恢复 N 次', () => {
  resetTable()
  const guestId = 'guest_test_reset'
  // 先用尽当天次数
  for (let i = 0; i < DAILY_LIMIT; i++) {
    userService.incrementGuestScanCount(guestId)
  }
  expectThrow10303(() => userService.incrementGuestScanCount(guestId))

  // 模拟跨天：把 last_scan_at 改成昨天（YYYY-MM-DD 格式）
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString('en-CA')
  db.prepare('UPDATE guest_sessions SET last_scan_at = ? WHERE id = ?').run(yesterday, guestId)

  // 跨天后应恢复 N 次
  const remaining = userService.incrementGuestScanCount(guestId)
  assert.ok(remaining >= 0, '跨天 reset 后应可继续扫描')
})

test('兼容旧格式 last_scan_at（YYYY-MM-DD HH:MM:SS）也能正确判断', () => {
  resetTable()
  const guestId = 'guest_test_legacy'
  const today = new Date().toLocaleDateString('en-CA')
  // 写入旧格式（SQLite CURRENT_TIMESTAMP 风格）
  db.prepare(
    'INSERT INTO guest_sessions (id, scan_count, last_scan_at) VALUES (?, ?, ?)',
  ).run(guestId, DAILY_LIMIT, `${today} 12:00:00`)

  // 今天已用尽，应抛 10303（旧 bug 会因格式不一致误判 needReset=true 而放行）
  expectThrow10303(() => userService.incrementGuestScanCount(guestId))
})

test('不存在的 guestId 自动创建会话并扣 1 次', () => {
  resetTable()
  const guestId = 'guest_test_auto_create'
  const remaining = userService.incrementGuestScanCount(guestId)
  assert.ok(remaining === DAILY_LIMIT - 1, `应自动创建并扣 1 次，剩余应为 ${DAILY_LIMIT - 1}`)
  const row = db
    .prepare('SELECT scan_count FROM guest_sessions WHERE id = ?')
    .get(guestId) as { scan_count: number } | undefined
  assert.strictEqual(row?.scan_count, 1, '自动创建后 scan_count 应为 1')
})

console.log(`\n结果: ${passed} 通过, ${failed} 失败\n`)

if (failed > 0) {
  process.exit(1)
}
