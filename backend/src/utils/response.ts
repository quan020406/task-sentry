/**
 * 统一响应格式封装
 * 对应 S00 接口设计的 ApiResponse 结构
 */
export interface ApiResponse<T = unknown> {
  /** 业务状态码，0 表示成功 */
  code: number
  /** 提示信息 */
  message: string
  /** 业务数据 */
  data: T
}

/** 成功响应 */
export function success<T>(data: T, message = '操作成功'): ApiResponse<T> {
  return { code: 0, message, data }
}

/** 失败响应 */
export function fail(code: number, message: string): ApiResponse<null> {
  return { code, message, data: null }
}

/**
 * 业务异常类
 * 用于在 service 层抛出业务错误，由全局错误中间件捕获
 */
export class BusinessError extends Error {
  code: number

  constructor(code: number, message: string) {
    super(message)
    this.name = 'BusinessError'
    this.code = code
  }
}
