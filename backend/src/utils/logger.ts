/**
 * 结构化日志（pino）
 *
 * 补充-1：后端日志改为 JSON 结构化，便于排错与统计。
 * - 生产环境（NODE_ENV=production）输出纯 JSON
 * - 开发环境使用 pino-pretty 美化输出
 * - 日志级别由 LOG_LEVEL 环境变量控制，默认 info
 */
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty' }
      : undefined,
})
