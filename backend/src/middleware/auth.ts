import { type Request, type Response, type NextFunction } from 'express'
import { extractToken } from '@/utils/jwt'
import { fail } from '@/utils/response'

/**
 * 强制认证中间件
 * 必须携带有效 JWT token，否则返回 401
 * 挂载 user 信息到 req
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

  req.user = { userId: payload.userId!, isGuest: false }
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
