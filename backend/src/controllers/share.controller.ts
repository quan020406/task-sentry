import { type Request, type Response } from 'express'
import { shareService, type ExpireDays } from '@/services/share.service'
import { success, BusinessError } from '@/utils/response'

/**
 * 分享控制器
 *
 * P2-10：错误统一抛 BusinessError，由 errorHandler 映射 HTTP status。
 */
export const shareController = {
  /**
   * 创建分享
   * POST /api/shares
   * 需登录（authMiddleware）
   * body: { scanId, expireDays }
   * expireDays: 7 | 30 | 0（0 表示永久）
   */
  createShare(req: Request, res: Response): void {
    const userId = req.user?.userId
    if (!userId) {
      throw new BusinessError(10201, '未认证')
    }

    const { scanId, expireDays } = req.body || {}

    if (!scanId || typeof scanId !== 'string') {
      throw new BusinessError(10001, '请提供 scanId')
    }

    const validExpireDays: ExpireDays[] = [7, 30, 0]
    if (
      typeof expireDays !== 'number' ||
      !validExpireDays.includes(expireDays as ExpireDays)
    ) {
      throw new BusinessError(10002, 'expireDays 仅支持 7 / 30 / 0')
    }

    const result = shareService.createShare(userId, scanId, expireDays as ExpireDays)
    res.json(success(result, '分享链接已生成'))
  },

  /**
   * 获取分享内容（无需登录）
   * GET /api/shares/:id
   * 返回扫描结果数据（只读）
   * 过期返回 10602 业务码
   */
  getShare(req: Request, res: Response): void {
    const { id } = req.params

    if (!id) {
      throw new BusinessError(10001, '请提供分享 ID')
    }

    const content = shareService.getShare(id)
    res.json(success(content))
  },
}
