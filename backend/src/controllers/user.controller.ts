import { type Request, type Response } from 'express'
import { userService } from '@/services/user.service'
import { success, BusinessError } from '@/utils/response'

/**
 * 用户控制器
 * 需登录的接口（auth 中间件已挂载 req.user）
 *
 * P2-10：错误统一抛 BusinessError，由 errorHandler 映射 HTTP status。
 */
export const userController = {
  /**
   * 获取个人中心数据
   * GET /api/user/profile
   */
  profile(req: Request, res: Response): void {
    if (!req.user?.userId) {
      throw new BusinessError(10201, '未认证')
    }
    const user = userService.getProfile(req.user.userId)
    res.json(success(user))
  },

  /**
   * 更新个人信息
   * PUT /api/user/profile
   * body: { username?, avatar? }
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    if (!req.user?.userId) {
      throw new BusinessError(10201, '未认证')
    }

    const { username, avatar } = req.body

    // 用户名校验
    if (username !== undefined) {
      if (typeof username !== 'string' || username.length < 3 || username.length > 20) {
        throw new BusinessError(10002, '用户名长度需为 3-20 字符')
      }
      if (!/^[A-Za-z0-9_]+$/.test(username)) {
        throw new BusinessError(10002, '用户名只能包含字母、数字和下划线')
      }
    }

    const user = userService.updateProfile(req.user.userId, { username, avatar })
    res.json(success(user, '更新成功'))
  },

  /**
   * 修改密码
   * PUT /api/user/password
   * body: { oldPassword, newPassword }
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    if (!req.user?.userId) {
      throw new BusinessError(10201, '未认证')
    }

    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) {
      throw new BusinessError(10001, '请输入旧密码和新密码')
    }
    if (newPassword.length < 6 || newPassword.length > 32) {
      throw new BusinessError(10002, '新密码长度需为 6-32 字符')
    }

    await userService.changePassword(req.user.userId, oldPassword, newPassword)
    res.json(success(null, '密码修改成功'))
  },

  /**
   * 获取使用统计
   * GET /api/user/stats
   */
  stats(req: Request, res: Response): void {
    if (!req.user?.userId) {
      throw new BusinessError(10201, '未认证')
    }
    const stats = userService.getStats(req.user.userId)
    res.json(success(stats))
  },
}
