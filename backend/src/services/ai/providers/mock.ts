/**
 * Mock Provider
 *
 * 不调用真实 AI 接口，直接返回模拟数据
 * 用途：
 * 1. 开发测试（无需配置真实 API Key）
 * 2. 真实 API 不可用时的兜底
 * 3. 成本控制超额时降级
 *
 * 返回的内容是预先构造的 JSON 字符串，由 resultParser 解析
 */
import { BaseAIProvider } from './base'
import type { AIChatParams, AIChatResult, AIProviderName, HighlightType } from '../types'
import type { IdentityType } from '@/types/identity'

export class MockProvider extends BaseAIProvider {
  readonly name: AIProviderName = 'mock'
  readonly defaultModel = 'mock-engine-v1'

  constructor() {
    super({ apiKey: 'mock', baseUrl: 'mock://localhost' })
  }

  /** mock 始终视为已配置 */
  isConfigured(): boolean {
    return true
  }

  async chat(params: AIChatParams): Promise<AIChatResult> {
    // 模拟 200-500ms 延迟
    await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 300))

    // 从 messages 中提取 taskText 和 identity
    const userMessage = params.messages.find((m) => m.role === 'user')
    const taskText = extractTaskText(userMessage?.content || '')
    const identity = extractIdentity(userMessage?.content || '')

    const content = buildMockScanJson(taskText, identity)

    return {
      content,
      promptTokens: Math.ceil(taskText.length / 2) + 800,
      completionTokens: Math.ceil(content.length / 2),
      totalTokens: Math.ceil(taskText.length / 2) + 800 + Math.ceil(content.length / 2),
      model: this.defaultModel,
      provider: this.name,
    }
  }
}

/** 从 prompt 内容中提取任务原文 */
function extractTaskText(content: string): string {
  const match = content.match(/"""\n([\s\S]*?)\n"""/)
  return match?.[1]?.trim() || content.slice(0, 200)
}

/** 从 prompt 内容中提取身份 */
function extractIdentity(content: string): IdentityType {
  const match = content.match(/身份代码：(\w+)/)
  const id = match?.[1] as IdentityType | undefined
  if (id && ['student', 'intern', 'developer', 'designer', 'pm', 'lead'].includes(id)) {
    return id
  }
  return 'developer'
}

/**
 * 构造模拟扫描结果 JSON
 *
 * 4 个示例任务匹配完整 mock 数据，其他输入返回通用模板
 */
function buildMockScanJson(taskText: string, identity: IdentityType): string {
  const result = generateMockScanResult(taskText, identity)
  return JSON.stringify(result)
}

/** mock 数据生成（与 scan.service.ts 中的逻辑一致，避免循环依赖，独立实现） */
function generateMockScanResult(
  taskText: string,
  identity: IdentityType,
): Record<string, unknown> {
  // 匹配 4 个示例任务
  if (taskText.includes('优化一下') && taskText.includes('质感')) {
    return MOCK_RESULTS.internPage(identity)
  }
  if (taskText.includes('导出 Excel') || taskText.includes('导出Excel')) {
    return MOCK_RESULTS.devExport(identity)
  }
  if (taskText.includes('人工智能对社会生活')) {
    return MOCK_RESULTS.studentEssay(identity)
  }
  if (taskText.includes('AI 创新作品') || taskText.includes('AI创新作品')) {
    return MOCK_RESULTS.contestRules(identity)
  }
  return buildGenericMock(taskText, identity)
}

/** 身份对应的称呼 */
const IDENTITY_TITLES: Record<IdentityType, string> = {
  student: '老师您好',
  intern: '导师你好',
  developer: '关于这个需求',
  designer: '关于设计需求',
  pm: '关于这个项目',
  lead: '关于这次任务分配',
}

/** 模糊词正则（统一定义，避免重复） */
const VAGUE_WORD_REGEX = /简单|差不多|大概|随便|看一下|尽快|质感|体验|优化/g

/** 模糊词 → 分类映射 */
const VAGUE_WORD_TYPE_MAP: Record<string, HighlightType> = {
  简单: '程度', 差不多: '程度', 大概: '程度', 随便: '程度',
  质感: '质感', 体验: '质感',
  优化: '范围',
  尽快: '时间',
  看一下: '完整度',
}

/** 通用 mock 模板 */
function buildGenericMock(taskText: string, identity: IdentityType): Record<string, unknown> {
  const vagueMatches = taskText.match(VAGUE_WORD_REGEX) || []
  const hasVagueWords = vagueMatches.length > 0
  const score = hasVagueWords ? 68 : 52
  const riskLevel = score >= 61 ? 'high' : score >= 31 ? 'mid' : 'low'
  const highlightWords: Array<{ word: string; type: HighlightType; explanation: string }> = []
  for (const w of vagueMatches) {
    highlightWords.push({
      word: w,
      type: VAGUE_WORD_TYPE_MAP[w] || '程度',
      explanation: `"${w}" 是模糊表达，需进一步澄清具体含义`,
    })
  }

  return {
    score,
    riskLevel,
    summary: hasVagueWords
      ? '任务说明存在模糊表达，建议补充明确标准后再开工。'
      : '任务说明整体相对清晰，但仍建议确认关键细节。',
    highlightWords,
    riskGroups: hasVagueWords
      ? [
          {
            name: '模糊表达',
            items: [
              { level: 'mid', quote: vagueMatches[0] || '模糊词汇', consequence: '理解不一致导致返工', suggestion: '量化具体标准' },
            ],
          },
          {
            name: '缺失要素',
            items: [
              { level: 'mid', quote: '缺少验收标准', consequence: '验收时容易扯皮', suggestion: '明确什么程度算完成' },
              { level: 'low', quote: '缺少时间节点', consequence: '节奏失控', suggestion: '约定交付时间' },
            ],
          },
        ]
      : [
          {
            name: '建议确认',
            items: [
              { level: 'low', quote: '验收标准', consequence: '避免后期分歧', suggestion: '明确验收标准' },
            ],
          },
        ],
    questions: {
      mustAsk: [
        '最终的验收标准是什么？',
        '期望的交付时间是什么时候？',
      ],
      laterAsk: ['是否有参考案例？'],
    },
    mvp: {
      do: ['先完成核心功能', '确认关键需求点', '阶段性对齐'],
      dontDo: ['不要过度设计', '不要做未明确要求的功能'],
      later: ['优化迭代', '扩展功能'],
    },
    roadmap: [
      { step: 1, title: '需求确认', description: '明确验收标准和交付时间，30 分钟' },
      { step: 2, title: '方案设计', description: '确定执行方案，1 小时' },
      { step: 3, title: '核心实现', description: '完成主要功能' },
      { step: 4, title: '中期对齐', description: '阶段性同步进展' },
      { step: 5, title: '交付验收', description: '按标准交付' },
    ],
    confirmScript: `${IDENTITY_TITLES[identity]}，想先确认几点：

1. 最终的验收标准是什么？什么程度算完成？
2. 期望的交付时间是什么时候？
3. 是否有参考案例或对标？

确认后我会立即开始，并在过程中阶段性同步进展。`,
  }
}

/** 4 个示例任务的完整 mock 数据 */
const MOCK_RESULTS = {
  internPage: (identity: IdentityType): Record<string, unknown> => ({
    score: 78,
    riskLevel: 'high',
    summary: '任务描述模糊、缺少可衡量标准、交付时间紧迫，存在较高返工风险。建议立即与导师对齐"质感"的具体含义和验收标准。',
    highlightWords: [
      { word: '优化', type: '范围' as HighlightType, explanation: '"优化"未说明优化方向（性能/视觉/交互），容易做偏方向' },
      { word: '更有质感', type: '质感' as HighlightType, explanation: '"质感"是主观词，不同人对质感的理解差异大' },
      { word: '看个版本', type: '完整度' as HighlightType, explanation: '"版本"指设计稿、原型还是代码？交付物不明确' },
      { word: '明天下午', type: '时间' as HighlightType, explanation: '时间紧迫，未预留沟通确认和返工缓冲' },
    ],
    riskGroups: [
      {
        name: '模糊表达',
        items: [
          { level: 'mid', quote: '优化一下', consequence: '容易做偏方向', suggestion: '明确优化方向（视觉/性能/交互）' },
          { level: 'high', quote: '更有质感', consequence: '主观词，返工高发区', suggestion: '提供参考案例锚定标准' },
          { level: 'mid', quote: '看个版本', consequence: '交付物不明确', suggestion: '明确是设计稿/原型/代码' },
        ],
      },
      {
        name: '时间风险',
        items: [
          { level: 'high', quote: '明天下午', consequence: '时间紧迫，无返工缓冲', suggestion: '确认是否可延期或缩小范围' },
        ],
      },
      {
        name: '缺失要素',
        items: [
          { level: 'high', quote: '缺少验收标准', consequence: '验收时容易扯皮', suggestion: '明确完成标准' },
          { level: 'mid', quote: '缺少参考', consequence: '难以锚定质感标准', suggestion: '提供对标网站' },
        ],
      },
    ],
    questions: {
      mustAsk: [
        '"质感"具体指哪方面？视觉风格、动效、还是排版？',
        '有没有可以参考的网站或竞品？',
        '明天下午看的是设计稿、原型还是上线版本？',
      ],
      laterAsk: [
        '首页哪些模块是这次优化的重点？',
        '是否需要保留现有视觉风格，还是可以推翻重来？',
      ],
    },
    mvp: {
      do: ['先出 1 张首页关键视觉稿（首屏即可）', '挑 1 个对标参考网站作为锚点', '今天内确认方向，明天交付首屏设计'],
      dontDo: ['不要一次性做多版方案', '不要动全站页面', '不要写代码上线'],
      later: ['多版方案对比', '全站统一优化', '前端开发落地'],
    },
    roadmap: [
      { step: 1, title: '对齐需求', description: '与导师确认"质感"含义、参考案例、交付物，30 分钟' },
      { step: 2, title: '选定参考', description: '找 1-2 个对标网站，确认视觉方向，1 小时' },
      { step: 3, title: '出首屏稿', description: '只做首页首屏视觉稿，不展开内页，半天' },
      { step: 4, title: '中期对齐', description: '出稿后立即给导师看，确认方向再细化，15 分钟' },
      { step: 5, title: '交付验收', description: '明天下午交付首屏设计稿 + 简短说明，次日' },
    ],
    confirmScript: `${IDENTITY_TITLES[identity]}，关于首页优化的任务我想先和你确认几点，避免做偏方向：

1. "更有质感"主要想优化哪个方面？视觉风格、动效还是排版？有没有可以参考的网站？
2. 明天下午看的是设计稿、可点击原型还是上线代码？
3. 这次重点优化哪些模块？是否需要保留现有风格？

我计划先出 1 张首屏视觉稿 + 1 个对标参考，今天内和你对齐方向，明天下午交付。这样安排可以吗？`,
  }),

  devExport: (identity: IdentityType): Record<string, unknown> => ({
    score: 72,
    riskLevel: 'high',
    summary: '"简单做一下"是典型的范围模糊陷阱，导出功能涉及字段、格式、权限、数据量等多维度，简单做容易埋下返工隐患。',
    highlightWords: [
      { word: '导出 Excel', type: '完整度' as HighlightType, explanation: 'Excel 格式、字段范围、筛选条件均未说明' },
      { word: '简单做一下', type: '程度' as HighlightType, explanation: '"简单做"是开发返工 TOP1 信号词' },
    ],
    riskGroups: [
      {
        name: '范围模糊',
        items: [
          { level: 'mid', quote: '导出 Excel', consequence: '格式、字段、筛选未说明', suggestion: '确认字段、格式、筛选条件' },
          { level: 'high', quote: '简单做一下', consequence: '后期会被要求加各种功能', suggestion: '明确"简单"的边界' },
        ],
      },
      {
        name: '技术风险',
        items: [
          { level: 'high', quote: '大数据量未考虑', consequence: '同步导出会超时', suggestion: '确认数据量级，必要时做异步' },
          { level: 'mid', quote: '权限未定义', consequence: '数据安全风险', suggestion: '确认导出权限' },
        ],
      },
    ],
    questions: {
      mustAsk: [
        '导出哪些字段？是列表显示的全部字段还是包含更多？',
        '导出格式是 .xlsx 还是 .csv？需要支持筛选条件吗？',
        '数据量级大概多少？最大单次导出多少条？',
      ],
      laterAsk: [
        '导出权限怎么控制？是否需要记录导出日志？',
        '导出失败如何提示用户？是否需要重试？',
      ],
    },
    mvp: {
      do: ['实现列表页"导出"按钮 + 当前筛选条件下的同步导出', '导出 .xlsx 格式，字段 = 列表显示字段', '限制单次导出 ≤ 10000 条'],
      dontDo: ['不要做异步队列', '不要做导出模板配置', '不要做导出权限分级'],
      later: ['异步导出（大数据量）', '自定义导出字段', '导出权限分级', '导出日志审计'],
    },
    roadmap: [
      { step: 1, title: '需求对齐', description: '确认字段、格式、数据量、筛选条件，30 分钟' },
      { step: 2, title: '技术方案', description: '选定库（如 exceljs）、确定同步/异步方案，1 小时' },
      { step: 3, title: '核心实现', description: '实现导出接口 + 列表页按钮 + 筛选条件传递，半天' },
      { step: 4, title: '边界处理', description: '空数据提示、超量提示、错误重试，2 小时' },
      { step: 5, title: '自测验收', description: '测试各种筛选组合 + 边界情况，1 小时' },
    ],
    confirmScript: `${IDENTITY_TITLES[identity]}，关于导出 Excel 功能，想先和你确认几点：

1. 导出哪些字段？是列表显示的全部字段，还是需要包含更多字段？
2. 导出格式是 .xlsx 还是 .csv？是否需要支持当前筛选条件？
3. 数据量级大概多少？单次导出最大多少条？（超过 1 万条需要做异步方案）
4. "简单做一下"具体指哪些功能可以不做？

我计划先做 MVP 版本：列表页按钮 + 当前筛选同步导出 .xlsx + 限制 1 万条以内。这样可以吗？`,
  }),

  studentEssay: (identity: IdentityType): Record<string, unknown> => ({
    score: 58,
    riskLevel: 'mid',
    summary: '作业要求看似清晰，但"实际案例""观点明确""结构清晰"均为开放性要求，评分主观性较强。建议提前确认评分细则和参考范例。',
    highlightWords: [
      { word: '实际案例', type: '参考' as HighlightType, explanation: '案例数量、类型、新旧均未要求' },
      { word: '不少于3000字', type: '完整度' as HighlightType, explanation: '字数明确但正文范围未说明' },
      { word: '观点明确', type: '程度' as HighlightType, explanation: '"明确"标准因人而异' },
      { word: '结构清晰', type: '程度' as HighlightType, explanation: '未说明是哪种结构' },
    ],
    riskGroups: [
      {
        name: '评分标准模糊',
        items: [
          { level: 'mid', quote: '实际案例', consequence: '案例数量、类型未要求，影响评分', suggestion: '确认案例数量和类型' },
          { level: 'mid', quote: '观点明确', consequence: '标准因人而异', suggestion: '对齐到"有明确论点句"' },
        ],
      },
      {
        name: '缺失要素',
        items: [
          { level: 'mid', quote: '缺少参考文献要求', consequence: '学术规范不明', suggestion: '确认是否需要参考文献' },
          { level: 'low', quote: '缺少提交格式', consequence: '格式影响第一印象分', suggestion: '确认 Word/PDF + 字体字号' },
        ],
      },
    ],
    questions: {
      mustAsk: [
        '有没有评分细则或往届优秀作业可以参考？',
        '"实际案例"需要几个？是否要求是近 3 年的新案例？',
        '是否需要参考文献？格式要求是什么？',
      ],
      laterAsk: [
        '提交格式是 Word 还是 PDF？有字体字号要求吗？',
        '主题需要聚焦到某个子领域吗？',
      ],
    },
    mvp: {
      do: ['聚焦 1 个子领域', '用 2-3 个具体案例', '明确论点 + 分论点 + 案例论证 + 反思结论'],
      dontDo: ['不要泛泛而谈多个领域', '不要堆砌概念没有案例', '不要超过 5000 字啰嗦'],
      later: ['多领域对比', '深度理论分析', '数据图表支撑'],
    },
    roadmap: [
      { step: 1, title: '确认标准', description: '找老师要评分细则或往届范例，半天' },
      { step: 2, title: '选题聚焦', description: '选定 1 个子领域 + 2-3 个案例，2 小时' },
      { step: 3, title: '搭建框架', description: '论点-分论点-案例-结论的提纲，2 小时' },
      { step: 4, title: '填充内容', description: '按框架写作，案例+分析+观点，1-2 天' },
      { step: 5, title: '润色校对', description: '检查字数、格式、引用、错别字，半天' },
    ],
    confirmScript: `${IDENTITY_TITLES[identity]}，关于"人工智能对社会生活的影响"这篇作业，想确认几点：

1. 有没有评分细则或往届优秀作业可以参考？
2. "实际案例"需要几个？是否要求是近 3 年的新案例？
3. 是否需要参考文献？格式要求是什么（GB/T 7714）？
4. 主题需要聚焦到某个子领域吗？还是可以宏观论述？

我计划聚焦"AI 对教育的影响"，用 2-3 个具体案例分析，3500 字左右。这样安排可以吗？`,
  }),

  contestRules: (identity: IdentityType): Record<string, unknown> => ({
    score: 65,
    riskLevel: 'high',
    summary: '比赛规则高度概括，"创新性、实用性、完成度、设计体验"均为评委主观判断维度。建议研究往届获奖作品明确标准。',
    highlightWords: [
      { word: 'AI 创新作品', type: '完整度' as HighlightType, explanation: '"AI 作品"是否要求必须用特定模型？' },
      { word: 'Demo', type: '完整度' as HighlightType, explanation: 'Demo 形式未说明' },
      { word: '创新性', type: '程度' as HighlightType, explanation: '是技术、应用还是模式创新？' },
      { word: '实用性', type: '程度' as HighlightType, explanation: '"实用"对谁而言？' },
      { word: '完成度', type: '程度' as HighlightType, explanation: '完成到什么程度算"完成"？' },
      { word: '设计体验', type: '质感' as HighlightType, explanation: '是 UI 美观还是交互流畅？' },
    ],
    riskGroups: [
      {
        name: '评判标准主观',
        items: [
          { level: 'mid', quote: '创新性', consequence: '主观判断，方向不明', suggestion: '明确是技术/应用/模式创新' },
          { level: 'mid', quote: '完成度', consequence: '完成标准不明', suggestion: '明确 Demo 可跑 vs 功能闭环' },
        ],
      },
      {
        name: '缺失要素',
        items: [
          { level: 'high', quote: '缺少评分权重', consequence: '精力分配无依据', suggestion: '确认四维度各占多少分' },
          { level: 'high', quote: '缺少截止时间', consequence: '硬约束不明', suggestion: '确认提交截止时间' },
        ],
      },
    ],
    questions: {
      mustAsk: [
        '四个维度（创新性/实用性/完成度/设计体验）各占多少分？',
        'Demo 形式是什么？可点击原型、视频演示还是现场演示？',
        '提交清单包括什么？源码、文档、视频、PPT？',
      ],
      laterAsk: [
        '有往届获奖作品可以参考吗？',
        '评委背景是什么？技术专家还是行业专家？',
      ],
    },
    mvp: {
      do: ['做一个核心功能闭环的可运行 Demo', '准备 3 分钟演示视频 + 1 页 PPT', '突出 1 个核心创新点'],
      dontDo: ['不要追求功能多而全', '不要做无法演示的后台功能', '不要忽视设计体验'],
      later: ['完整产品化', '用户测试', '商业模式设计'],
    },
    roadmap: [
      { step: 1, title: '研究标准', description: '看往届获奖作品 + 确认评分权重，半天' },
      { step: 2, title: '确定选题', description: '选定 1 个核心创新点 + 目标场景，半天' },
      { step: 3, title: '开发 Demo', description: '核心功能闭环，可演示关键路径，3-5 天' },
      { step: 4, title: '打磨体验', description: 'UI 设计 + 演示流程 + 错误兜底，2 天' },
      { step: 5, title: '准备材料', description: '演示视频 + PPT + 提交文档，1 天' },
    ],
    confirmScript: `${IDENTITY_TITLES[identity]}，关于比赛提交规则，想确认几点：

1. 四个维度（创新性、实用性、完成度、设计体验）各占多少分？
2. Demo 形式是什么？可点击原型、视频演示还是现场演示？
3. 提交清单包括什么？是否需要源码、文档、视频、PPT？格式要求？
4. 提交截止时间是什么时候？

我计划做一个核心功能闭环的 Demo + 3 分钟演示视频 + 1 页 PPT，突出 1 个核心创新点。这样安排可以吗？`,
  }),
}
