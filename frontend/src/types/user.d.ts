// 用户身份类型
export type IdentityType = 'student' | 'intern' | 'developer' | 'designer' | 'pm' | 'lead'

// 用户信息
export interface UserInfo {
  id: number
  username: string
  email: string
  avatar: string | null
  scanCount: number
  createdAt: string
}

// 登录/注册返回结果
export interface AuthResult {
  token: string
  user: UserInfo
}

// 游客会话返回结果
export interface GuestSessionResult {
  token: string
  guestId: string
  remainingCount: number
  resetAt: string
  /** 每日免费次数上限，来自后端 GUEST_DAILY_LIMIT */
  dailyLimit?: number
}

// 用户统计数据
export interface UserStats {
  totalScans: number
  favoriteCount: number
  avgScore: number
  highRiskCount: number
  midRiskCount: number
  lowRiskCount: number
  monthScans: number
}

// 注册请求参数
export interface RegisterParams {
  username: string
  email: string
  password: string
}

// 登录请求参数
export interface LoginParams {
  account: string
  password: string
}

// 更新用户信息参数
export interface UpdateProfileParams {
  username?: string
  avatar?: string
}

// 修改密码参数
export interface ChangePasswordParams {
  oldPassword: string
  newPassword: string
}
