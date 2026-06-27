import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { IdentityType } from '@/types/user'
import type { ScanResult, HistoryFilter } from '@/types/scan'
import { userApi } from '@/api/user'

/**
 * 身份选项定义
 */
export interface IdentityOption {
  type: IdentityType
  label: string
  icon: string
  desc: string
}

/**
 * 示例任务定义
 */
export interface ExampleTask {
  id: string
  identity: IdentityType
  title: string
  text: string
}

/**
 * 所有身份选项
 */
export const IDENTITY_OPTIONS: IdentityOption[] = [
  { type: 'student', label: '学生', icon: 'S', desc: '写作业、做课程项目' },
  { type: 'intern', label: '实习生', icon: 'I', desc: '接导师分配的任务' },
  { type: 'developer', label: '开发者', icon: 'D', desc: '接产品需求开发' },
  { type: 'designer', label: '设计师', icon: 'D', desc: '接设计需求出稿' },
  { type: 'pm', label: '产品/运营', icon: 'P', desc: '接业务方需求落地' },
  { type: 'lead', label: '项目负责人', icon: 'L', desc: '统筹任务分配与跟进' },
]

/**
 * 示例任务列表
 */
export const EXAMPLE_TASKS: ExampleTask[] = [
  {
    id: 'ex-intern-page',
    identity: 'intern',
    title: '实习生 · 页面优化',
    text: '帮我把首页优化一下，做得更有质感一点，明天下午给我看个版本。',
  },
  {
    id: 'ex-dev-export',
    identity: 'developer',
    title: '开发需求 · 导出功能',
    text: '新增一个导出 Excel 功能，入口放在列表页，先简单做一下。',
  },
  {
    id: 'ex-student-essay',
    identity: 'student',
    title: '课程作业 · 论文',
    text: '结合实际案例分析人工智能对社会生活的影响，不少于3000字，要求观点明确、结构清晰。',
  },
  {
    id: 'ex-contest-rules',
    identity: 'student',
    title: '比赛提交规则',
    text: '提交一个 AI 创新作品 Demo，要求体现创新性、实用性、完成度和设计体验。',
  },
]

/**
 * 扫描状态 store
 * 管理身份选择、任务文本、当前示例
 */
export const useScanStore = defineStore('scan', () => {
  // ===== state =====
  const selectedIdentity = ref<IdentityType | null>(null)
  const taskText = ref('')
  const currentExample = ref<string | null>(null)

  // 身份列表（初始值用本地常量兜底，onMounted 时从 API 刷新）
  const identities = ref<IdentityOption[]>([...IDENTITY_OPTIONS])

  // 当前扫描相关
  const currentScanId = ref<string | null>(null)
  const currentScanResult = ref<ScanResult | null>(null)
  const isScanning = ref(false)
  const scanError = ref<string | null>(null)

  // 历史记录筛选状态（跨页面持久化，返回历史页时恢复）
  const historyFilter = ref<HistoryFilter>({
    pageNum: 1,
    pageSize: 10,
    keyword: '',
    riskLevel: '',
    isFavorite: false,
    order: 'latest',
  })

  // ===== getters =====
  const hasIdentity = computed(() => selectedIdentity.value !== null)
  const hasTaskText = computed(() => taskText.value.trim().length > 0)
  const charCount = computed(() => taskText.value.length)

  const selectedIdentityOption = computed(() =>
    identities.value.find((i) => i.type === selectedIdentity.value) || null,
  )

  // ===== actions =====
  /** 从后端加载身份列表（失败时保留本地兜底常量） */
  async function loadIdentities(): Promise<void> {
    try {
      const list = await userApi.getIdentities()
      identities.value = list.map((item) => ({
        type: item.type as IdentityType,
        label: item.label,
        icon: item.icon,
        desc: item.desc,
      }))
    } catch {
      // API 失败时保留初始的 IDENTITY_OPTIONS 兜底
    }
  }

  /** 选择身份 */
  function setIdentity(identity: IdentityType): void {
    selectedIdentity.value = identity
  }

  /** 设置任务文本 */
  function setTaskText(text: string): void {
    taskText.value = text
  }

  /** 应用示例任务 */
  function applyExample(example: ExampleTask): void {
    taskText.value = example.text
    currentExample.value = example.id
    // 同时设置示例对应的身份
    selectedIdentity.value = example.identity
  }

  /** 重置全部（不含扫描结果） */
  function reset(): void {
    selectedIdentity.value = null
    taskText.value = ''
    currentExample.value = null
  }

  /** 设置扫描结果（扫描完成后调用） */
  function setScanResult(result: ScanResult): void {
    currentScanId.value = result.id
    currentScanResult.value = result
  }

  /** 设置扫描状态 */
  function setScanning(scanning: boolean): void {
    isScanning.value = scanning
  }

  /** 设置扫描错误 */
  function setScanError(message: string | null): void {
    scanError.value = message
  }

  /** 清空当前扫描结果 */
  function clearScanResult(): void {
    currentScanId.value = null
    currentScanResult.value = null
    scanError.value = null
    isScanning.value = false
  }

  /** 更新历史筛选条件（局部合并） */
  function setHistoryFilter(patch: Partial<HistoryFilter>): void {
    historyFilter.value = { ...historyFilter.value, ...patch }
  }

  /** 重置历史筛选条件 */
  function resetHistoryFilter(): void {
    historyFilter.value = {
      pageNum: 1,
      pageSize: 10,
      keyword: '',
      riskLevel: '',
      isFavorite: false,
      order: 'latest',
    }
  }

  return {
    // state
    selectedIdentity,
    taskText,
    currentExample,
    identities,
    currentScanId,
    currentScanResult,
    isScanning,
    scanError,
    historyFilter,
    // getters
    hasIdentity,
    hasTaskText,
    charCount,
    selectedIdentityOption,
    // actions
    loadIdentities,
    setIdentity,
    setTaskText,
    applyExample,
    reset,
    setScanResult,
    setScanning,
    setScanError,
    clearScanResult,
    setHistoryFilter,
    resetHistoryFilter,
  }
})
