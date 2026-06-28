import Database from 'better-sqlite3'
import path from 'node:path'
import fs from 'node:fs'
import { config } from '@/config'

// 确保数据目录存在
const dbDir = path.dirname(config.dbPath)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

/**
 * SQLite 数据库连接
 * 使用 better-sqlite3 同步 API
 */
const db = new Database(config.dbPath)

// 开启 WAL 模式提升并发读性能
db.pragma('journal_mode = WAL')
// 开启外键约束
db.pragma('foreign_keys = ON')

/**
 * 启动时自动建表
 * 读取 schema.sql 并执行（CREATE TABLE IF NOT EXISTS，幂等）
 */
function initSchema(): void {
  const schemaPath = path.join(__dirname, 'schema.sql')
  if (!fs.existsSync(schemaPath)) {
    console.warn(`[database] 未找到 schema.sql: ${schemaPath}，跳过自动建表`)
    return
  }
  const sql = fs.readFileSync(schemaPath, 'utf-8')
  db.exec(sql)
  console.log('[database] 表结构初始化完成')
}

/**
 * P1-4：幂等 migration —— 为已存在的 users 表补充 token_version 字段
 *
 * 背景：线上已有数据库不会因 schema.sql 的 CREATE TABLE IF NOT EXISTS 而新增字段，
 * 必须用 ALTER TABLE 显式补列。此处用 PRAGMA table_info 检查列是否存在，保证幂等。
 *
 * 规则：
 * - 不删除/重建 users 表，不影响已有用户数据
 * - 默认值 0，兼容历史 token（旧 token 无 tokenVersion 字段，按 0 处理）
 */
function runMigrations(): void {
  const columns = db.prepare('PRAGMA table_info(users)').all() as Array<{ name: string }>
  const hasTokenVersion = columns.some((col) => col.name === 'token_version')

  if (!hasTokenVersion) {
    db.prepare('ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0').run()
    console.log('[database] migration: users 表新增 token_version 字段')
  }
}

initSchema()
runMigrations()

export default db
