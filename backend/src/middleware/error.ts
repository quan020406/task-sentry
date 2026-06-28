import { type Request, type Response, type NextFunction } from 'express'
import { fail, BusinessError, getHttpStatus } from '@/utils/response'
import { logger } from '@/utils/logger'

/**
 * 全局错误处理中间件
 * 捕获所有未处理的异常，统一返回 fail 格式
 *
 * P2-10：业务错误按 code 映射 HTTP status（400/401/403/404/409/429/500/503），
 * 未映射的 code 默认 200（向后兼容）。
 */
export function errorHandler(
  err: Error & { type?: string; status?: number },
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // 业务错误：按 code 映射 HTTP status
  if (err instanceof BusinessError) {
    res.status(getHttpStatus(err.code)).json(fail(err.code, err.message))
    return
  }

  // P0-4 修复：body-parser 解析错误（非法 JSON）返回 400，而非落入 500
  if (err.type === 'entity.parse.failed' || err.status === 400) {
    res.status(400).json(fail(10400, '请求体格式错误'))
    return
  }

  // 未知错误
  logger.error({ module: 'error', event: 'unhandled', err: err.message, stack: err.stack }, '未处理异常')
  res.status(500).json(fail(10500, '服务器内部错误'))
}
