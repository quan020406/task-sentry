import { Router, type Request, type Response } from 'express'
import { success } from '@/utils/response'

const router = Router()

/**
 * 健康检查接口
 * GET /api/health
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json(
    success({
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    }),
  )
})

/**
 * 测试接口 - 验证前后端联调
 * GET /api/hello
 */
router.get('/hello', (_req: Request, res: Response) => {
  res.json(success('Hello from 先别开工 API', '请求成功'))
})

/**
 * 获取身份选项列表
 * GET /api/identities
 * 字段与前端 IDENTITY_OPTIONS 对齐：type / label / icon / desc
 */
router.get('/identities', (_req: Request, res: Response) => {
  res.json(
    success([
      { type: 'student', label: '学生', icon: 'S', desc: '写作业、做课程项目' },
      { type: 'intern', label: '实习生', icon: 'I', desc: '接导师分配的任务' },
      { type: 'developer', label: '开发者', icon: 'D', desc: '接产品需求开发' },
      { type: 'designer', label: '设计师', icon: 'D', desc: '接设计需求出稿' },
      { type: 'pm', label: '产品/运营', icon: 'P', desc: '接业务方需求落地' },
      { type: 'lead', label: '项目负责人', icon: 'L', desc: '统筹任务分配与跟进' },
    ]),
  )
})

/**
 * 获取示例任务列表
 * GET /api/examples
 * 字段与前端 EXAMPLE_TASKS 对齐：id / identity / title / text
 */
router.get('/examples', (_req: Request, res: Response) => {
  res.json(
    success([
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
    ]),
  )
})

export default router
