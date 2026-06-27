<script setup lang="ts">
/**
 * 组件展示页 - 新野兽派基础组件库验证
 * 路由：/components
 *
 * 展示所有 10 个基础组件的各变体和交互效果
 */
import { ref } from 'vue'
import BrButton from '@/components/base/BrButton.vue'
import BrCard from '@/components/base/BrCard.vue'
import BrInput from '@/components/base/BrInput.vue'
import BrTag from '@/components/base/BrTag.vue'
import BrModal from '@/components/base/BrModal.vue'
import BrProgress from '@/components/base/BrProgress.vue'
import BrTabs from '@/components/base/BrTabs.vue'
import BrTabPane from '@/components/base/BrTabPane.vue'
import BrCollapse from '@/components/base/BrCollapse.vue'
import BrCollapseItem from '@/components/base/BrCollapseItem.vue'
import BrCopyButton from '@/components/base/BrCopyButton.vue'
import { useToast } from '@/composables/useToast'

const { toast } = useToast()

// ===== Button 示例 =====
function onButtonClick(msg: string): void {
  toast.info(msg)
}

// ===== Input 示例 =====
const inputValue = ref('')
const textareaValue = ref('')

// ===== Modal 示例 =====
const modalVisible = ref(false)

// ===== Progress 示例 =====
const progressValue = ref(35)
function addProgress(): void {
  progressValue.value = Math.min(100, progressValue.value + 15)
}

// ===== Tabs 示例 =====
const activeTab = ref('overview')

// ===== Collapse 示例 =====
const activeCollapse = ref<(string | number)[]>(['item1'])
</script>

<template>
  <div class="components-page">
    <!-- 页头 -->
    <header class="page-header">
      <div class="container">
        <div class="header-inner">
          <div class="brand">
            <div class="brand-mark">先</div>
            <div class="brand-text">
              <h1 class="brand-name">先别开工</h1>
              <p class="brand-sub">NEO-BRUTALIST COMPONENT GALLERY</p>
            </div>
          </div>
          <div class="meta">
            <span class="meta-item">S02 / DESIGN SYSTEM</span>
            <span class="meta-item">v1.0</span>
          </div>
        </div>
        <div class="header-divider"></div>
        <nav class="quick-nav">
          <a href="#sec-button">01 / BUTTON</a>
          <a href="#sec-card">02 / CARD</a>
          <a href="#sec-input">03 / INPUT</a>
          <a href="#sec-tag">04 / TAG</a>
          <a href="#sec-modal">05 / MODAL</a>
          <a href="#sec-toast">06 / TOAST</a>
          <a href="#sec-progress">07 / PROGRESS</a>
          <a href="#sec-tabs">08 / TABS</a>
          <a href="#sec-collapse">09 / COLLAPSE</a>
          <a href="#sec-copy">10 / COPY</a>
        </nav>
      </div>
    </header>

    <main class="container main-content">
      <!-- 01 Button -->
      <section id="sec-button" class="section">
        <div class="section-head">
          <span class="section-num">01</span>
          <h2 class="section-title">Button</h2>
          <span class="section-desc">按钮组件 · 4 种变体 · 3 种尺寸</span>
        </div>
        <div class="demo-block">
          <div class="demo-row">
            <span class="demo-label">VARIANT</span>
            <div class="demo-items">
              <BrButton variant="primary" @click="onButtonClick('primary 按钮')">Primary</BrButton>
              <BrButton variant="secondary" @click="onButtonClick('secondary 按钮')">Secondary</BrButton>
              <BrButton variant="outline" @click="onButtonClick('outline 按钮')">Outline</BrButton>
              <BrButton variant="tag" @click="onButtonClick('tag 按钮')">Tag</BrButton>
            </div>
          </div>
          <div class="demo-row">
            <span class="demo-label">SIZE</span>
            <div class="demo-items">
              <BrButton size="sm" variant="primary">Small</BrButton>
              <BrButton size="md" variant="primary">Medium</BrButton>
              <BrButton size="lg" variant="primary">Large</BrButton>
            </div>
          </div>
          <div class="demo-row">
            <span class="demo-label">STATE</span>
            <div class="demo-items">
              <BrButton disabled variant="primary">Disabled</BrButton>
              <BrButton block variant="secondary">Block Button</BrButton>
            </div>
          </div>
        </div>
      </section>

      <!-- 02 Card -->
      <section id="sec-card" class="section">
        <div class="section-head">
          <span class="section-num">02</span>
          <h2 class="section-title">Card</h2>
          <span class="section-desc">卡片组件 · 3 种变体 · Hover 效果</span>
        </div>
        <div class="demo-block">
          <div class="card-grid">
            <BrCard variant="default">
              <h3 class="card-demo-title">Default Card</h3>
              <p class="card-demo-text">白背景，3px 黑色边框。用于常规内容展示。</p>
            </BrCard>
            <BrCard variant="dark">
              <h3 class="card-demo-title">Dark Card</h3>
              <p class="card-demo-text">深黑背景，金色文字。用于分数展示等强调场景。</p>
            </BrCard>
            <BrCard variant="data" hoverable>
              <span class="card-demo-label">DATA CARD</span>
              <p class="card-demo-num">82</p>
              <p class="card-demo-text">hover 金色背景 + 偏移 + 硬阴影</p>
            </BrCard>
          </div>
          <div class="demo-row mt-md">
            <span class="demo-label">WITH SLOTS</span>
            <div class="demo-items" style="flex:1">
              <BrCard variant="default" style="max-width: 480px">
                <template #header>
                  <span class="card-demo-label">HEADER SLOT</span>
                </template>
                <p class="card-demo-text">这是卡片正文内容，通过 default slot 插入。</p>
                <template #footer>
                  <span class="card-demo-label">FOOTER SLOT</span>
                </template>
              </BrCard>
            </div>
          </div>
        </div>
      </section>

      <!-- 03 Input -->
      <section id="sec-input" class="section">
        <div class="section-head">
          <span class="section-num">03</span>
          <h2 class="section-title">Input</h2>
          <span class="section-desc">输入框 · text / textarea · focus 金色边框</span>
        </div>
        <div class="demo-block">
          <div class="input-grid">
            <div>
              <span class="demo-label">TEXT INPUT</span>
              <div class="mt-xs">
                <BrInput v-model="inputValue" placeholder="请输入任务描述..." />
              </div>
              <p class="input-preview">值：{{ inputValue || '(空)' }}</p>
            </div>
            <div>
              <span class="demo-label">TEXTAREA</span>
              <div class="mt-xs">
                <BrInput type="textarea" v-model="textareaValue" placeholder="粘贴任务说明..." :rows="4" />
              </div>
              <p class="input-preview">字数：{{ textareaValue.length }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 04 Tag -->
      <section id="sec-tag" class="section">
        <div class="section-head">
          <span class="section-num">04</span>
          <h2 class="section-title">Tag</h2>
          <span class="section-desc">标签 · 5 种变体 · 全大写 JetBrains Mono</span>
        </div>
        <div class="demo-block">
          <div class="demo-items">
            <BrTag variant="default">DEFAULT</BrTag>
            <BrTag variant="gold">GOLD</BrTag>
            <BrTag variant="high">HIGH RISK</BrTag>
            <BrTag variant="mid">MID RISK</BrTag>
            <BrTag variant="low">LOW RISK</BrTag>
          </div>
        </div>
      </section>

      <!-- 05 Modal -->
      <section id="sec-modal" class="section">
        <div class="section-head">
          <span class="section-num">05</span>
          <h2 class="section-title">Modal</h2>
          <span class="section-desc">模态框 · 粗边框 · 硬阴影</span>
        </div>
        <div class="demo-block">
          <BrButton variant="primary" @click="modalVisible = true">打开 Modal</BrButton>
          <BrModal v-model="modalVisible" title="确认操作" width="480px">
            <p style="line-height: 1.9; margin-bottom: 16px;">
              这是一个新野兽派风格的模态框。黑色粗边框、硬阴影、直角设计。
            </p>
            <p style="color: var(--color-gray-2); font-size: var(--fs-caption);">
              点击遮罩层或右上角关闭按钮可关闭。
            </p>
            <template #footer>
              <BrButton variant="outline" size="sm" @click="modalVisible = false">取消</BrButton>
              <BrButton variant="primary" size="sm" @click="modalVisible = false; toast.success('已确认')">确认</BrButton>
            </template>
          </BrModal>
        </div>
      </section>

      <!-- 06 Toast -->
      <section id="sec-toast" class="section">
        <div class="section-head">
          <span class="section-num">06</span>
          <h2 class="section-title">Toast</h2>
          <span class="section-desc">通知提示 · 4 种类型 · 右上角弹出</span>
        </div>
        <div class="demo-block">
          <div class="demo-items">
            <BrButton variant="secondary" size="sm" @click="toast.success('操作成功完成')">Success</BrButton>
            <BrButton variant="secondary" size="sm" @click="toast.error('操作失败，请重试')">Error</BrButton>
            <BrButton variant="secondary" size="sm" @click="toast.info('这是一条信息提示')">Info</BrButton>
            <BrButton variant="secondary" size="sm" @click="toast.warning('请注意潜在风险')">Warning</BrButton>
          </div>
        </div>
      </section>

      <!-- 07 Progress -->
      <section id="sec-progress" class="section">
        <div class="section-head">
          <span class="section-num">07</span>
          <h2 class="section-title">Progress</h2>
          <span class="section-desc">进度条 · 3 种变体 · 直角硬阴影</span>
        </div>
        <div class="demo-block">
          <div class="progress-demo">
            <div class="progress-row">
              <span class="demo-label">DEFAULT</span>
              <BrProgress :percent="progressValue" variant="default" />
            </div>
            <div class="progress-row">
              <span class="demo-label">GOLD</span>
              <BrProgress :percent="progressValue" variant="gold" />
            </div>
            <div class="progress-row">
              <span class="demo-label">DARK</span>
              <BrProgress :percent="progressValue" variant="dark" />
            </div>
            <div class="progress-row">
              <span class="demo-label">VALUE</span>
              <span class="progress-value">{{ progressValue }}%</span>
              <BrButton variant="tag" size="sm" @click="addProgress">+15</BrButton>
            </div>
          </div>
        </div>
      </section>

      <!-- 08 Tabs -->
      <section id="sec-tabs" class="section">
        <div class="section-head">
          <span class="section-num">08</span>
          <h2 class="section-title">Tabs</h2>
          <span class="section-desc">标签页 · 活动项金色斜切 · 粗边框分隔</span>
        </div>
        <div class="demo-block">
          <BrTabs v-model="activeTab">
            <BrTabPane label="概览" name="overview">
              <p class="tab-demo-text">这是「概览」标签页的内容。活动标签有金色背景和 -5° 斜切效果。</p>
            </BrTabPane>
            <BrTabPane label="详情" name="detail">
              <p class="tab-demo-text">这是「详情」标签页的内容。底部有粗黑边框分隔。</p>
            </BrTabPane>
            <BrTabPane label="设置" name="settings">
              <p class="tab-demo-text">这是「设置」标签页的内容。点击标签可切换。</p>
            </BrTabPane>
          </BrTabs>
          <p class="input-preview mt-md">当前激活：{{ activeTab }}</p>
        </div>
      </section>

      <!-- 09 Collapse -->
      <section id="sec-collapse" class="section">
        <div class="section-head">
          <span class="section-num">09</span>
          <h2 class="section-title">Collapse</h2>
          <span class="section-desc">折叠面板 · 多选展开 · hover 金色背景</span>
        </div>
        <div class="demo-block">
          <BrCollapse v-model="activeCollapse">
            <BrCollapseItem title="什么是防返工扫描？" name="item1">
              <p>《先别开工》通过 AI 分析任务描述，识别模糊词、评估返工风险、生成追问清单和开工路线，帮助你在开工前对齐需求。</p>
            </BrCollapseItem>
            <BrCollapseItem title="支持哪些身份？" name="item2">
              <p>支持 6 种身份：学生、实习生、开发者、设计师、产品/运营、项目负责人。不同身份会生成不同语气的确认话术。</p>
            </BrCollapseItem>
            <BrCollapseItem title="如何使用？" name="item3">
              <p>选择身份 → 粘贴任务说明 → 点击开始扫描 → 查看风险报告和追问清单 → 复制确认话术发给需求方。</p>
            </BrCollapseItem>
          </BrCollapse>
          <p class="input-preview mt-md">已展开：{{ activeCollapse.join(', ') }}</p>
        </div>
      </section>

      <!-- 10 CopyButton -->
      <section id="sec-copy" class="section">
        <div class="section-head">
          <span class="section-num">10</span>
          <h2 class="section-title">CopyButton</h2>
          <span class="section-desc">复制按钮 · tag 风格 · 成功反馈</span>
        </div>
        <div class="demo-block">
          <div class="demo-items">
            <BrCopyButton text="这是要复制的文本内容" label="复制文本" />
            <BrCopyButton text="const result = scan(taskText)" label="复制代码" />
            <BrCopyButton text="" label="空内容" />
          </div>
        </div>
      </section>
    </main>

    <!-- 页脚 -->
    <footer class="page-footer">
      <div class="container">
        <div class="footer-divider"></div>
        <div class="footer-inner">
          <span>先别开工 · NEO-BRUTALIST DESIGN SYSTEM</span>
          <span>S02 / COMPONENT GALLERY · 10 COMPONENTS</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.components-page {
  min-height: 100vh;
  background: var(--color-cream);
}

/* ===== 页头 ===== */
.page-header {
  background: var(--color-cream);
  padding-top: var(--space-4xl);
  padding-bottom: var(--space-xl);
}

.header-inner {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-lg);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.brand-mark {
  width: 64px;
  height: 64px;
  background: var(--color-black);
  color: var(--color-gold);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-title);
  font-size: 32px;
  transform: rotate(-4deg);
  flex-shrink: 0;
}

.brand-name {
  font-family: var(--font-title);
  font-size: 56px;
  line-height: var(--lh-tight);
  letter-spacing: var(--ls-title);
  color: var(--color-black);
}

.brand-sub {
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  letter-spacing: var(--ls-label);
  color: var(--color-gray-2);
  text-transform: uppercase;
  margin-top: var(--space-xs);
}

.meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-xs);
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  letter-spacing: var(--ls-label);
  color: var(--color-gray-2);
  text-transform: uppercase;
}

.header-divider {
  height: var(--border-width-thick);
  background: var(--color-black);
  margin: var(--space-xl) 0 var(--space-md);
}

.quick-nav {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
}

.quick-nav a {
  padding: 4px 8px;
  border: var(--border-width-thin) solid var(--color-black);
  color: var(--color-black);
  transition: all var(--transition-fast);
}

.quick-nav a:hover {
  background: var(--color-gold);
}

/* ===== 主内容 ===== */
.main-content {
  padding-top: var(--space-3xl);
  padding-bottom: var(--space-5xl);
}

.section {
  margin-bottom: var(--space-3xl);
}

.section-head {
  display: flex;
  align-items: baseline;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-sm);
  border-bottom: var(--border-width-thin) solid var(--color-black);
}

.section-num {
  font-family: var(--font-title);
  font-size: var(--fs-num-md);
  color: var(--color-gray-4);
  line-height: 1;
}

.section-title {
  font-family: var(--font-title);
  font-size: var(--fs-h2);
  color: var(--color-black);
  line-height: var(--lh-normal);
}

.section-desc {
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  letter-spacing: var(--ls-label);
  color: var(--color-gray-2);
  text-transform: uppercase;
}

/* ===== Demo Block ===== */
.demo-block {
  background: var(--color-white);
  border: var(--border-width-thick) solid var(--color-black);
  padding: var(--space-xl);
}

.demo-row {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  margin-bottom: var(--space-md);
}

.demo-row:last-child {
  margin-bottom: 0;
}

.demo-label {
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  letter-spacing: var(--ls-label);
  color: var(--color-black);
  text-transform: uppercase;
  min-width: 72px;
  flex-shrink: 0;
}

.demo-items {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

/* ===== Card Demo ===== */
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-lg);
}

.card-demo-title {
  font-family: var(--font-body);
  font-size: var(--fs-h3);
  font-weight: var(--fw-bold);
  margin-bottom: var(--space-xs);
}

.card-demo-text {
  font-size: var(--fs-caption);
  color: var(--color-gray-3);
  line-height: var(--lh-caption);
}

.card-demo-label {
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
}

.card-demo-num {
  font-family: var(--font-title);
  font-size: var(--fs-num-md);
  line-height: 1;
  margin: var(--space-xs) 0;
}

/* ===== Input Demo ===== */
.input-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-lg);
}

.input-preview {
  margin-top: var(--space-xs);
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  color: var(--color-gray-2);
}

/* ===== Progress Demo ===== */
.progress-demo {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.progress-row {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.progress-row .demo-label {
  min-width: 72px;
}

.progress-row .br-progress {
  flex: 1;
}

.progress-value {
  font-family: var(--font-mono);
  font-size: var(--fs-caption);
  font-weight: var(--fw-bold);
  min-width: 48px;
}

/* ===== Tabs Demo ===== */
.tab-demo-text {
  line-height: var(--lh-body);
  color: var(--color-gray-3);
}

/* ===== 页脚 ===== */
.page-footer {
  padding-bottom: var(--space-xl);
}

.footer-divider {
  height: var(--border-width-thick);
  background: var(--color-black);
  margin-bottom: var(--space-md);
}

.footer-inner {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-sm);
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: var(--ls-footer);
  color: var(--color-gray-2);
  text-transform: uppercase;
}

/* ===== 响应式 ===== */
@media (max-width: 900px) {
  .card-grid,
  .input-grid {
    grid-template-columns: 1fr;
  }
  .brand-name {
    font-size: 40px;
  }
  .quick-nav {
    font-size: 8px;
  }
}
</style>
