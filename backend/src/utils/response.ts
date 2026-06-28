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

/**
 * P2-10：业务 code → HTTP status 映射表
 *
 * 规则：不改变现有业务 code 数值，只增加 HTTP 状态码映射。
 * 未列出的 code 默认返回 200（向后兼容）。
 *
 * 映射依据：
 * - 1xxxx 按语义分流：参数错误 400 / 认证 401 / 权限 403 / 资源不存在 404 / 冲突 409 / 次数限制 429
 * - 10500 服务器错误 500 / 10501 服务不可用 503
 */
export const HTTP_STATUS_MAP: Record<number, number> = {
  // 参数错误（400）
  10001: 400,
  10002: 400,
  10400: 400,
  // 认证失败（401）：未登录 / 登录失效 / 凭证错误
  10103: 401,
  10201: 401,
  // 权限不足（403）：游客越权 / 无权操作
  10202: 403,
  10403: 403,
  // 资源不存在（404）
  10104: 404,
  10401: 404,
  10402: 404,
  10601: 404,
  10602: 404,
  // 冲突（409）：注册时用户名/邮箱已存在
  10101: 409,
  10102: 409,
  // 次数限制（429）
  10303: 429,
  // 服务端错误
  10500: 500,
  10501: 503,
}

/** 根据业务 code 获取 HTTP status，未映射返回 200 */
export function getHttpStatus(code: number): number {
  return HTTP_STATUS_MAP[code] ?? 200
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
