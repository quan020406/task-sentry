import { Router } from 'express'
import { userController } from '@/controllers/user.controller'
import { authMiddleware } from '@/middleware/auth'

const router = Router()

/**
 * 用户相关路由（全部需登录）
 */
// 所有路由都经过 authMiddleware
router.use(authMiddleware)

// 个人信息
router.get('/profile', userController.profile)
router.put('/profile', userController.updateProfile)

// 修改密码
router.put('/password', userController.changePassword)

// 使用统计
router.get('/stats', userController.stats)

export default router
