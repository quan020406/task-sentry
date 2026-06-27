// 统一 API 响应格式
export interface ApiResponse<T = unknown> {
  /** 业务状态码，0 表示成功，非 0 表示失败 */
  code: number
  /** 提示信息 */
  message: string
  /** 业务数据 */
  data: T
}

// 分页响应
export interface PageResult<T> {
  list: T[]
  total: number
  pageNum: number
  pageSize: number
}

// 分页请求参数
export interface PageParams {
  pageNum?: number
  pageSize?: number
}
