import type { ScanResult } from './scan'

/** 有效期天数（0 表示永久） */
export type ExpireDays = 7 | 30 | 0

/** 创建分享返回结果 */
export interface CreateShareResult {
  id: string
  url: string
  expireAt: string | null
  expireDays: ExpireDays
}

/** 分享内容返回结果（只读） */
export interface ShareContentResult {
  id: string
  scanId: string
  expireAt: string | null
  isExpired: boolean
  viewCount: number
  createdAt: string
  /** 扫描结果（不含用户敏感信息） */
  result: ScanResult
}
