import db from '@/database'
import { BusinessError } from '@/utils/response'
import crypto from 'node:crypto'
import type { IdentityType } from '@/types/identity'
import { scanTask as aiScanTask, type AIScanResult } from '@/services/ai'

/** 扫描记录数据库行 */
interface ScanRecordRow {
  id: string
  user_id: number | null
  guest_id: string | null
  identity: string
  task_text: string
  score: number | null
  risk_level: string | null
  result_json: string | null
  is_favorite: number
  created_at: string
}

/** 风险等级 */
export type RiskLevel = 'high' | 'mid' | 'low'

/** 风险项 */
export interface RiskItem {
  text: string
  level: 'high' | 'mid' | 'low'
  reason: string
  suggestion: string
}

/** 高亮词 */
export interface HighlightWord {
  word: string
  type: string
  explanation: string
}

/** 风险分组 */
export interface RiskGroup {
  name: string
  items: RiskItem[]
}

/** 追问问题 */
export interface Question {
  q: string
  why: string
}

/** 最小可行交付建议 */
export interface MvpPlan {
  do: string[]
  dontDo: string[]
  later: string[]
}

/** 工作路线步骤 */
export interface RoadmapStep {
  step: number
  title: string
  desc: string
  duration: string
}

/** 完整扫描结果 */
export interface ScanResult {
  id: string
  score: number
  riskLevel: RiskLevel
  summary: string
  originalText: string
  highlightWords: HighlightWord[]
  riskGroups: RiskGroup[]
  questions: {
    mustAsk: Question[]
    laterAsk: Question[]
  }
  mvp: MvpPlan
  roadmap: RoadmapStep[]
  confirmScript: string
  createdAt: string
  /** 收藏状态（S10：getScanById 返回时附加，供结果页同步收藏按钮） */
  isFavorite?: boolean
  /** 扫描身份（S10：getScanById 返回时附加，供结果页 URL 直接访问时回退） */
  identity?: IdentityType
}

/** 对外暴露的扫描记录（不含完整结果 JSON） */
export interface ScanRecordBrief {
  id: string
  identity: IdentityType
  taskText: string
  score: number | null
  riskLevel: RiskLevel | null
  isFavorite: boolean
  createdAt: string
}

/** 生成 8 位短 ID（便于分享） */
function generateScanId(): string {
  return 'sc_' + crypto.randomBytes(4).toString('hex')
}

/** 数据库行 → 简要记录 */
function toBrief(row: ScanRecordRow): ScanRecordBrief {
  return {
    id: row.id,
    identity: row.identity as IdentityType,
    taskText: row.task_text,
    score: row.score,
    riskLevel: (row.risk_level as RiskLevel) || null,
    isFavorite: row.is_favorite === 1,
    createdAt: row.created_at,
  }
}

/**
 * 将 AI 返回的结构化结果转换为前端使用的 ScanResult 格式
 *
 * 字段映射：
 * - highlightWords: 保留完整富数据（word/type/explanation）
 * - riskGroups[].items: 保留独立的 reason（consequence）和 suggestion 字段
 * - questions.mustAsk/laterAsk: string[] → [{q, why}]（why 默认空）
 * - roadmap: [{step, title, description}] → [{step, title, desc, duration}]
 */
function mapAIResultToScanResult(ai: AIScanResult): Omit<ScanResult, 'id' | 'originalText' | 'createdAt'> {
  return {
    score: ai.score,
    riskLevel: ai.riskLevel,
    summary: ai.summary,
    // 保留完整富数据：word / type / explanation
    highlightWords: ai.highlightWords.map((h) => ({
      word: h.word,
      type: h.type,
      explanation: h.explanation,
    })),
    riskGroups: ai.riskGroups.map((g) => ({
      name: g.name,
      items: g.items.map((item) => ({
        text: item.quote,
        level: item.level,
        reason: item.consequence || '',
        suggestion: item.suggestion || '',
      })),
    })),
    questions: {
      mustAsk: ai.questions.mustAsk.map((q) => ({ q, why: '' })),
      laterAsk: ai.questions.laterAsk.map((q) => ({ q, why: '' })),
    },
    mvp: ai.mvp,
    roadmap: ai.roadmap.map((r) => ({
      step: r.step,
      title: r.title,
      desc: r.description,
      duration: '',
    })),
    confirmScript: ai.confirmScript,
  }
}

export const scanService = {
  /**
   * 创建扫描记录并调用 AI 服务生成结果
   *
   * 流程：
   * 1. 生成扫描 ID
   * 2. 调用 AI 服务（含重试、超时、降级）
   * 3. 将 AI 结果映射为前端格式
   * 4. 入库保存
   *
   * 当 AI_PROVIDER=mock 或 API 调用失败时，AI 服务会自动降级到 mock provider
   * 因此该方法不会因为 AI 问题而失败
   *
   * @throws 10501 AI 服务调用失败（mock 也失败时）
   */
  async createScan(
    userId: number | null,
    guestId: string | null,
    identity: IdentityType,
    taskText: string,
  ): Promise<ScanResult> {
    const id = generateScanId()
    const createdAt = new Date().toISOString()

    // 调用 AI 服务（内部已处理重试、超时、降级）
    let aiResult: AIScanResult
    try {
      const { result } = await aiScanTask(taskText, identity)
      aiResult = result
    } catch (e) {
      // 极端情况：AI 服务和 mock 都失败，抛业务错误
      console.error('[ScanService] AI 调用失败（含 mock 兜底）:', e)
      throw new BusinessError(10501, '扫描服务暂时不可用，请稍后重试')
    }

    // 映射为前端格式
    const mapped = mapAIResultToScanResult(aiResult)

    const fullResult: ScanResult = {
      ...mapped,
      id,
      originalText: taskText,
      createdAt,
    }

    // 入库
    db.prepare(
      `INSERT INTO scan_records (id, user_id, guest_id, identity, task_text, score, risk_level, result_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      userId,
      guestId,
      identity,
      taskText,
      fullResult.score,
      fullResult.riskLevel,
      JSON.stringify(fullResult),
    )

    return fullResult
  },

  /**
   * 根据 ID 获取完整扫描结果
   * @throws 10401 扫描记录不存在
   */
  getScanById(id: string): ScanResult {
    const row = db.prepare('SELECT * FROM scan_records WHERE id = ?').get(id) as
      | ScanRecordRow
      | undefined

    if (!row) {
      throw new BusinessError(10401, '扫描记录不存在')
    }

    if (!row.result_json) {
      throw new BusinessError(10402, '扫描结果尚未生成')
    }

    const result = JSON.parse(row.result_json) as ScanResult

    // === 旧数据兼容：highlightWords 从 string[] 升级为 HighlightWord[] ===
    // S06 v1.0 之前的旧数据：highlightWords: string[]
    // S06 v1.1 之后的新数据：highlightWords: HighlightWord[]
    if (
      result.highlightWords &&
      result.highlightWords.length > 0 &&
      typeof result.highlightWords[0] === 'string'
    ) {
      result.highlightWords = (result.highlightWords as unknown as string[]).map((w) => ({
        word: w,
        type: '',
        explanation: '',
      }))
    }

    // S10：附加收藏状态，供结果页同步收藏按钮
    result.isFavorite = row.is_favorite === 1

    // S10 修复：附加扫描身份，供结果页 URL 直接访问时回退显示身份标签
    result.identity = row.identity as IdentityType

    return result
  },

  /**
   * 校验访问权限：用户只能看自己的，游客只能看自己的
   * @throws 10403 无权访问
   */
  checkAccess(id: string, userId: number | null, guestId: string | null): void {
    const row = db.prepare('SELECT user_id, guest_id FROM scan_records WHERE id = ?').get(id) as
      | { user_id: number | null; guest_id: string | null }
      | undefined

    if (!row) {
      throw new BusinessError(10401, '扫描记录不存在')
    }

    // 登录用户：必须 user_id 匹配
    if (userId !== null) {
      if (row.user_id !== userId) {
        throw new BusinessError(10403, '无权访问该扫描记录')
      }
      return
    }

    // 游客：必须 guest_id 匹配
    if (guestId !== null) {
      if (row.guest_id !== guestId) {
        throw new BusinessError(10403, '无权访问该扫描记录')
      }
    }
  },

  /**
   * 获取用户/游客的历史记录列表
   * 支持关键词搜索、风险等级筛选、收藏筛选、排序
   */
  getHistory(
    userId: number | null,
    guestId: string | null,
    options: {
      pageNum?: number
      pageSize?: number
      keyword?: string
      riskLevel?: RiskLevel | ''
      isFavorite?: boolean | ''
      order?: 'latest' | 'earliest'
    } = {},
  ): {
    list: ScanRecordBrief[]
    total: number
    pageNum: number
    pageSize: number
  } {
    const pageNum = Math.max(1, options.pageNum || 1)
    const pageSize = Math.min(50, Math.max(1, options.pageSize || 10))
    const offset = (pageNum - 1) * pageSize
    const order = options.order === 'earliest' ? 'ASC' : 'DESC'

    // 构建 WHERE 条件
    const conditions: string[] = []
    const params: unknown[] = []

    if (userId !== null) {
      conditions.push('user_id = ?')
      params.push(userId)
    } else {
      conditions.push('guest_id = ?')
      params.push(guestId)
    }

    if (options.keyword && options.keyword.trim()) {
      conditions.push('task_text LIKE ?')
      params.push(`%${options.keyword.trim()}%`)
    }

    if (options.riskLevel) {
      conditions.push('risk_level = ?')
      params.push(options.riskLevel)
    }

    if (options.isFavorite === true) {
      conditions.push('is_favorite = 1')
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const rows = db
      .prepare(
        `SELECT * FROM scan_records ${whereClause} ORDER BY created_at ${order} LIMIT ? OFFSET ?`,
      )
      .all(...params, pageSize, offset) as ScanRecordRow[]

    const total = (
      db.prepare(`SELECT COUNT(*) as count FROM scan_records ${whereClause}`).get(...params) as {
        count: number
      }
    ).count

    return {
      list: rows.map(toBrief),
      total,
      pageNum,
      pageSize,
    }
  },

  /**
   * 获取收藏列表（仅登录用户）
   */
  getFavorites(
    userId: number,
    options: { pageNum?: number; pageSize?: number } = {},
  ): {
    list: ScanRecordBrief[]
    total: number
    pageNum: number
    pageSize: number
  } {
    const pageNum = Math.max(1, options.pageNum || 1)
    const pageSize = Math.min(50, Math.max(1, options.pageSize || 10))
    const offset = (pageNum - 1) * pageSize

    const rows = db
      .prepare(
        `SELECT * FROM scan_records WHERE user_id = ? AND is_favorite = 1 ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      )
      .all(userId, pageSize, offset) as ScanRecordRow[]

    const total = (
      db
        .prepare('SELECT COUNT(*) as count FROM scan_records WHERE user_id = ? AND is_favorite = 1')
        .get(userId) as { count: number }
    ).count

    return { list: rows.map(toBrief), total, pageNum, pageSize }
  },

  /**
   * 切换收藏状态（仅登录用户）
   * @throws 10401 记录不存在
   * @throws 10403 无权操作
   * @returns 新的收藏状态
   */
  toggleFavorite(id: string, userId: number): boolean {
    const row = db.prepare('SELECT user_id FROM scan_records WHERE id = ?').get(id) as
      | { user_id: number | null }
      | undefined

    if (!row) {
      throw new BusinessError(10401, '扫描记录不存在')
    }
    if (row.user_id !== userId) {
      throw new BusinessError(10403, '无权操作该扫描记录')
    }

    const current = db.prepare('SELECT is_favorite FROM scan_records WHERE id = ?').get(id) as {
      is_favorite: number
    }
    const newValue = current.is_favorite === 1 ? 0 : 1
    db.prepare('UPDATE scan_records SET is_favorite = ? WHERE id = ?').run(newValue, id)
    return newValue === 1
  },

  /**
   * 删除扫描记录（仅登录用户）
   * @throws 10401 记录不存在
   * @throws 10403 无权删除
   */
  deleteScan(id: string, userId: number): void {
    const row = db.prepare('SELECT user_id FROM scan_records WHERE id = ?').get(id) as
      | { user_id: number | null }
      | undefined

    if (!row) {
      throw new BusinessError(10401, '扫描记录不存在')
    }
    if (row.user_id !== userId) {
      throw new BusinessError(10403, '无权删除该扫描记录')
    }

    db.prepare('DELETE FROM scan_records WHERE id = ?').run(id)
  },

  /**
   * 获取用户统计数据（从 scan_records 聚合）
   */
  getUserScanStats(userId: number): {
    totalScans: number
    favoriteCount: number
    avgScore: number
    highRiskCount: number
    midRiskCount: number
    lowRiskCount: number
    monthScans: number
  } {
    const baseWhere = 'WHERE user_id = ?'
    const row = db
      .prepare(
        `SELECT
          COUNT(*) as total_scans,
          SUM(CASE WHEN is_favorite = 1 THEN 1 ELSE 0 END) as favorite_count,
          AVG(score) as avg_score,
          SUM(CASE WHEN risk_level = 'high' THEN 1 ELSE 0 END) as high_count,
          SUM(CASE WHEN risk_level = 'mid' THEN 1 ELSE 0 END) as mid_count,
          SUM(CASE WHEN risk_level = 'low' THEN 1 ELSE 0 END) as low_count
        FROM scan_records ${baseWhere}`,
      )
      .get(userId) as {
      total_scans: number
      favorite_count: number
      avg_score: number | null
      high_count: number
      mid_count: number
      low_count: number
    }

    // 本月扫描数
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const monthRow = db
      .prepare(
        `SELECT COUNT(*) as count FROM scan_records WHERE user_id = ? AND created_at >= ?`,
      )
      .get(userId, monthStart) as { count: number }

    return {
      totalScans: row.total_scans || 0,
      favoriteCount: row.favorite_count || 0,
      avgScore: row.avg_score !== null ? Math.round(row.avg_score) : 0,
      highRiskCount: row.high_count || 0,
      midRiskCount: row.mid_count || 0,
      lowRiskCount: row.low_count || 0,
      monthScans: monthRow.count || 0,
    }
  },
}
