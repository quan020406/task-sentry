import { type Request, type Response } from 'express'
import { userService } from '@/services/user.service'
import { success, fail, BusinessError } from '@/utils/response'

/**
 * 用户控制器
 * 需登录的接口（auth 中间件已挂载 req.user）
 */
export const userController = {
  /**
   * 获取个人中心数据
   * GET /api/user/profile
   */
  profile(req: Request, res: Response): void {
    if (!req.user?.userId) {
      res.json(fail(10201, '未认证'))
      return
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
      res.json(fail(10201, '未认证'))
      return
    }

    const { username, avatar } = req.body

    // 用户名校验
    if (username !== undefined) {
      if (typeof username !== 'string' || username.length < 3 || username.length > 20) {
        res.json(fail(10002, '用户名长度需为 3-20 字符'))
        return
      }
      if (!/^[A-Za-z0-9_]+$/.test(username)) {
        res.json(fail(10002, '用户名只能包含字母、数字和下划线'))
        return
      }
    }

    try {
      const user = userService.updateProfile(req.user.userId, { username, avatar })
      res.json(success(user, '更新成功'))
    } catch (e) {
      if (e instanceof BusinessError) {
        res.json(fail(e.code, e.message))
        return
      }
      throw e
    }
  },

  /**
   * 修改密码
   * PUT /api/user/password
   * body: { oldPassword, newPassword }
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    if (!req.user?.userId) {
      res.json(fail(10201, '未认证'))
      return
    }

    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) {
      res.json(fail(10001, '请输入旧密码和新密码'))
      return
    }
    if (newPassword.length < 6 || newPassword.length > 32) {
      res.json(fail(10002, '新密码长度需为 6-32 字符'))
      return
    }

    try {
      await userService.changePassword(req.user.userId, oldPassword, newPassword)
      res.json(success(null, '密码修改成功'))
    } catch (e) {
      if (e instanceof BusinessError) {
        res.json(fail(e.code, e.message))
        return
      }
      throw e
    }
  },

  /**
   * 获取使用统计
   * GET /api/user/stats
   */
  stats(req: Request, res: Response): void {
    if (!req.user?.userId) {
      res.json(fail(10201, '未认证'))
      return
    }
    const stats = userService.getStats(req.user.userId)
    res.json(success(stats))
  },
}
