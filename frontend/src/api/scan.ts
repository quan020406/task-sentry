import request from './request'
import type { ScanResult, ScanHistoryResult, HistoryFilter } from '@/types/scan'
import type { IdentityType } from '@/types/user'

/** 发起扫描请求参数 */
export interface StartScanParams {
  taskText: string
  identity: IdentityType
}

/**
 * 扫描相关 API
 */
export const scanApi = {
  /** 发起扫描 */
  startScan(data: StartScanParams): Promise<ScanResult> {
    return request.post('/scans', data)
  },

  /** 获取扫描结果 */
  getScanResult(id: string): Promise<ScanResult> {
    return request.get(`/scans/${id}`)
  },

  /**
   * 获取历史记录（支持关键词搜索、风险等级筛选、收藏筛选、排序）
   * GET /api/scans/history
   */
  getHistory(filter: Partial<HistoryFilter> = {}): Promise<ScanHistoryResult> {
    const params = {
      pageNum: filter.pageNum ?? 1,
      pageSize: filter.pageSize ?? 10,
      keyword: filter.keyword ?? '',
      riskLevel: filter.riskLevel ?? '',
      isFavorite: filter.isFavorite ? 'true' : '',
      order: filter.order ?? 'latest',
    }
    return request.get('/scans/history', { params })
  },

  /**
   * 获取收藏列表（需登录）
   * GET /api/scans/favorites
   */
  getFavorites(pageNum = 1, pageSize = 10): Promise<ScanHistoryResult> {
    return request.get('/scans/favorites', { params: { pageNum, pageSize } })
  },

  /** 切换收藏状态 */
  toggleFavorite(id: string): Promise<{ isFavorite: boolean }> {
    return request.patch(`/scans/${id}/favorite`)
  },

  /** 删除扫描记录 */
  deleteScan(id: string): Promise<null> {
    return request.delete(`/scans/${id}`)
  },
}
