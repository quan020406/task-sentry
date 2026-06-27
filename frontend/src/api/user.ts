import request from './request'
import type {
  AuthResult,
  GuestSessionResult,
  UserInfo,
  UserStats,
  RegisterParams,
  LoginParams,
  UpdateProfileParams,
  ChangePasswordParams,
} from '@/types/user'

/** 身份选项（与后端 /api/identities 返回结构一致） */
export interface IdentityOptionDTO {
  type: string
  label: string
  icon: string
  desc: string
}

/**
 * 用户相关 API
 */
export const userApi = {
  /** 用户注册 */
  register(data: RegisterParams): Promise<AuthResult> {
    return request.post('/auth/register', data)
  },

  /** 用户登录（支持用户名或邮箱） */
  login(data: LoginParams): Promise<AuthResult> {
    return request.post('/auth/login', data)
  },

  /** 获取/创建游客身份 */
  getGuestSession(guestId?: string): Promise<GuestSessionResult> {
    return request.post('/auth/guest', { guestId })
  },

  /** 获取当前登录用户信息 */
  me(): Promise<UserInfo> {
    return request.get('/auth/me')
  },

  /** 获取个人中心数据 */
  getProfile(): Promise<UserInfo> {
    return request.get('/user/profile')
  },

  /** 更新个人信息 */
  updateProfile(data: UpdateProfileParams): Promise<UserInfo> {
    return request.put('/user/profile', data)
  },

  /** 修改密码 */
  changePassword(data: ChangePasswordParams): Promise<null> {
    return request.put('/user/password', data)
  },

  /** 获取使用统计 */
  getStats(): Promise<UserStats> {
    return request.get('/user/stats')
  },

  /** 获取身份选项列表 */
  getIdentities(): Promise<IdentityOptionDTO[]> {
    return request.get('/identities')
  },
}
