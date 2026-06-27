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
    }
    /** 游客 ID（optionalAuth 中间件挂载） */
    guestId?: string
    /** 是否为游客 */
    isGuest?: boolean
  }
}

// 确保此文件作为模块处理
export {}
