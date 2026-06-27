<script setup lang="ts">
/**
 * Profile 页面 - 新野兽派风格
 *
 * 用户基本信息展示 + 使用统计 + 修改密码
 * 需登录访问（路由守卫保护）
 */
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { userApi } from '@/api/user'
import { useToast } from '@/composables/useToast'
import type { UserStats } from '@/types/user'
import BrButton from '@/components/base/BrButton.vue'
import BrInput from '@/components/base/BrInput.vue'
import StatsCard from '@/components/business/StatsCard.vue'

const router = useRouter()
const userStore = useUserStore()
const { toast } = useToast()

// 加载状态
const loadingProfile = ref(true)
const loadingStats = ref(true)
const savingPassword = ref(false)

// 统计数据
const stats = ref<UserStats | null>(null)

// 修改密码表单
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// 密码错误
const passwordErrors = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// 用户信息
const userInfo = computed(() => userStore.userInfo)

// 格式化日期
function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

// 加载用户信息
async function loadProfile(): Promise<void> {
  loadingProfile.value = true
  try {
    await userStore.fetchProfile()
  } catch (e) {
    console.error('[Profile] 加载用户信息失败:', e)
  } finally {
    loadingProfile.value = false
  }
}

// 加载统计数据
async function loadStats(): Promise<void> {
  loadingStats.value = true
  try {
    stats.value = await userStore.fetchStats()
  } catch (e) {
    console.error('[Profile] 加载统计数据失败:', e)
  } finally {
    loadingStats.value = false
  }
}

// 验证修改密码表单
function validatePassword(): boolean {
  passwordErrors.oldPassword = ''
  passwordErrors.newPassword = ''
  passwordErrors.confirmPassword = ''

  if (!passwordForm.oldPassword) {
    passwordErrors.oldPassword = '请输入旧密码'
  }

  if (!passwordForm.newPassword) {
    passwordErrors.newPassword = '请输入新密码'
  } else if (passwordForm.newPassword.length < 6 || passwordForm.newPassword.length > 32) {
    passwordErrors.newPassword = '密码长度需为 6-32 字符'
  }

  if (!passwordForm.confirmPassword) {
    passwordErrors.confirmPassword = '请确认新密码'
  } else if (passwordForm.confirmPassword !== passwordForm.newPassword) {
    passwordErrors.confirmPassword = '两次输入的密码不一致'
  }

  return !passwordErrors.oldPassword && !passwordErrors.newPassword && !passwordErrors.confirmPassword
}

// 提交修改密码
async function handleChangePassword(): Promise<void> {
  if (!validatePassword()) return

  savingPassword.value = true
  try {
    await userApi.changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    })

    toast.success('密码修改成功')
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (e) {
    console.error('[Profile] 修改密码失败:', e)
  } finally {
    savingPassword.value = false
  }
}

// 退出登录
function handleLogout(): void {
  userStore.logout()
  toast.success('已退出登录')
  router.push({ name: 'home' })
}

onMounted(() => {
  loadProfile()
  loadStats()
})
</script>

<template>
  <div class="profile-page">
    <!-- 页面标题 -->
    <div class="profile-page__header">
      <span class="profile-page__breadcrumb">// PROFILE</span>
      <h1 class="profile-page__title">个人中心</h1>
    </div>

    <!-- 主内容区 -->
    <div class="profile-page__body">
      <!-- ===== 左栏：用户信息卡 ===== -->
      <section class="profile-section profile-section--user">
        <div class="profile-card profile-card--dark">
          <div class="profile-card__header">
            <span class="profile-card__label">USER INFO</span>
          </div>

          <!-- 加载中 -->
          <div v-if="loadingProfile" class="profile-card__loading">
            <span class="profile-card__loading-text">加载中...</span>
          </div>

          <!-- 用户信息 -->
          <div v-else-if="userInfo" class="profile-user">
            <!-- 头像 -->
            <div class="profile-user__avatar">
              {{ userInfo.username.charAt(0).toUpperCase() }}
            </div>

            <!-- 用户名 -->
            <h2 class="profile-user__name">{{ userInfo.username }}</h2>

            <!-- 邮箱 -->
            <div class="profile-user__row">
              <span class="profile-user__row-label">EMAIL</span>
              <span class="profile-user__row-value">{{ userInfo.email }}</span>
            </div>

            <!-- 注册时间 -->
            <div class="profile-user__row">
              <span class="profile-user__row-label">JOINED</span>
              <span class="profile-user__row-value">{{ formatDate(userInfo.createdAt) }}</span>
            </div>

            <!-- 退出按钮 -->
            <div class="profile-user__action">
              <BrButton variant="secondary" block @click="handleLogout">退出登录</BrButton>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== 右栏：统计 + 修改密码 ===== -->
      <div class="profile-page__right">
        <!-- 统计数据 -->
        <section class="profile-section">
          <div class="profile-card">
            <div class="profile-card__header">
              <span class="profile-card__label">// STATISTICS</span>
              <h3 class="profile-card__title">使用统计</h3>
            </div>

            <div v-if="loadingStats" class="profile-card__loading">
              <span class="profile-card__loading-text">加载中...</span>
            </div>

            <div v-else-if="stats" class="profile-stats">
              <!-- 2x2 统计卡片网格 -->
              <div class="profile-stats__grid">
                <StatsCard
                  label="TOTAL SCANS"
                  :value="stats.totalScans"
                  icon="S"
                  variant="highlight"
                />
                <StatsCard
                  label="FAVORITES"
                  :value="stats.favoriteCount"
                  icon="★"
                />
                <StatsCard
                  label="AVG SCORE"
                  :value="stats.avgScore || '—'"
                  icon="#"
                />
                <StatsCard
                  label="THIS MONTH"
                  :value="stats.monthScans"
                  icon="M"
                  variant="dark"
                />
              </div>

              <!-- 风险分布 -->
              <div class="profile-stats__risks">
                <span class="profile-stats__risk-label">RISK DISTRIBUTION</span>
                <div class="profile-stats__risk-bars">
                  <div class="profile-stats__risk-bar">
                    <span class="profile-stats__risk-tag profile-stats__risk-tag--high">HIGH</span>
                    <span class="profile-stats__risk-count">{{ stats.highRiskCount }}</span>
                  </div>
                  <div class="profile-stats__risk-bar">
                    <span class="profile-stats__risk-tag profile-stats__risk-tag--mid">MID</span>
                    <span class="profile-stats__risk-count">{{ stats.midRiskCount }}</span>
                  </div>
                  <div class="profile-stats__risk-bar">
                    <span class="profile-stats__risk-tag profile-stats__risk-tag--low">LOW</span>
                    <span class="profile-stats__risk-count">{{ stats.lowRiskCount }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 修改密码 -->
        <section class="profile-section">
          <div class="profile-card">
            <div class="profile-card__header">
              <span class="profile-card__label">// SECURITY</span>
              <h3 class="profile-card__title">修改密码</h3>
            </div>

            <form class="profile-form" @submit.prevent="handleChangePassword">
              <!-- 旧密码 -->
              <div class="profile-form__field">
                <label class="profile-form__label">旧密码</label>
                <BrInput
                  v-model="passwordForm.oldPassword"
                  type="password"
                  placeholder="输入当前密码"
                  :error="passwordErrors.oldPassword"
                  autocomplete="current-password"
                />
              </div>

              <!-- 新密码 -->
              <div class="profile-form__field">
                <label class="profile-form__label">新密码</label>
                <BrInput
                  v-model="passwordForm.newPassword"
                  type="password"
                  placeholder="6-32 位新密码"
                  :error="passwordErrors.newPassword"
                  autocomplete="new-password"
                />
              </div>

              <!-- 确认新密码 -->
              <div class="profile-form__field">
                <label class="profile-form__label">确认新密码</label>
                <BrInput
                  v-model="passwordForm.confirmPassword"
                  type="password"
                  placeholder="再次输入新密码"
                  :error="passwordErrors.confirmPassword"
                  autocomplete="new-password"
                />
              </div>

              <div class="profile-form__action">
                <BrButton
                  variant="primary"
                  :loading="savingPassword"
                  block
                  @click="handleChangePassword"
                >
                  {{ savingPassword ? '保存中...' : '保存修改' }}
                </BrButton>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  padding: var(--space-xl) 0;
}

/* ===== 页面标题 ===== */
.profile-page__header {
  margin-bottom: var(--space-xl);
}

.profile-page__breadcrumb {
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  color: var(--color-gold-dark);
  letter-spacing: var(--ls-label);
}

.profile-page__title {
  font-family: var(--font-title);
  font-size: var(--fs-h2);
  font-weight: var(--fw-black);
  color: var(--color-black);
  letter-spacing: var(--ls-h2);
  line-height: var(--lh-normal);
  margin: 8px 0 0;
}

/* ===== 主内容区 ===== */
.profile-page__body {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: var(--space-xl);
  align-items: start;
}

.profile-page__right {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

/* ===== 通用卡片 ===== */
.profile-card {
  background: var(--color-white);
  border: var(--border-width-heavy) solid var(--color-black);
  box-shadow: var(--shadow-md);
  padding: var(--space-lg);
}

.profile-card--dark {
  background: var(--color-black);
  color: var(--color-gold);
}

.profile-card__header {
  margin-bottom: var(--space-md);
  padding-bottom: var(--space-sm);
  border-bottom: var(--border-width-thin) solid var(--color-black);
}

.profile-card--dark .profile-card__header {
  border-bottom-color: var(--color-gold);
}

.profile-card__label {
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  color: var(--color-gold-dark);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
}

.profile-card--dark .profile-card__label {
  color: var(--color-gold);
}

.profile-card__title {
  font-family: var(--font-title);
  font-size: 20px;
  font-weight: var(--fw-black);
  color: var(--color-black);
  letter-spacing: -0.5px;
  line-height: 1;
  margin: 6px 0 0;
}

/* 加载中 */
.profile-card__loading {
  padding: var(--space-xl) 0;
  text-align: center;
}

.profile-card__loading-text {
  font-family: var(--font-mono);
  font-size: var(--fs-caption);
  color: var(--color-gray-1);
  letter-spacing: var(--ls-label);
}

/* ===== 用户信息卡 ===== */
.profile-user {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.profile-user__avatar {
  width: 80px;
  height: 80px;
  background: var(--color-gold);
  color: var(--color-black);
  font-family: var(--font-title);
  font-size: 40px;
  font-weight: var(--fw-black);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-md);
  transform: rotate(-4deg);
}

.profile-user__name {
  font-family: var(--font-title);
  font-size: 24px;
  font-weight: var(--fw-black);
  color: var(--color-gold);
  letter-spacing: -0.5px;
  line-height: 1;
  margin: 0 0 var(--space-lg);
}

.profile-user__row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  padding: var(--space-xs) 0;
  border-bottom: 1px solid rgba(255, 215, 0, 0.15);
}

.profile-user__row:last-of-type {
  border-bottom: none;
  margin-bottom: var(--space-md);
}

.profile-user__row-label {
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  color: var(--color-gold);
  letter-spacing: var(--ls-label);
  opacity: 0.6;
}

.profile-user__row-value {
  font-family: var(--font-body);
  font-size: var(--fs-body);
  color: var(--color-cream);
  margin-top: 2px;
  word-break: break-all;
}

.profile-user__action {
  width: 100%;
  margin-top: var(--space-md);
}

/* ===== 统计区 ===== */
.profile-stats {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

/* 2x2 统计卡片网格 */
.profile-stats__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
}

/* 风险分布 */
.profile-stats__risks {
  border-top: var(--border-width-thin) solid var(--color-black);
  padding-top: var(--space-sm);
}

.profile-stats__risk-label {
  display: block;
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  color: var(--color-gray-2);
  letter-spacing: var(--ls-label);
  margin-bottom: var(--space-xs);
}

.profile-stats__risk-bars {
  display: flex;
  gap: var(--space-sm);
}

.profile-stats__risk-bar {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border: var(--border-width-thin) solid var(--color-black);
  background: var(--color-white);
}

.profile-stats__risk-tag {
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  letter-spacing: var(--ls-label);
  padding: 2px 6px;
}

.profile-stats__risk-tag--high {
  background: var(--color-risk-high);
  color: var(--color-white);
}

.profile-stats__risk-tag--mid {
  background: var(--color-risk-mid);
  color: var(--color-black);
}

.profile-stats__risk-tag--low {
  background: var(--color-risk-low);
  color: var(--color-white);
}

.profile-stats__risk-count {
  font-family: var(--font-title);
  font-size: 18px;
  font-weight: var(--fw-black);
  color: var(--color-black);
}

/* ===== 修改密码表单 ===== */
.profile-form__field {
  margin-bottom: var(--space-md);
}

.profile-form__label {
  display: block;
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  color: var(--color-black);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
  margin-bottom: 6px;
}

.profile-form__action {
  margin-top: var(--space-lg);
}

/* ===== 响应式（S12 断点对齐 1199/767）=====
 * 桌面端：两栏（320px 左侧用户卡 + 1fr 右侧统计/密码）
 * 平板端：上下布局（单列堆叠，统计卡保持 2x2）
 * 移动端：单列，统计卡保持 2x2（卡片紧凑可读），风险分布条堆叠
 */
@media (max-width: 1199px) {
  /* 平板：用户卡与右侧内容上下堆叠 */
  .profile-page__body {
    grid-template-columns: 1fr;
  }
  /* 用户卡横向铺满后，内部信息可水平排布以利用宽度 */
  .profile-user {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-start;
    text-align: left;
    gap: var(--space-md);
  }
  .profile-user__avatar {
    margin-bottom: 0;
  }
  .profile-user__name {
    margin: 0;
    flex: 1;
  }
  .profile-user__row {
    flex: 1 1 45%;
  }
  .profile-user__action {
    flex: 1 1 100%;
    margin-top: 0;
  }
}

@media (max-width: 767px) {
  /* 移动：用户卡内部回到垂直堆叠，保证可读性 */
  .profile-user {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: var(--space-sm);
  }
  .profile-user__avatar {
    margin-bottom: var(--space-sm);
  }
  .profile-user__name {
    margin: 0 0 var(--space-sm);
    font-size: 20px;
  }
  .profile-user__row {
    flex: none;
    width: 100%;
  }
  .profile-user__action {
    flex: none;
    width: 100%;
    margin-top: var(--space-sm);
  }
  /* 统计卡保持 2x2（卡片紧凑，移动端仍可读） */
  .profile-stats__grid {
    gap: var(--space-sm);
  }
  /* 风险分布条移动端堆叠，避免拥挤 */
  .profile-stats__risk-bars {
    flex-direction: column;
  }
  /* 标题在移动端略缩小 */
  .profile-page__title {
    font-size: 28px;
  }
  .profile-card__title {
    font-size: 18px;
  }
}
</style>
