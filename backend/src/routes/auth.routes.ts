import { Router } from 'express'
import { authController } from '@/controllers/auth.controller'
import { authMiddleware } from '@/middleware/auth'
import { asyncHandler } from '@/utils/asyncHandler'

const router = Router()

/**
 * 认证相关路由
 */
// 注册
router.post('/register', asyncHandler(authController.register))

// 登录
router.post('/login', asyncHandler(authController.login))

// 游客身份
router.post('/guest', asyncHandler(authController.guest))

// 当前用户信息（需登录）
router.get('/me', authMiddleware, asyncHandler(authController.me))

export default router
