import { type Request, type Response } from 'express'
import { scanService } from '@/services/scan.service'
import { isValidIdentity } from '@/types/identity'
import { success, fail, BusinessError } from '@/utils/response'

/**
 * 扫描控制器
 */
export const scanController = {
  /**
   * 发起扫描
   * POST /api/scans
   * body: { taskText, identity }
   * 需 optionalAuth 中间件（游客和登录用户均可）
   *
   * S06 后为 async：调用 AI 服务生成结果
   */
  async startScan(req: Request, res: Response): Promise<void> {
    const { taskText, identity } = req.body || {}

    // 参数校验
    if (!taskText || typeof taskText !== 'string') {
      res.json(fail(10001, '请输入任务说明'))
      return
    }
    if (taskText.trim().length < 5) {
      res.json(fail(10002, '任务说明过短，请至少输入 5 个字符'))
      return
    }
    if (taskText.length > 2000) {
      res.json(fail(10002, '任务说明不能超过 2000 字符'))
      return
    }
    if (!identity || !isValidIdentity(identity)) {
      res.json(fail(10002, '请选择有效身份'))
      return
    }

    // 获取用户/游客身份
    const userId = req.user?.userId ?? null
    const guestId = req.guestId ?? null

    // 必须有其中一个身份
    if (userId === null && !guestId) {
      res.json(fail(10201, '未获取到身份信息，请刷新页面重试'))
      return
    }

    try {
      // 调用 scanService.createScan（async，内部调用 AI 服务）
      const result = await scanService.createScan(userId, guestId, identity, taskText.trim())
      res.json(success(result, '扫描完成'))
    } catch (e) {
      if (e instanceof BusinessError) {
        res.json(fail(e.code, e.message))
        return
      }
      throw e
    }
  },

  /**
   * 获取扫描结果
   * GET /api/scans/:id
   * 需 optionalAuth 中间件
   */
  getScan(req: Request, res: Response): void {
    const { id } = req.params
    const userId = req.user?.userId ?? null
    const guestId = req.guestId ?? null

    try {
      // 权限校验
      scanService.checkAccess(id, userId, guestId)
      // 获取结果
      const result = scanService.getScanById(id)
      res.json(success(result))
    } catch (e) {
      if (e instanceof BusinessError) {
        res.json(fail(e.code, e.message))
        return
      }
      throw e
    }
  },

  /**
   * 获取历史记录
   * GET /api/scans/history?pageNum=1&pageSize=10&keyword=&riskLevel=&isFavorite=&order=
   * 需 optionalAuth 中间件
   */
  getHistory(req: Request, res: Response): void {
    const userId = req.user?.userId ?? null
    const guestId = req.guestId ?? null

    if (userId === null && !guestId) {
      res.json(success({ list: [], total: 0, pageNum: 1, pageSize: 10 }, '暂无身份信息'))
      return
    }

    const riskLevelRaw = (req.query.riskLevel as string) || ''
    const validRiskLevels = ['high', 'mid', 'low']
    const riskLevel = validRiskLevels.includes(riskLevelRaw)
      ? (riskLevelRaw as 'high' | 'mid' | 'low')
      : ''

    const result = scanService.getHistory(userId, guestId, {
      pageNum: parseInt(req.query.pageNum as string, 10) || 1,
      pageSize: parseInt(req.query.pageSize as string, 10) || 10,
      keyword: (req.query.keyword as string) || '',
      riskLevel,
      isFavorite: req.query.isFavorite === 'true' ? true : '',
      order: (req.query.order as 'latest' | 'earliest') || 'latest',
    })
    res.json(success(result))
  },

  /**
   * 获取收藏列表
   * GET /api/scans/favorites?pageNum=1&pageSize=10
   * 需登录（authMiddleware）
   */
  getFavorites(req: Request, res: Response): void {
    const userId = req.user?.userId
    if (!userId) {
      res.json(fail(10201, '未认证'))
      return
    }

    const result = scanService.getFavorites(userId, {
      pageNum: parseInt(req.query.pageNum as string, 10) || 1,
      pageSize: parseInt(req.query.pageSize as string, 10) || 10,
    })
    res.json(success(result))
  },

  /**
   * 切换收藏状态
   * PATCH /api/scans/:id/favorite
   * 需登录（authMiddleware）
   */
  toggleFavorite(req: Request, res: Response): void {
    const userId = req.user?.userId
    if (!userId) {
      res.json(fail(10201, '未认证'))
      return
    }

    try {
      const isFavorite = scanService.toggleFavorite(req.params.id, userId)
      res.json(success({ isFavorite }, isFavorite ? '已收藏' : '已取消收藏'))
    } catch (e) {
      if (e instanceof BusinessError) {
        res.json(fail(e.code, e.message))
        return
      }
      throw e
    }
  },

  /**
   * 删除扫描记录
   * DELETE /api/scans/:id
   * 需登录（authMiddleware）
   */
  deleteScan(req: Request, res: Response): void {
    const userId = req.user?.userId
    if (!userId) {
      res.json(fail(10201, '未认证'))
      return
    }

    try {
      scanService.deleteScan(req.params.id, userId)
      res.json(success(null, '已删除'))
    } catch (e) {
      if (e instanceof BusinessError) {
        res.json(fail(e.code, e.message))
        return
      }
      throw e
    }
  },
}
