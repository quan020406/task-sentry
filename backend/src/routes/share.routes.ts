import { Router, type Request, type Response, type NextFunction } from 'express'
import { shareController } from '@/controllers/share.controller'
import { authMiddleware } from '@/middleware/auth'

const router = Router()

/**
 * 创建分享（需登录）
 * POST /api/shares
 * body: { scanId, expireDays }
 * expireDays: 7 | 30 | 0（0 表示永久）
 */
router.post('/', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  try {
    shareController.createShare(req, res)
  } catch (e) {
    next(e)
  }
})

/**
 * 获取分享内容（无需登录）
 * GET /api/shares/:id
 * 返回扫描结果数据（只读）
 */
router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    shareController.getShare(req, res)
  } catch (e) {
    next(e)
  }
})

export default router
