/**
 * Express Request 类型增强
 * 通过模块增强为 Request 添加 user / guestId / isGuest 字段
 */
declare module 'express' {
  interface Request {
    /** 登录用户信息（auth 中间件挂载） */
    user?: {
      userId: number
      isGuest: boolean
      /** P1-4：token 版本号，由 authMiddleware 校验后挂载，供下游业务使用 */
      tokenVersion?: number
    }
    /** 游客 ID（optionalAuth 中间件挂载） */
    guestId?: string
    /** 是否为游客 */
    isGuest?: boolean
  }
}

// 确保此文件作为模块处理
export {}
