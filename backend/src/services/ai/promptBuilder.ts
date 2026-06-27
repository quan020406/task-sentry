/**
 * Prompt 构建器
 *
 * 职责：
 * 1. 加载并缓存模板文件（system.md / scanTask.md）
 * 2. 替换模板变量（{{taskText}} / {{identity}} / {{identityDescription}}）
 * 3. 根据身份注入适配话术
 * 4. 输出最终的 system + user 消息
 */
import fs from 'node:fs'
import path from 'node:path'
import type { ChatMessage } from './types'
import type { IdentityType } from '@/types/identity'

/** 模板文件路径 */
const TEMPLATES_DIR = path.join(__dirname, 'templates')
const SYSTEM_TEMPLATE_PATH = path.join(TEMPLATES_DIR, 'system.md')
const SCAN_TASK_TEMPLATE_PATH = path.join(TEMPLATES_DIR, 'scanTask.md')

/** 身份说明：用于注入到 prompt 中 */
const IDENTITY_DESCRIPTIONS: Record<IdentityType, string> = {
  student: '学生（写作业、做课程项目，面向老师提交）',
  intern: '实习生（接导师分配的任务，面向 mentor 提交）',
  developer: '开发者（接产品需求开发，面向产品/甲方交付）',
  designer: '设计师（接设计需求出稿，面向需求方交付）',
  pm: '产品/运营（接业务方需求落地，面向业务方交付）',
  lead: '项目负责人（统筹任务分配与跟进，面向团队/上级汇报）',
}

/** 模板缓存（首次读取后缓存） */
let systemTemplateCache: string | null = null
let scanTaskTemplateCache: string | null = null

/**
 * 读取模板文件（带缓存）
 * 文件不存在时返回空串并记录警告，避免硬失败
 */
function readTemplate(filePath: string, cacheKey: 'system' | 'scanTask'): string {
  if (cacheKey === 'system' && systemTemplateCache !== null) return systemTemplateCache
  if (cacheKey === 'scanTask' && scanTaskTemplateCache !== null) return scanTaskTemplateCache

  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    if (cacheKey === 'system') systemTemplateCache = content
    else scanTaskTemplateCache = content
    return content
  } catch (e) {
    console.warn(`[AI] 模板文件读取失败: ${filePath}`, e)
    return ''
  }
}

/** 清除模板缓存（测试用） */
export function clearTemplateCache(): void {
  systemTemplateCache = null
  scanTaskTemplateCache = null
}

/**
 * 替换模板变量
 * 支持 {{var}} 格式
 */
function replaceVars(template: string, vars: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(vars)) {
    // 转义正则特殊字符
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    result = result.replace(new RegExp(`{{${escapedKey}}}`, 'g'), value)
  }
  return result
}

/**
 * 构建扫描任务的 system + user 消息
 * @param taskText 任务原文
 * @param identity 用户身份
 * @returns [systemMessage, userMessage]
 */
export function buildScanMessages(
  taskText: string,
  identity: IdentityType,
): ChatMessage[] {
  const systemPrompt = readTemplate(SYSTEM_TEMPLATE_PATH, 'system')
  const scanTaskPrompt = readTemplate(SCAN_TASK_TEMPLATE_PATH, 'scanTask')

  const userPrompt = replaceVars(scanTaskPrompt, {
    taskText,
    identity,
    identityDescription: IDENTITY_DESCRIPTIONS[identity],
  })

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]
}

/**
 * 获取身份描述（对外暴露，供其他模块使用）
 */
export function getIdentityDescription(identity: IdentityType): string {
  return IDENTITY_DESCRIPTIONS[identity]
}
