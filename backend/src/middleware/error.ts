import { type Request, type Response, type NextFunction } from 'express'
import { fail, BusinessError } from '@/utils/response'

/**
 * 全局错误处理中间件
 * 捕获所有未处理的异常，统一返回 fail 格式
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // 业务错误
  if (err instanceof BusinessError) {
    res.json(fail(err.code, err.message))
    return
  }

  // 未知错误
  console.error('[Unhandled Error]', err)
  res.status(500).json(fail(10500, '服务器内部错误'))
}
