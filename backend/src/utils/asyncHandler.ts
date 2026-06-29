import {
  type Request,
  type Response,
  type NextFunction,
  type RequestHandler,
} from 'express'

/**
 * async controller 包装器
 *
 * Express 4 默认不捕获 async controller 抛出的 Promise rejection，
 * 会导致 Node 进程崩溃。本函数把 async controller 的 rejection 转交给 next(e)，
 * 由全局 errorHandler 统一按 code 映射 HTTP status。
 *
 * 对 sync controller 同样兼容（async 函数天然兼容 sync 返回值）。
 * 不吞错误、不兜底返回 200，只负责把错误交给 next。
 *
 * 入参返回类型允许 void | Promise<unknown>，兼容 async 标注但被 TS 推断为 void 的 controller。
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => void | Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
