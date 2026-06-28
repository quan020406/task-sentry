import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo, UserStats } from '@/types/user'
import { userApi } from '@/api/user'

/**
 * 用户状态 store
 * 管理 token、用户信息、登录状态、游客模式
 */
export const useUserStore = defineStore('user', () => {
  // ===== state =====
  const token = ref<string>(localStorage.getItem('token') || '')
  const userInfo = ref<UserInfo | null>(null)
  const isGuest = ref<boolean>(localStorage.getItem('isGuest') === 'true')
  const guestId = ref<string>(localStorage.getItem('guestId') || '')
  const guestRemaining = ref<number>(parseInt(localStorage.getItem('guestRemaining') || '3', 10))
  // P1-1：游客每日上限来自后端 GUEST_DAILY_LIMIT，不再写死 /3
  const guestDailyLimit = ref<number>(
    parseInt(localStorage.getItem('guestDailyLimit') || '3', 10),
  )
  const stats = ref<UserStats | null>(null)

  // ===== getters =====
  const isLoggedIn = computed(() => !!token.value && !isGuest.value)
  const isAuthed = computed(() => !!token.value)
  const username = computed(() => userInfo.value?.username || (isGuest.value ? '游客' : ''))
  const displayLabel = computed(() => {
    if (isLoggedIn.value) return userInfo.value?.username || '用户'
    if (isGuest.value) return `游客 ${guestRemaining.value}/${guestDailyLimit.value}`
    return '未登录'
  })

  // ===== actions =====
  /** 设置 token 并持久化 */
  function setToken(newToken: string): void {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  /** 设置用户信息 */
  function setUserInfo(info: UserInfo): void {
    userInfo.value = info
  }

  /** 登录成功后设置状态 */
  function handleLoginSuccess(result: { token: string; user: UserInfo }): void {
    setToken(result.token)
    setUserInfo(result.user)
    isGuest.value = false
    guestId.value = ''
    stats.value = null
    localStorage.removeItem('isGuest')
    localStorage.removeItem('guestId')
    localStorage.removeItem('guestRemaining')
    localStorage.removeItem('guestDailyLimit')
  }

  /** 设置游客身份 */
  function setGuest(data: {
    token: string
    guestId: string
    remainingCount: number
    resetAt: string
    dailyLimit?: number
  }): void {
    token.value = data.token
    localStorage.setItem('token', data.token)
    isGuest.value = true
    guestId.value = data.guestId
    guestRemaining.value = data.remainingCount
    localStorage.setItem('isGuest', 'true')
    localStorage.setItem('guestId', data.guestId)
    localStorage.setItem('guestRemaining', String(data.remainingCount))
    // P1-1：保存后端返回的每日上限
    if (data.dailyLimit != null) {
      guestDailyLimit.value = data.dailyLimit
      localStorage.setItem('guestDailyLimit', String(data.dailyLimit))
    }
  }

  /** 更新游客剩余次数 */
  function updateGuestRemaining(count: number): void {
    guestRemaining.value = count
    localStorage.setItem('guestRemaining', String(count))
  }

  /** 退出登录，清空状态（保留游客身份） */
  function logout(): void {
    token.value = ''
    userInfo.value = null
    isGuest.value = false
    stats.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('isGuest')
    localStorage.removeItem('guestId')
    localStorage.removeItem('guestRemaining')
    localStorage.removeItem('guestDailyLimit')
  }

  /** 获取用户信息 */
  async function fetchProfile(): Promise<UserInfo> {
    const info = await userApi.getProfile()
    setUserInfo(info)
    return info
  }

  /** 获取使用统计 */
  async function fetchStats(): Promise<UserStats> {
    const data = await userApi.getStats()
    stats.value = data
    return data
  }

  /** 初始化游客身份（应用启动时调用） */
  async function initGuest(): Promise<void> {
    // 已登录用户不需要游客身份
    if (isLoggedIn.value) return
    // 已有游客身份则复用
    if (isGuest.value && guestId.value && token.value) return
    // 创建新游客身份
    try {
      const result = await userApi.getGuestSession(guestId.value || undefined)
      setGuest(result)
    } catch (e) {
      console.error('[user store] 初始化游客身份失败:', e)
    }
  }

  return {
    // state
    token,
    userInfo,
    isGuest,
    guestId,
    guestRemaining,
    guestDailyLimit,
    stats,
    // getters
    isLoggedIn,
    isAuthed,
    username,
    displayLabel,
    // actions
    setToken,
    setUserInfo,
    handleLoginSuccess,
    setGuest,
    updateGuestRemaining,
    logout,
    fetchProfile,
    fetchStats,
    initGuest,
  }
})
