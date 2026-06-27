<script setup lang="ts">
/**
 * Register 页面 - 新野兽派风格
 *
 * 用户名 + 邮箱 + 密码 + 确认密码
 * 表单验证 + 错误提示
 * 注册成功后自动登录并跳转首页
 */
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { userApi } from '@/api/user'
import { useUserStore } from '@/stores/user'
import { useToast } from '@/composables/useToast'
import BrButton from '@/components/base/BrButton.vue'
import BrInput from '@/components/base/BrInput.vue'

const router = useRouter()
const userStore = useUserStore()
const { toast } = useToast()

// 表单数据
const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

// 错误信息
const errors = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

// 加载状态
const loading = ref(false)

// 是否可提交
const canSubmit = computed(() =>
  form.username.trim() &&
  form.email.trim() &&
  form.password &&
  form.confirmPassword &&
  !loading.value
)

/** 表单验证 */
function validate(): boolean {
  errors.username = ''
  errors.email = ''
  errors.password = ''
  errors.confirmPassword = ''

  // 用户名验证
  const username = form.username.trim()
  if (!username) {
    errors.username = '请输入用户名'
  } else if (username.length < 3 || username.length > 20) {
    errors.username = '用户名长度需为 3-20 字符'
  } else if (!/^[A-Za-z0-9_]+$/.test(username)) {
    errors.username = '只能包含字母、数字和下划线'
  }

  // 邮箱验证
  const email = form.email.trim()
  if (!email) {
    errors.email = '请输入邮箱'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = '邮箱格式不正确'
  }

  // 密码验证
  if (!form.password) {
    errors.password = '请输入密码'
  } else if (form.password.length < 6 || form.password.length > 32) {
    errors.password = '密码长度需为 6-32 字符'
  }

  // 确认密码
  if (!form.confirmPassword) {
    errors.confirmPassword = '请再次输入密码'
  } else if (form.confirmPassword !== form.password) {
    errors.confirmPassword = '两次输入的密码不一致'
  }

  return !errors.username && !errors.email && !errors.password && !errors.confirmPassword
}

/** 提交注册 */
async function handleRegister(): Promise<void> {
  if (!validate()) return

  loading.value = true
  try {
    const result = await userApi.register({
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
    })

    // 注册成功后自动登录
    userStore.handleLoginSuccess(result)
    toast.success(`欢迎加入，${result.user.username}！`)

    router.push({ name: 'home' })
  } catch (e) {
    console.error('[Register] 注册失败:', e)
  } finally {
    loading.value = false
  }
}

/** 跳转到登录页 */
function goLogin(): void {
  router.push({ name: 'login' })
}

/** 回到首页 */
function goHome(): void {
  router.push({ name: 'home' })
}
</script>

<template>
  <div class="auth-page">
    <!-- 左侧：品牌展示区 -->
    <aside class="auth-page__aside">
      <div class="auth-page__brand" @click="goHome">
        <div class="auth-page__logo">先</div>
        <h1 class="auth-page__brand-title">先别开工</h1>
        <p class="auth-page__brand-sub">AI 任务需求防返工扫描仪</p>
      </div>
      <div class="auth-page__slogan">
        <p class="auth-page__slogan-line">注册账号</p>
        <p class="auth-page__slogan-line auth-page__slogan-line--gold">解锁全部</p>
        <p class="auth-page__slogan-line">扫描能力</p>
      </div>
      <ul class="auth-page__features">
        <li class="auth-page__feature">— 无限次任务需求扫描</li>
        <li class="auth-page__feature">— 历史记录与收藏管理</li>
        <li class="auth-page__feature">— 风险报告一键分享</li>
      </ul>
      <div class="auth-page__decorations">
        <span class="auth-page__deco auth-page__deco--1">▲</span>
        <span class="auth-page__deco auth-page__deco--2">■</span>
      </div>
    </aside>

    <!-- 右侧：注册表单 -->
    <main class="auth-page__main">
      <div class="auth-card">
        <!-- 标题区 -->
        <div class="auth-card__header">
          <span class="auth-card__label">// REGISTER</span>
          <h2 class="auth-card__title">创建账号</h2>
          <p class="auth-card__desc">注册后即可享受完整功能</p>
        </div>

        <!-- 表单 -->
        <form class="auth-form" @submit.prevent="handleRegister">
          <!-- 用户名 -->
          <div class="auth-form__field">
            <label class="auth-form__label">用户名</label>
            <BrInput
              v-model="form.username"
              placeholder="3-20 位字母、数字、下划线"
              :error="errors.username"
              type="text"
              autocomplete="username"
            />
          </div>

          <!-- 邮箱 -->
          <div class="auth-form__field">
            <label class="auth-form__label">邮箱</label>
            <BrInput
              v-model="form.email"
              placeholder="your@email.com"
              :error="errors.email"
              type="text"
              autocomplete="email"
            />
          </div>

          <!-- 密码 -->
          <div class="auth-form__field">
            <label class="auth-form__label">密码</label>
            <BrInput
              v-model="form.password"
              placeholder="6-32 位密码"
              :error="errors.password"
              type="password"
              autocomplete="new-password"
            />
          </div>

          <!-- 确认密码 -->
          <div class="auth-form__field">
            <label class="auth-form__label">确认密码</label>
            <BrInput
              v-model="form.confirmPassword"
              placeholder="再次输入密码"
              :error="errors.confirmPassword"
              type="password"
              autocomplete="new-password"
            />
          </div>

          <!-- 提交按钮 -->
          <div class="auth-form__action">
            <BrButton
              variant="primary"
              :disabled="!canSubmit"
              :loading="loading"
              block
              @click="handleRegister"
            >
              {{ loading ? '注册中...' : '注 册' }}
            </BrButton>
          </div>

          <!-- 登录链接 -->
          <div class="auth-form__footer">
            <span class="auth-form__footer-text">已有账号？</span>
            <button type="button" class="auth-form__link" @click="goLogin">立即登录 →</button>
          </div>
        </form>
      </div>
    </main>
  </div>
</template>

<style scoped>
.auth-page {
  display: flex;
  min-height: calc(100vh - 64px - 64px);
  background: var(--color-cream);
}

/* ===== 左侧品牌展示区 ===== */
.auth-page__aside {
  width: 45%;
  background: var(--color-black);
  color: var(--color-gold);
  padding: var(--space-4xl) var(--space-3xl);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
  border-right: var(--border-width-heavy) solid var(--color-gold);
}

.auth-page__brand {
  cursor: pointer;
}

.auth-page__logo {
  width: 64px;
  height: 64px;
  background: var(--color-gold);
  color: var(--color-black);
  font-family: var(--font-title);
  font-size: 36px;
  font-weight: var(--fw-black);
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(-4deg);
  margin-bottom: var(--space-lg);
}

.auth-page__brand-title {
  font-family: var(--font-title);
  font-size: 48px;
  font-weight: var(--fw-black);
  color: var(--color-gold);
  letter-spacing: -1.5px;
  line-height: 1;
  margin: 0;
}

.auth-page__brand-sub {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-gold);
  letter-spacing: var(--ls-label);
  opacity: 0.7;
  margin-top: 8px;
}

/* Slogan 区域 */
.auth-page__slogan {
  margin-top: var(--space-3xl);
}

.auth-page__slogan-line {
  font-family: var(--font-title);
  font-size: 56px;
  font-weight: var(--fw-black);
  color: var(--color-cream);
  letter-spacing: -2px;
  line-height: 1;
  margin: 0;
}

.auth-page__slogan-line--gold {
  color: var(--color-gold);
  transform: skewX(-5deg);
  display: inline-block;
}

/* 特性列表 */
.auth-page__features {
  list-style: none;
  padding: 0;
  margin: var(--space-2xl) 0 0;
}

.auth-page__feature {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-gold);
  letter-spacing: var(--ls-label);
  opacity: 0.8;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 215, 0, 0.15);
}

.auth-page__feature:last-child {
  border-bottom: none;
}

/* 装饰元素 */
.auth-page__decorations {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.auth-page__deco {
  position: absolute;
  color: var(--color-gold);
  opacity: 0.15;
}

.auth-page__deco--1 {
  top: 15%;
  right: 8%;
  font-size: 100px;
  transform: rotate(20deg);
}

.auth-page__deco--2 {
  bottom: 20%;
  right: 25%;
  font-size: 60px;
}

/* ===== 右侧表单区 ===== */
.auth-page__main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-3xl) var(--space-2xl);
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background: var(--color-white);
  border: var(--border-width-heavy) solid var(--color-black);
  box-shadow: var(--shadow-xl);
  padding: var(--space-2xl);
}

.auth-card__header {
  margin-bottom: var(--space-xl);
}

.auth-card__label {
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  color: var(--color-gold-dark);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
}

.auth-card__title {
  font-family: var(--font-title);
  font-size: 36px;
  font-weight: var(--fw-black);
  color: var(--color-black);
  letter-spacing: -1px;
  line-height: 1;
  margin: 8px 0 6px;
}

.auth-card__desc {
  font-family: var(--font-body);
  font-size: var(--fs-body);
  color: var(--color-gray-2);
  margin: 0;
}

/* ===== 表单 ===== */
.auth-form__field {
  margin-bottom: var(--space-md);
}

.auth-form__label {
  display: block;
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  color: var(--color-black);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
  margin-bottom: 8px;
}

.auth-form__action {
  margin-top: var(--space-lg);
}

.auth-form__footer {
  margin-top: var(--space-md);
  padding-top: var(--space-md);
  border-top: var(--border-width-thin) solid var(--color-gray-4);
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.auth-form__footer-text {
  font-family: var(--font-body);
  font-size: var(--fs-body);
  color: var(--color-gray-2);
}

.auth-form__link {
  font-family: var(--font-mono);
  font-size: var(--fs-body);
  font-weight: var(--fw-bold);
  color: var(--color-black);
  background: none;
  border: none;
  border-bottom: var(--border-width-thin) solid var(--color-gold);
  cursor: pointer;
  padding: 2px 0;
  transition: all var(--transition-fast);
}

.auth-form__link:hover {
  color: var(--color-gold-dark);
  background: var(--color-gold);
  padding: 2px 6px;
}

/* ===== 响应式（S12 断点对齐 1199/767）=====
 * 桌面端：两栏（左侧品牌 45% + 右侧表单 1fr），卡片 max-width 420px
 * 平板端：保留两栏但品牌区收窄，表单卡片稍窄
 * 移动端：单列堆叠（品牌在上，表单在下），卡片全宽，边距收窄
 */
@media (max-width: 1199px) {
  /* 平板：品牌区收窄，slogan 略缩 */
  .auth-page__aside {
    width: 40%;
    padding: var(--space-3xl) var(--space-xl);
  }
  .auth-page__slogan-line {
    font-size: 44px;
  }
  .auth-page__main {
    padding: var(--space-2xl) var(--space-xl);
  }
  .auth-card {
    max-width: 380px;
  }
}

@media (max-width: 767px) {
  /* 移动：单列堆叠 */
  .auth-page {
    flex-direction: column;
  }
  .auth-page__aside {
    width: 100%;
    padding: var(--space-xl) var(--container-px);
    border-right: none;
    border-bottom: var(--border-width-heavy) solid var(--color-gold);
  }
  /* 移动端 slogan 进一步缩小，但保持视觉冲击力 */
  .auth-page__slogan-line {
    font-size: 32px;
  }
  .auth-page__slogan {
    margin-top: var(--space-xl);
  }
  /* 装饰元素移动端隐藏，避免干扰 */
  .auth-page__decorations {
    display: none;
  }
  .auth-page__main {
    padding: var(--space-xl) var(--container-px);
  }
  /* 移动端卡片全宽，仅保留极小边距 */
  .auth-card {
    max-width: none;
    padding: var(--space-xl);
  }
  .auth-card__title {
    font-size: 28px;
  }
}
</style>
