import { Router } from 'express'
import { userController } from '@/controllers/user.controller'
import { authMiddleware } from '@/middleware/auth'
import { asyncHandler } from '@/utils/asyncHandler'

const router = Router()

/**
 * 用户相关路由（全部需登录）
 */
// 所有路由都经过 authMiddleware
router.use(authMiddleware)

// 个人信息
router.get('/profile', asyncHandler(userController.profile))
router.put('/profile', asyncHandler(userController.updateProfile))

// 修改密码
router.put('/password', asyncHandler(userController.changePassword))

// 使用统计
router.get('/stats', asyncHandler(userController.stats))

export default router
