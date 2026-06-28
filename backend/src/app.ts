import express from 'express'
import cors from 'cors'
import { config } from '@/config'
import { errorHandler } from '@/middleware/error'
import indexRoutes from '@/routes/index.routes'
import authRoutes from '@/routes/auth.routes'
import userRoutes from '@/routes/user.routes'
import scanRoutes from '@/routes/scan.routes'
import shareRoutes from '@/routes/share.routes'
import db from '@/database'

const app = express()

// ===== 中间件 =====
app.use(
  cors({
    origin: config.clientOrigin,
    credentials: true,
  }),
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ===== 路由挂载 =====
app.use('/api', indexRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/scans', scanRoutes)
app.use('/api/shares', shareRoutes)

// ===== 全局错误处理 =====
app.use(errorHandler)

// ===== 启动服务 =====
app.listen(config.port, () => {
  console.log('========================================')
  console.log('  《先别开工》后端服务已启动')
  console.log('========================================')
  console.log(`  端口: ${config.port}`)
  console.log(`  前端地址: ${config.clientOrigin}`)
  console.log(`  数据库: ${config.dbPath}`)
  console.log(`  健康检查: http://localhost:${config.port}/api/health`)
  console.log('========================================')

  // 验证数据库连接
  try {
    const row = db.prepare('SELECT 1 as test').get() as { test: number }
    console.log(`  数据库连接: ${row.test === 1 ? '正常' : '异常'}`)
  } catch (e) {
    console.error('  数据库连接失败:', e)
  }
  console.log('========================================')
})

export default app
