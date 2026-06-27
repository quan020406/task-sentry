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

initSchema()

export default db
