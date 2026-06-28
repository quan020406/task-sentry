import jwt from 'jsonwebtoken'
import { config } from '@/config'

/** JWT 载荷：用户身份信息 */
export interface JwtUserPayload {
  /** 用户 ID（登录用户） */
  userId?: number
  /** 游客 ID（游客模式） */
  guestId?: string
  /** 是否为游客 */
  isGuest: boolean
  /** P1-4：token 版本号，仅用户 token 携带；修改密码后 +1 使旧 token 失效。游客不需要 */
  tokenVersion?: number
}

/**
 * 生成 JWT token
 * @param payload 载荷信息
 * @param expiresIn 过期时间（默认从配置读取）
 */
export function signToken(
  payload: JwtUserPayload,
  expiresIn?: string,
): string {
  const exp = expiresIn || (payload.isGuest ? config.guestJwtExpiresIn : config.jwtExpiresIn)
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: exp as unknown as number,
  })
}

/**
 * 验证 JWT token
 * @returns 解析后的载荷，验证失败抛出异常
 */
export function verifyToken(token: string): JwtUserPayload {
  return jwt.verify(token, config.jwtSecret) as JwtUserPayload
}

/**
 * 从 Authorization 头中提取并验证 token
 * @returns 载荷或 null（无 token 或格式错误）
 */
export function extractToken(authHeader?: string): JwtUserPayload | null {
  if (!authHeader) return null
  // 格式：Bearer <token>
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null
  try {
    return verifyToken(parts[1])
  } catch {
    return null
  }
}
