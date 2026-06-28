import { type Request, type Response, type NextFunction } from 'express'
import { extractToken } from '@/utils/jwt'
import { fail } from '@/utils/response'
import db from '@/database'

/**
 * 强制认证中间件
 * 必须携带有效 JWT token，否则返回 401
 * 挂载 user 信息到 req
 *
 * P1-4：用户 token 校验时比对 DB 中的 token_version，修改密码后旧 token 立即失效。
 * 游客 token 在此中间件已被拒绝（10202），不会进入 DB 查询分支。
 * 旧 token 缺少 tokenVersion 字段时按 0 处理，兼容历史 token。
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const payload = extractToken(req.headers.authorization)

  if (!payload) {
    res.json(fail(10201, '未认证，请先登录'))
    return
  }

  // 游客不能访问需要登录的接口
  if (payload.isGuest) {
    res.json(fail(10202, '该操作需要登录用户权限'))
    return
  }

  // P1-4：比对 DB 中的 token_version，不一致则旧 token 失效
  const tokenVersion = payload.tokenVersion ?? 0
  const row = db
    .prepare('SELECT token_version FROM users WHERE id = ?')
    .get(payload.userId) as { token_version: number } | undefined

  if (!row || tokenVersion !== row.token_version) {
    res.json(fail(10201, '登录已失效，请重新登录'))
    return
  }

  req.user = { userId: payload.userId!, isGuest: false, tokenVersion: row.token_version }
  next()
}

/**
 * 可选认证中间件
 * 游客和登录用户均可访问
 * - 有 token：挂载 user 或 guestId
 * - 无 token：创建游客身份（由业务层处理）
 */
export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const payload = extractToken(req.headers.authorization)

  if (payload) {
    if (payload.isGuest) {
      req.guestId = payload.guestId
      req.isGuest = true
    } else if (payload.userId) {
      req.user = { userId: payload.userId, isGuest: false }
      req.isGuest = false
    }
  }

  next()
}
