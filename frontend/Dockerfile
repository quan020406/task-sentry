# 《先别开工》前端 Dockerfile
# 多阶段构建：node 构建 → nginx 运行，最终镜像仅含静态资源
# 构建上下文：frontend/

# ===== 阶段 1：构建 =====
FROM node:18-alpine AS builder

WORKDIR /app

# 先复制依赖清单，利用 Docker 层缓存
COPY package.json package-lock.json* ./

# 安装依赖（包含 devDependencies，构建需要 vue-tsc / vite）
RUN npm ci

# 复制源代码
COPY . .

# 生产构建（vue-tsc 类型检查 + vite build）
RUN npm run build

# ===== 阶段 2：运行 =====
FROM nginx:alpine AS runner

# 复制自定义 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf
# P1-2：复制安全响应头片段，供 nginx.conf 中各 location include
COPY security-headers.conf /etc/nginx/conf.d/security-headers.conf

# 复制构建产物到 Nginx 静态资源目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 暴露 80 端口
EXPOSE 80

# Nginx 默认 CMD 已是 daemon off，无需覆盖
CMD ["nginx", "-g", "daemon off;"]
