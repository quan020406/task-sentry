import { type Request, type Response } from 'express'
import { userService } from '@/services/user.service'
import { success, BusinessError } from '@/utils/response'

/**
 * 认证控制器
 *
 * P2-10：错误统一抛 BusinessError，由 errorHandler 映射 HTTP status。
 */
export const authController = {
  /**
   * 用户注册
   * POST /api/auth/register
   * body: { username, email, password }
   */
  async register(req: Request, res: Response): Promise<void> {
    const { username, email, password } = req.body

    // 参数校验
    if (!username || !email || !password) {
      throw new BusinessError(10001, '请填写用户名、邮箱和密码')
    }
    if (typeof username !== 'string' || username.length < 3 || username.length > 20) {
      throw new BusinessError(10002, '用户名长度需为 3-20 字符')
    }
    if (!/^[A-Za-z0-9_]+$/.test(username)) {
      throw new BusinessError(10002, '用户名只能包含字母、数字和下划线')
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BusinessError(10002, '邮箱格式不正确')
    }
    if (password.length < 6 || password.length > 32) {
      throw new BusinessError(10002, '密码长度需为 6-32 字符')
    }

    const result = await userService.register(username, email, password)
    res.json(success(result, '注册成功'))
  },

  /**
   * 用户登录
   * POST /api/auth/login
   * body: { account, password }
   */
  async login(req: Request, res: Response): Promise<void> {
    const { account, password } = req.body

    if (!account || !password) {
      throw new BusinessError(10001, '请输入账号和密码')
    }

    const result = await userService.login(account, password)
    res.json(success(result, '登录成功'))
  },

  /**
   * 获取/创建游客身份
   * POST /api/auth/guest
   * body: { guestId? } —— 可选，传入已有游客 ID 则复用
   */
  guest(req: Request, res: Response): void {
    const guestId = req.body?.guestId as string | undefined
    const result = userService.getOrCreateGuestSession(guestId)
    res.json(success(result, '游客身份获取成功'))
  },

  /**
   * 获取当前登录用户信息
   * GET /api/auth/me
   * 需 auth 中间件
   */
  me(req: Request, res: Response): void {
    if (!req.user?.userId) {
      throw new BusinessError(10201, '未认证')
    }
    const user = userService.getProfile(req.user.userId)
    res.json(success(user))
  },
}
