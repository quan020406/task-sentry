import { type Request, type Response, type NextFunction } from 'express'
import { fail, BusinessError } from '@/utils/response'

/**
 * 全局错误处理中间件
 * 捕获所有未处理的异常，统一返回 fail 格式
 */
export function errorHandler(
  err: Error & { type?: string; status?: number },
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // 业务错误
  if (err instanceof BusinessError) {
    res.json(fail(err.code, err.message))
    return
  }

  // P0-4 修复：body-parser 解析错误（非法 JSON）返回 400，而非落入 500
  if (err.type === 'entity.parse.failed' || err.status === 400) {
    res.status(400).json(fail(10400, '请求体格式错误'))
    return
  }

  // 未知错误
  console.error('[Unhandled Error]', err)
  res.status(500).json(fail(10500, '服务器内部错误'))
}
