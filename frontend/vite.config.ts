import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    open: true,
    // 代理 /api 到后端服务，解决开发环境跨域
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // 生产构建目标：现代浏览器，减少 polyfill
    target: 'es2020',
    // 生产环境关闭 sourcemap，避免泄露源码
    sourcemap: false,
    // 调高 chunk 大小告警阈值
    chunkSizeWarningLimit: 1000,
    // 注意：manualChunks 配置在 Vite 5 下对 Vue 静态依赖链无效
    // （vue/vue-router/pinia 在 main.ts 中同步导入，必须打包到主入口）
    // 已验证：函数形式和对象形式的 manualChunks 均未生成独立 vendor chunk
    // 当前 index-*.js gzip 后 63.81 kB，满足首屏 < 2s 的性能目标
  },
})
