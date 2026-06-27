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

    // 业务失败：未认证，清除 token
    if (res.code === 10201) {
      const userStore = useUserStore()
      userStore.logout()
    }
    // 在函数内部调用 composable，避免模块级调用问题
    useToast().toast.error(res.message)
    return Promise.reject(new BusinessError(res.message || '请求失败', res.code))
  },
  (error) => {
    // HTTP 错误
    const message = error.response?.data?.message || error.message || '网络错误'
    useToast().toast.error(message)
    return Promise.reject(error)
  },
)

export default request
