import db from '@/database'
import { BusinessError } from '@/utils/response'
import crypto from 'node:crypto'
import { config } from '@/config'
import { scanService, type ScanResult } from '@/services/scan.service'

/** 分享记录数据库行 */
interface ShareRecordRow {
  id: string
  scan_id: string
  user_id: number
  expire_at: string | null
  view_count: number
  created_at: string
}

/** 有效期天数类型 */
export type ExpireDays = 7 | 30 | 0

/** 创建分享返回结果 */
export interface CreateShareResult {
  id: string
  url: string
  expireAt: string | null
  expireDays: ExpireDays
}

/** 分享内容返回结果（脱敏，只读） */
export interface ShareContentResult {
  id: string
  scanId: string
  expireAt: string | null
  isExpired: boolean
  viewCount: number
  createdAt: string
  /** 扫描结果（不含用户敏感信息） */
  result: ScanResult
}

/** 生成 8 位短 ID（便于分享） */
function generateShareId(): string {
  return 'sh_' + crypto.randomBytes(4).toString('hex')
}

/** 计算过期时间（ISO 字符串），0 表示永久 */
function computeExpireAt(expireDays: ExpireDays): string | null {
  if (expireDays === 0) return null
  const now = new Date()
  now.setDate(now.getDate() + expireDays)
  return now.toISOString()
}

/** 判断是否过期 */
function isExpired(expireAt: string | null): boolean {
  if (!expireAt) return false
  return new Date(expireAt).getTime() < Date.now()
}

export const shareService = {
  /**
   * 创建分享链接
   * @throws 10401 扫描记录不存在
   * @throws 10403 无权分享该记录
   */
  createShare(
    userId: number,
    scanId: string,
    expireDays: ExpireDays,
  ): CreateShareResult {
    // 校验扫描记录存在且属于该用户
    const row = db.prepare('SELECT user_id FROM scan_records WHERE id = ?').get(scanId) as
      | { user_id: number | null }
      | undefined

    if (!row) {
      throw new BusinessError(10401, '扫描记录不存在')
    }
    if (row.user_id !== userId) {
      throw new BusinessError(10403, '无权分享该扫描记录')
    }

    const id = generateShareId()
    const expireAt = computeExpireAt(expireDays)

    db.prepare(
      `INSERT INTO shares (id, scan_id, user_id, expire_at) VALUES (?, ?, ?, ?)`,
    ).run(id, scanId, userId, expireAt)

    const url = `${config.clientOrigin}/share/${id}`

    return {
      id,
      url,
      expireAt,
      expireDays,
    }
  },

  /**
   * 获取分享内容（无需登录）
   * - 验证分享是否存在
   * - 验证是否过期
   * - 增加浏览次数
   * - 返回扫描结果（只读）
   *
   * @throws 10601 分享不存在
   * @throws 10602 分享已过期
   */
  getShare(id: string): ShareContentResult {
    const row = db.prepare('SELECT * FROM shares WHERE id = ?').get(id) as
      | ShareRecordRow
      | undefined

    if (!row) {
      throw new BusinessError(10601, '分享不存在或已被删除')
    }

    const expired = isExpired(row.expire_at)
    if (expired) {
      throw new BusinessError(10602, '分享已过期')
    }

    // 增加浏览次数（异步不影响主流程，但 SQLite 同步操作很快，直接执行）
    db.prepare('UPDATE shares SET view_count = view_count + 1 WHERE id = ?').run(id)

    // 获取扫描结果（复用 scanService 的旧数据兼容逻辑）
    const result = scanService.getScanById(row.scan_id)

    // S13 修复（S11 #1）：分享是匿名只读视图，剥离访问者相关字段
    // isFavorite 是原扫描者的收藏状态，对分享访问者无意义且会泄露用户行为
    delete result.isFavorite

    return {
      id: row.id,
      scanId: row.scan_id,
      expireAt: row.expire_at,
      isExpired: false,
      viewCount: row.view_count + 1,
      createdAt: row.created_at,
      result,
    }
  },

  /**
   * 获取用户分享统计（可选）
   */
  getShareStats(userId: number): {
    totalShares: number
    activeShares: number
    expiredShares: number
    totalViews: number
  } {
    const row = db
      .prepare(
        `SELECT
          COUNT(*) as total_shares,
          SUM(CASE WHEN expire_at IS NULL OR expire_at > datetime('now') THEN 1 ELSE 0 END) as active_shares,
          SUM(CASE WHEN expire_at IS NOT NULL AND expire_at <= datetime('now') THEN 1 ELSE 0 END) as expired_shares,
          SUM(view_count) as total_views
        FROM shares WHERE user_id = ?`,
      )
      .get(userId) as {
      total_shares: number
      active_shares: number | null
      expired_shares: number | null
      total_views: number | null
    }

    return {
      totalShares: row.total_shares || 0,
      activeShares: row.active_shares || 0,
      expiredShares: row.expired_shares || 0,
      totalViews: row.total_views || 0,
    }
  },
}
