import request from './request'
import type { CreateShareResult, ShareContentResult, ExpireDays } from '@/types/share'

/**
 * 分享相关 API
 */
export const shareApi = {
  /**
   * 创建分享链接（需登录）
   * POST /api/shares
   */
  createShare(scanId: string, expireDays: ExpireDays): Promise<CreateShareResult> {
    return request.post('/shares', { scanId, expireDays })
  },

  /**
   * 获取分享内容（无需登录）
   * GET /api/shares/:id
   */
  getShare(id: string): Promise<ShareContentResult> {
    return request.get(`/shares/${id}`)
  },
}
