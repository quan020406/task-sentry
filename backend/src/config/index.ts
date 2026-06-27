import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

/**
 * 应用配置
 * 从环境变量读取，提供默认值
 */
export const config = {
  /** 服务端口 */
  port: parseInt(process.env.PORT || '3000', 10),

  /** JWT 密钥 */
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_change_me',

  /** JWT 过期时间 */
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  /** 游客 token 过期时间 */
  guestJwtExpiresIn: process.env.GUEST_JWT_EXPIRES_IN || '1d',

  /** 游客每日免费扫描次数 */
  guestDailyLimit: parseInt(process.env.GUEST_DAILY_LIMIT || '3', 10),

  /** 数据库文件路径 */
  dbPath: process.env.DB_PATH || './data/app.db',

  /** 前端地址（CORS） */
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

  /** AI 服务配置 */
  ai: {
    /**
     * AI 服务提供方
     * - doubao: 豆包（字节跳动）
     * - wenxin: 文心一言（百度千帆）
     * - deepseek: DeepSeek
     * - openai: OpenAI 兼容
     * - mock: 模拟模式（不调用真实 API）
     */
    provider: process.env.AI_PROVIDER || process.env.AI_API_PROVIDER || 'mock',
    apiKey: process.env.AI_API_KEY || process.env.DONGRUAN_SHIXUN_API_KEY || '',
    baseUrl: process.env.AI_BASE_URL || process.env.AI_API_BASE_URL || '',
    /** 模型名称（不填则用 provider 默认模型） */
    model: process.env.AI_MODEL || '',
    /** 温度（0-1），默认 0.7 */
    temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
    /** 最大输出 token，默认 2000 */
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2000', 10),
    /** 每日 token 上限（0 表示不限制） */
    dailyTokenLimit: parseInt(process.env.AI_DAILY_TOKEN_LIMIT || '0', 10),
  },
} as const

export type AppConfig = typeof config
