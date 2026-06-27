import type { IdentityType } from './user'

/** 风险等级 */
export type RiskLevel = 'high' | 'mid' | 'low'

/** 高亮词 */
export interface HighlightWord {
  word: string
  type: string
  explanation: string
}

/** 风险项 */
export interface RiskItem {
  text: string
  level: 'high' | 'mid' | 'low'
  reason: string
  suggestion: string
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

/** 历史记录筛选参数 */
export interface HistoryFilter {
  pageNum: number
  pageSize: number
  keyword: string
  riskLevel: RiskLevel | ''
  isFavorite: boolean
  order: 'latest' | 'earliest'
}

/** 扫描历史记录简要 */
export interface ScanRecordBrief {
  id: string
  identity: IdentityType
  taskText: string
  score: number | null
  riskLevel: RiskLevel | null
  isFavorite: boolean
  createdAt: string
}

/** 历史列表返回 */
export interface ScanHistoryResult {
  list: ScanRecordBrief[]
  total: number
  pageNum: number
  pageSize: number
}
