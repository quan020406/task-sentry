import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios'
import { useUserStore } from '@/stores/user'
import { useToast } from '@/composables/useToast'
import type { ApiResponse } from '@/types/api'

/** 业务错误（含 code 字段，供 catch 时精确识别错误码） */
export class BusinessError extends Error {
  code: number
  constructor(message: string, code: number) {
    super(message)
    this.name = 'BusinessError'
    this.code = code
  }
}

/**
 * Axios 实例封装
 * - 请求拦截器：自动携带 token
 * - 响应拦截器：统一处理错误、剥离 data
 *
 * P2-10：后端业务错误改为返回对应 HTTP 状态码（400/401/403/404/409/429/5xx）。
 * - HTTP 2xx：从 body 读 code，code===0 返回 data，否则 reject BusinessError
 * - HTTP 非 2xx：从 response body 读 code/message 构造 BusinessError；401 清除 token
 */
const request: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// 请求拦截器：注入 token
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.set('Authorization', `Bearer ${userStore.token}`)
    }
    return config
  },
  (error) => Promise.reject(error),
)

// 响应拦截器：统一处理
request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data

    // 业务成功
    if (res.code === 0) {
      return res.data as never
    }

    // HTTP 2xx 但业务失败（理论上后端不会这样返回，兜底处理）
    useToast().toast.error(res.message)
    return Promise.reject(new BusinessError(res.message || '请求失败', res.code))
  },
  (error) => {
    // HTTP 非 2xx：后端业务错误统一走此分支
    const body = error.response?.data as ApiResponse | undefined
    const code = body?.code ?? error.response?.status ?? 0
    const message = body?.message || error.message || '网络错误'

    // 401 未认证：清除 token，让路由守卫引导去登录
    if (code === 10201 || error.response?.status === 401) {
      const userStore = useUserStore()
      userStore.logout()
    }

    useToast().toast.error(message)
    return Promise.reject(new BusinessError(message, code))
  },
)

export default request
