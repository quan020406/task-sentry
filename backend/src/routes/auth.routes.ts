import { Router } from 'express'
import { authController } from '@/controllers/auth.controller'
import { authMiddleware } from '@/middleware/auth'

const router = Router()

/**
 * 认证相关路由
 */
// 注册
router.post('/register', authController.register)

// 登录
router.post('/login', authController.login)

// 游客身份
router.post('/guest', authController.guest)

// 当前用户信息（需登录）
router.get('/me', authMiddleware, authController.me)

export default router
