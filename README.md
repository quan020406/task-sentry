# Task Sentry

> AI 任务需求防返工扫描仪 —— 在开工前，帮你识别需求中的风险与歧义。

## 项目简介

Task Sentry 是一款基于 AI 的任务需求分析工具，通过多维度扫描识别需求文档中的潜在风险（如需求模糊、缺少验收标准、技术可行性存疑等），帮助团队在开工前发现问题、减少返工。

UI 采用新野兽派（Neo-Brutalist）设计风格，强调高对比度、粗边框、直接有力的视觉表达。

## 功能特性

- **AI 智能扫描**：输入任务描述，AI 自动从多个维度分析风险
- **风险评分**：量化风险等级，一眼识别高风险需求
- **多维分析**：覆盖需求清晰度、验收标准、技术可行性、依赖关系等维度
- **历史记录**：保存扫描历史，支持搜索、筛选、收藏
- **分享功能**：生成分享链接，团队成员可查看扫描结果
- **身份切换**：支持产品经理/开发者/设计师等不同身份视角
- **个人中心**：查看使用统计、管理账户设置
- **游客模式**：无需注册即可体验，每日有限次免费扫描

## 技术栈

### 前端
- **框架**：Vue 3 + TypeScript
- **构建工具**：Vite
- **状态管理**：Pinia
- **路由**：Vue Router
- **HTTP 客户端**：Axios
- **工具库**：VueUse

### 后端
- **框架**：Express + TypeScript
- **数据库**：SQLite (better-sqlite3)
- **认证**：JWT (jsonwebtoken + bcryptjs)
- **AI 集成**：支持多家 LLM 提供商（OpenAI / DeepSeek / 豆包 / 文心一言）

### 部署
- Docker / Docker Compose
- 前端 Nginx 托管 + 反向代理

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 本地开发

#### 1. 克隆仓库

```bash
git clone <your-repo-url>
cd task-sentry
```

#### 2. 后端配置

```bash
cd backend
cp .env.example .env
# 编辑 .env，配置 JWT_SECRET 等参数
npm install
npm run dev
```

后端默认运行在 `http://localhost:3000`

#### 3. 前端配置

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

前端默认运行在 `http://localhost:5173`

### Docker 部署

#### 1. 准备配置

```bash
cp .env.docker.example .env.docker
# 编辑 .env.docker，设置 JWT_SECRET 等必要配置
```

#### 2. 启动服务

```bash
docker compose --env-file .env.docker up -d --build
```

访问 `http://localhost` 即可使用。

#### 3. 停止服务

```bash
docker compose down
```

## 项目结构

```
task-sentry/
├── backend/              # 后端服务
│   ├── src/
│   │   ├── config/       # 配置加载
│   │   ├── controllers/  # 控制器
│   │   ├── database/     # 数据库
│   │   ├── middleware/   # 中间件
│   │   ├── routes/       # 路由
│   │   ├── services/     # 业务逻辑
│   │   ├── types/        # 类型定义
│   │   ├── utils/        # 工具函数
│   │   └── app.ts        # 应用入口
│   ├── data/             # SQLite 数据库文件（运行时生成）
│   ├── Dockerfile
│   └── package.json
├── frontend/             # 前端应用
│   ├── src/
│   │   ├── api/          # API 请求
│   │   ├── components/   # 组件
│   │   │   ├── base/     # 基础组件
│   │   │   ├── business/ # 业务组件
│   │   │   └── layout/   # 布局组件
│   │   ├── composables/  # 组合式函数
│   │   ├── router/       # 路由
│   │   ├── stores/       # 状态管理
│   │   ├── styles/       # 全局样式
│   │   ├── types/        # 类型定义
│   │   ├── utils/        # 工具函数
│   │   ├── views/        # 页面视图
│   │   └── main.ts       # 入口文件
│   ├── public/           # 静态资源
│   ├── Dockerfile
│   ├── nginx.conf        # Nginx 配置
│   └── package.json
├── docker-compose.yml    # Docker Compose 编排
└── README.md
```

## 配置说明

### 后端环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 服务端口 | `3000` |
| `JWT_SECRET` | JWT 签名密钥（必填） | - |
| `JWT_EXPIRES_IN` | JWT 过期时间 | `7d` |
| `GUEST_JWT_EXPIRES_IN` | 游客 Token 过期时间 | `1d` |
| `GUEST_DAILY_LIMIT` | 游客每日免费扫描次数 | `3` |
| `DB_PATH` | 数据库文件路径 | `./data/app.db` |
| `CLIENT_ORIGIN` | 前端地址（CORS） | `http://localhost:5173` |
| `AI_PROVIDER` | AI 提供商 (mock/doubao/wenxin/deepseek/openai) | `mock` |
| `AI_API_KEY` | AI API Key | - |
| `AI_BASE_URL` | AI 接口 Base URL | - |
| `AI_MODEL` | AI 模型名称 | - |
| `AI_TEMPERATURE` | 采样温度 | `0.7` |
| `AI_MAX_TOKENS` | 最大输出 Token | `2000` |
| `AI_DAILY_TOKEN_LIMIT` | 每日 Token 上限（0 不限） | `0` |

> **注意**：`AI_PROVIDER` 默认为 `mock` 模式，不调用真实 API，返回模拟数据用于演示和开发。

### 前端环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_API_BASE_URL` | API 基础路径 | `/api` |
| `VITE_APP_TITLE` | 应用标题 | `先别开工` |

## 开发命令

### 后端

```bash
npm run dev     # 开发模式（热重载）
npm run build   # 构建生产版本
npm start       # 运行生产版本
```

### 前端

```bash
npm run dev     # 开发模式
npm run build   # 类型检查 + 构建
npm run preview # 预览生产构建
```

## 许可证

MIT License
