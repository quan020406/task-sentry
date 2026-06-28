import { Router, type Request, type Response, type NextFunction } from 'express'
import { scanController } from '@/controllers/scan.controller'
import { optionalAuthMiddleware, authMiddleware } from '@/middleware/auth'
import { userService } from '@/services/user.service'

const router = Router()

/**
 * 发起扫描
 * POST /api/scans
 * 需 optionalAuth 中间件（游客和登录用户均可）
 * 中间件链：optionalAuth → 次数扣减 → 创建扫描
 *
 * P2-10：游客次数用尽抛 BusinessError(10303)，由 errorHandler 映射为 HTTP 429。
 */
router.post(
  '/',
  optionalAuthMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId ?? null
      const guestId = req.guestId ?? null

      // 游客次数扣减
      if (userId === null && guestId) {
        const remaining = userService.incrementGuestScanCount(guestId)
        // 把剩余次数挂到响应对象，控制器返回时带上
        res.locals.guestRemaining = remaining
      }

      next()
    } catch (e) {
      next(e)
    }
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await scanController.startScan(req, res)

      // 登录用户扫描次数 +1（扫描完成后累加，不影响响应）
      const userId = req.user?.userId ?? null
      if (userId !== null) {
        try {
          userService.incrementScanCount(userId)
        } catch {
          // 次数累加失败不影响扫描结果
        }
      }
    } catch (e) {
      next(e)
    }
  },
)

/**
 * 获取历史记录
 * GET /api/scans/history
 * 注意：必须在 /:id 之前定义，否则 history 会被当作 id
 */
router.get('/history', optionalAuthMiddleware, (req: Request, res: Response, next: NextFunction) => {
  try {
    scanController.getHistory(req, res)
  } catch (e) {
    next(e)
  }
})

/**
 * 收藏列表（需登录）
 * GET /api/scans/favorites
 */
router.get('/favorites', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  try {
    scanController.getFavorites(req, res)
  } catch (e) {
    next(e)
  }
})

/**
 * 获取扫描结果
 * GET /api/scans/:id
 */
router.get('/:id', optionalAuthMiddleware, (req: Request, res: Response, next: NextFunction) => {
  try {
    scanController.getScan(req, res)
  } catch (e) {
    next(e)
  }
})

/**
 * 删除扫描记录（需登录）
 * DELETE /api/scans/:id
 */
router.delete('/:id', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  try {
    scanController.deleteScan(req, res)
  } catch (e) {
    next(e)
  }
})

/**
 * 收藏/取消收藏（需登录）
 * PATCH /api/scans/:id/favorite
 */
router.patch('/:id/favorite', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  try {
    scanController.toggleFavorite(req, res)
  } catch (e) {
    next(e)
  }
})

export default router
