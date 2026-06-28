# 《先别开工》后端 Dockerfile
# 多阶段构建：builder 编译 TS → runner 运行生产依赖
# 构建上下文：backend/
#
# 注意：better-sqlite3 是原生模块，需在 alpine 中安装
# python3/make/g++ 进行编译。

# ===== 阶段 1：构建（编译 TypeScript）=====
FROM local/ubuntu-node:22 AS builder

# 安装 better-sqlite3 原生编译所需工具
RUN python3 --version && make --version && g++ --version

WORKDIR /app

# 先复制依赖清单，利用 Docker 层缓存
COPY package.json package-lock.json* ./

# 安装全部依赖（含 devDependencies，tsc 编译需要）
RUN npm config set registry https://registry.npmmirror.com \
    && npm_config_nodedir=/usr/local npm_config_build_from_source=true npm ci

# 复制源代码
COPY . .

# TypeScript 编译
RUN npm run build

# ===== 阶段 2：运行（仅生产依赖）=====
FROM local/ubuntu-node:22 AS runner

# 安装 better-sqlite3 原生编译所需工具（生产镜像也需重新编译 native 模块）
RUN python3 --version && make --version && g++ --version

WORKDIR /app

# 复制依赖清单
COPY package.json package-lock.json* ./

# 仅安装生产依赖（better-sqlite3 会在本阶段重新编译原生模块）
RUN npm config set registry https://registry.npmmirror.com \
    && npm_config_nodedir=/usr/local npm_config_build_from_source=true npm ci --omit=dev

# 复制编译产物
COPY --from=builder /app/dist ./dist

# 复制数据库 schema 到编译产物对应位置
# （database/index.ts 用 path.join(__dirname, 'schema.sql') 定位，
#   tsc 不会复制 .sql 文件，需手动放到 dist/database/schema.sql）
COPY src/database/schema.sql ./dist/database/schema.sql

# 复制 AI Prompt 模板文件（tsc 不会自动复制 .md）
COPY src/services/ai/templates ./dist/services/ai/templates

# 数据库目录（挂载卷用）
RUN mkdir -p /app/data

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "dist/app.js"]
