import db from '@/database'
import { hashPassword, comparePassword } from '@/utils/password'
import { signToken } from '@/utils/jwt'
import { BusinessError } from '@/utils/response'
import { config } from '@/config'
import crypto from 'node:crypto'
import { scanService } from '@/services/scan.service'

/** 用户记录（数据库行） */
interface UserRow {
  id: number
  username: string
  email: string
  password_hash: string
  avatar: string | null
  scan_count: number
  created_at: string
  updated_at: string
}

/** 游客会话记录 */
interface GuestSessionRow {
  id: string
  scan_count: number
  last_scan_at: string | null
  created_at: string
}

/** 对外暴露的用户信息（去除密码） */
export interface UserProfile {
  id: number
  username: string
  email: string
  avatar: string | null
  scanCount: number
  createdAt: string
}

/** 登录/注册返回结果 */
export interface AuthResult {
  token: string
  user: UserProfile
}

/** 游客会话结果 */
export interface GuestSessionResult {
  token: string
  guestId: string
  remainingCount: number
  resetAt: string
}

/** 将数据库行转为对外用户信息 */
function toUserProfile(row: UserRow): UserProfile {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    avatar: row.avatar,
    scanCount: row.scan_count,
    createdAt: row.created_at,
  }
}

/** 生成 32 位游客 ID */
function generateGuestId(): string {
  return 'guest_' + crypto.randomBytes(12).toString('hex')
}

/**
 * P0-2 修复：统一的本地日期工具
 *
 * 旧实现的根因 bug：
 *   getTodayRange() 返回 today.toISOString() → "2026-06-28T00:00:00.000Z"（T 分隔）
 *   而 last_scan_at 用 SQLite CURRENT_TIMESTAMP → "2026-06-28 02:00:00"（空格分隔）
 *   字符串比较时第 11 位 ' '(0x20) < 'T'(0x54)，导致 last_scan_at < todayStr 永真，
 *   needReset 永远成立，scan_count 永远被重置为 0，游客永远到不了次数上限。
 *
 * 修复策略：统一用本地时区 YYYY-MM-DD 日期字符串比较 + 存储，彻底消除格式不一致。
 */

/** 获取本地时区今日日期字符串 YYYY-MM-DD（en-CA locale 保证格式） */
function getTodayDateStr(): string {
  // toLocaleDateString('en-CA') 在所有 Node 版本下稳定返回 'YYYY-MM-DD'
  return new Date().toLocaleDateString('en-CA')
}

/** 计算次日 0 点的 ISO 字符串（用于 resetAt 返回给前端展示） */
function getTomorrowIso(): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
  return tomorrow.toISOString()
}

/**
 * 从 guest_sessions.last_scan_at 提取日期部分 YYYY-MM-DD
 * 兼容旧数据 "YYYY-MM-DD HH:MM:SS"（SQLite CURRENT_TIMESTAMP）与新数据 "YYYY-MM-DD"
 */
function getLastScanDate(lastScanAt: string | null): string {
  if (!lastScanAt) return ''
  return lastScanAt.slice(0, 10)
}

export const userService = {
  /**
   * 用户注册
   * @throws 10101 用户名已存在
   * @throws 10102 邮箱已存在
   */
  async register(username: string, email: string, password: string): Promise<AuthResult> {
    // 校验用户名
    const existUser = db
      .prepare('SELECT id FROM users WHERE username = ? OR email = ?')
      .get(username, email) as { id: number } | undefined

    if (existUser) {
      // 区分是用户名还是邮箱冲突
      const byUsername = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
      if (byUsername) {
        throw new BusinessError(10101, '用户名已存在')
      }
      throw new BusinessError(10102, '邮箱已存在')
    }

    // 加密密码
    const passwordHash = await hashPassword(password)

    // 插入用户
    const result = db
      .prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)')
      .run(username, email, passwordHash)

    const userRow = db
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(result.lastInsertRowid) as UserRow

    const token = signToken({ userId: userRow.id, isGuest: false })
    return { token, user: toUserProfile(userRow) }
  },

  /**
   * 用户登录
   * @throws 10103 用户名或密码错误
   */
  async login(account: string, password: string): Promise<AuthResult> {
    // 支持用户名或邮箱登录
    const userRow = db
      .prepare('SELECT * FROM users WHERE username = ? OR email = ?')
      .get(account, account) as UserRow | undefined

    if (!userRow) {
      throw new BusinessError(10103, '用户名或密码错误')
    }

    const matched = await comparePassword(password, userRow.password_hash)
    if (!matched) {
      throw new BusinessError(10103, '用户名或密码错误')
    }

    const token = signToken({ userId: userRow.id, isGuest: false })
    return { token, user: toUserProfile(userRow) }
  },

  /**
   * 获取用户信息
   * @throws 10104 账号不存在
   */
  getProfile(userId: number): UserProfile {
    const userRow = db
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(userId) as UserRow | undefined

    if (!userRow) {
      throw new BusinessError(10104, '账号不存在')
    }

    return toUserProfile(userRow)
  },

  /**
   * 更新用户信息
   * @throws 10101 用户名已存在
   * @throws 10102 邮箱已存在
   */
  updateProfile(userId: number, data: { username?: string; avatar?: string }): UserProfile {
    const userRow = db
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(userId) as UserRow | undefined

    if (!userRow) {
      throw new BusinessError(10104, '账号不存在')
    }

    // 检查用户名冲突
    if (data.username && data.username !== userRow.username) {
      const conflict = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(data.username, userId)
      if (conflict) {
        throw new BusinessError(10101, '用户名已存在')
      }
    }

    db.prepare('UPDATE users SET username = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(data.username ?? userRow.username, data.avatar ?? userRow.avatar, userId)

    return this.getProfile(userId)
  },

  /**
   * 修改密码
   * @throws 10103 旧密码错误
   */
  async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<void> {
    const userRow = db
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(userId) as UserRow | undefined

    if (!userRow) {
      throw new BusinessError(10104, '账号不存在')
    }

    const matched = await comparePassword(oldPassword, userRow.password_hash)
    if (!matched) {
      throw new BusinessError(10103, '旧密码错误')
    }

    const newHash = await hashPassword(newPassword)
    db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(newHash, userId)
  },

  /**
   * 用户使用统计
   * 从 scan_records 表聚合真实数据（S10 实现）
   */
  getStats(userId: number): {
    totalScans: number
    favoriteCount: number
    avgScore: number
    highRiskCount: number
    midRiskCount: number
    lowRiskCount: number
  } {
    const userRow = db.prepare('SELECT scan_count FROM users WHERE id = ?').get(userId) as { scan_count: number } | undefined
    if (!userRow) {
      throw new BusinessError(10104, '账号不存在')
    }

    // 从 scan_records 表聚合真实统计数据
    const stats = scanService.getUserScanStats(userId)

    return {
      totalScans: stats.totalScans,
      favoriteCount: stats.favoriteCount,
      avgScore: stats.avgScore,
      highRiskCount: stats.highRiskCount,
      midRiskCount: stats.midRiskCount,
      lowRiskCount: stats.lowRiskCount,
    }
  },

  /**
   * 增加用户扫描次数
   */
  incrementScanCount(userId: number): void {
    db.prepare('UPDATE users SET scan_count = scan_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(userId)
  },

  // ===== 游客相关 =====

  /**
   * 创建游客会话
   * 生成游客 ID + JWT token
   */
  createGuestSession(): GuestSessionResult {
    const guestId = generateGuestId()
    db.prepare('INSERT INTO guest_sessions (id, scan_count) VALUES (?, 0)').run(guestId)

    const token = signToken({ guestId, isGuest: true })

    return {
      token,
      guestId,
      remainingCount: config.guestDailyLimit,
      resetAt: getTomorrowIso(),
    }
  },

  /**
   * 获取游客会话
   * 如果传入的 guestId 不存在则创建新会话
   * 如果上次扫描是昨天及之前，重置次数
   */
  getOrCreateGuestSession(guestId?: string): GuestSessionResult {
    const todayStr = getTodayDateStr()
    const tomorrowIso = getTomorrowIso()

    if (guestId) {
      const session = db.prepare('SELECT * FROM guest_sessions WHERE id = ?').get(guestId) as GuestSessionRow | undefined

      if (session) {
        // P0-2 修复：用统一的 YYYY-MM-DD 日期比较，替代旧的 ISO 字符串比较（旧逻辑永真导致永远重置）
        const needReset = getLastScanDate(session.last_scan_at) !== todayStr
        if (needReset) {
          db.prepare('UPDATE guest_sessions SET scan_count = 0 WHERE id = ?').run(guestId)
          session.scan_count = 0
        }

        const remainingCount = Math.max(0, config.guestDailyLimit - session.scan_count)
        const token = signToken({ guestId, isGuest: true })

        return { token, guestId, remainingCount, resetAt: tomorrowIso }
      }
    }

    // 不存在则创建
    return this.createGuestSession()
  },

  /**
   * 增加游客扫描次数（P0-2 修复：事务保证 check + increment 原子性，杜绝并发超扣）
   *
   * 流程（事务内）：
   *   1. 读取 session
   *   2. 跨天则重置
   *   3. 检查是否超限 → 超限抛 10303（不调用 AI）
   *   4. scan_count + 1，last_scan_at 写今日日期
   *
   * @returns 剩余次数
   * @throws 10303 游客次数已用尽
   */
  incrementGuestScanCount(guestId: string): number {
    const todayStr = getTodayDateStr()

    const incrementTxn = db.transaction(() => {
      const session = db.prepare('SELECT * FROM guest_sessions WHERE id = ?').get(guestId) as
        | GuestSessionRow
        | undefined

      // 不存在则创建新会话并直接扣 1 次
      if (!session) {
        db.prepare(
          'INSERT INTO guest_sessions (id, scan_count, last_scan_at) VALUES (?, 1, ?)',
        ).run(guestId, todayStr)
        return Math.max(0, config.guestDailyLimit - 1)
      }

      // 跨天重置判断（统一 YYYY-MM-DD 比较）
      const needReset = getLastScanDate(session.last_scan_at) !== todayStr
      const currentCount = needReset ? 0 : session.scan_count

      // 前置校验：超限直接抛错，不进入扫描流程
      if (currentCount >= config.guestDailyLimit) {
        throw new BusinessError(10303, '今日免费扫描次数已用尽，登录后可继续使用')
      }

      const newCount = currentCount + 1
      // last_scan_at 改存 YYYY-MM-DD（与比较格式一致），不再用 CURRENT_TIMESTAMP
      db.prepare('UPDATE guest_sessions SET scan_count = ?, last_scan_at = ? WHERE id = ?').run(
        newCount,
        todayStr,
        guestId,
      )

      return Math.max(0, config.guestDailyLimit - newCount)
    })

    return incrementTxn()
  },

  /** 获取游客剩余次数（不增加） */
  getGuestRemainingCount(guestId: string): number {
    const todayStr = getTodayDateStr()
    const session = db.prepare('SELECT * FROM guest_sessions WHERE id = ?').get(guestId) as GuestSessionRow | undefined

    if (!session) {
      return config.guestDailyLimit
    }

    const needReset = getLastScanDate(session.last_scan_at) !== todayStr
    const currentCount = needReset ? 0 : session.scan_count
    return Math.max(0, config.guestDailyLimit - currentCount)
  },
}
