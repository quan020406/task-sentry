<script setup lang="ts">
/**
 * Home 页面 - 新野兽派风格首页
 *
 * 包含：Hero 区域、产品特点、典型场景、使用流程
 */
import { useRouter } from 'vue-router'
import { useScanStore, EXAMPLE_TASKS, type ExampleTask } from '@/stores/scan'
import { useToast } from '@/composables/useToast'
import BrButton from '@/components/base/BrButton.vue'

const router = useRouter()
const scanStore = useScanStore()
const { toast } = useToast()

// 产品特点
const features = [
  {
    no: '01',
    title: 'AI 智能扫描',
    desc: '自动识别模糊表达和返工风险，不再靠经验拍脑袋。',
  },
  {
    no: '02',
    title: '精准追问清单',
    desc: '帮你问出真正需要确认的问题，把模糊变清晰。',
  },
  {
    no: '03',
    title: '最小交付建议',
    desc: '避免过度投入，先做 MVP 再迭代，省时省力。',
  },
  {
    no: '04',
    title: '一键复制话术',
    desc: '专业礼貌，直接发出去确认，避免来回扯皮。',
  },
]

// 典型场景
const scenarios = [
  {
    identity: '实习生接任务',
    desc: '导师说"简单做一下"，你不知道做到什么程度才算完成。',
    example: '帮我把首页优化一下，做得更有质感一点。',
    task: EXAMPLE_TASKS[0],
  },
  {
    identity: '学生写作业',
    desc: '作业要求看似清晰，实际评分标准模糊。',
    example: '结合实际案例分析人工智能对社会生活的影响。',
    task: EXAMPLE_TASKS[2],
  },
  {
    identity: '开发者接需求',
    desc: '产品说"先简单做一下"，技术方案和边界都不清楚。',
    example: '新增一个导出 Excel 功能，入口放在列表页。',
    task: EXAMPLE_TASKS[1],
  },
  {
    identity: '参赛者看规则',
    desc: '比赛规则里"创新性、实用性"到底怎么定义？',
    example: '提交一个 AI 创新作品 Demo。',
    task: EXAMPLE_TASKS[3],
  },
]

// 使用流程
const steps = [
  { no: '1', title: '粘贴任务说明', desc: '把你收到的任务原文粘贴进来' },
  { no: '2', title: 'AI 扫描分析', desc: '识别模糊表达和潜在返工风险' },
  { no: '3', title: '获取完整报告', desc: '风险评分 + 追问清单 + 工作路线' },
  { no: '4', title: '确认后开工', desc: '带着明确的目标和边界开始做' },
]

/** 跳转到扫描页 */
function goScan(): void {
  router.push({ name: 'scan' })
}

/** 应用场景示例并跳转 */
function applyScenario(task: ExampleTask): void {
  scanStore.applyExample(task)
  toast.success('已填充示例，可直接开始扫描')
  router.push({ name: 'scan' })
}
</script>

<template>
  <div class="home-page">
    <!-- ===== Hero 区域 ===== -->
    <section class="hero">
      <div class="hero__inner">
        <!-- 上方标签 -->
        <div class="hero__tag-row">
          <span class="hero__tag">// AI SCAN ENGINE</span>
          <span class="hero__tag hero__tag--gold">v1.0</span>
        </div>

        <!-- 大标题 -->
        <h1 class="hero__title">
          <span class="hero__title-line">先别</span>
          <span class="hero__title-line hero__title-line--skew">
            <span class="hero__title-strike">开工</span>
          </span>
        </h1>

        <!-- 副标题 -->
        <p class="hero__subtitle">开工前，先扫一遍返工风险</p>

        <!-- 描述 -->
        <p class="hero__desc">
          一款 AI 任务需求防返工扫描仪。粘贴你收到的任务说明，
          <br />AI 帮你识别模糊表达、生成追问清单、给出最小交付建议。
        </p>

        <!-- CTA -->
        <div class="hero__cta">
          <BrButton variant="primary" size="lg" @click="goScan">立即扫描 →</BrButton>
          <a class="hero__cta-link" href="#features">了解功能</a>
        </div>

        <!-- 装饰元素 -->
        <div class="hero__decorations">
          <span class="hero__deco hero__deco--1">◆</span>
          <span class="hero__deco hero__deco--2">▌</span>
          <span class="hero__deco hero__deco--3">●</span>
          <span class="hero__deco hero__deco--4">▲</span>
        </div>
      </div>
    </section>

    <!-- ===== 产品特点 ===== -->
    <section id="features" class="features">
      <div class="section-head">
        <span class="section-head__label">// FEATURES</span>
        <h2 class="section-head__title">四大核心能力</h2>
        <p class="section-head__desc">从识别风险到给出建议，一条龙解决返工隐患</p>
      </div>

      <div class="features__grid">
        <div
          v-for="feat in features"
          :key="feat.no"
          class="feature-card"
        >
          <span class="feature-card__no">{{ feat.no }}</span>
          <h3 class="feature-card__title">{{ feat.title }}</h3>
          <p class="feature-card__desc">{{ feat.desc }}</p>
        </div>
      </div>
    </section>

    <!-- ===== 典型场景 ===== -->
    <section class="scenarios">
      <div class="section-head">
        <span class="section-head__label">// SCENARIOS</span>
        <h2 class="section-head__title">典型使用场景</h2>
        <p class="section-head__desc">点击任意场景，自动填充示例任务进入扫描</p>
      </div>

      <div class="scenarios__grid">
        <div
          v-for="(sc, idx) in scenarios"
          :key="idx"
          class="scenario-card"
          @click="applyScenario(sc.task)"
        >
          <div class="scenario-card__head">
            <span class="scenario-card__no">0{{ idx + 1 }}</span>
            <span class="scenario-card__arrow">→</span>
          </div>
          <h3 class="scenario-card__title">{{ sc.identity }}</h3>
          <p class="scenario-card__desc">{{ sc.desc }}</p>
          <div class="scenario-card__example">
            <span class="scenario-card__quote">"</span>
            <p class="scenario-card__text">{{ sc.example }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== 使用流程 ===== -->
    <section class="flow">
      <div class="section-head">
        <span class="section-head__label">// WORKFLOW</span>
        <h2 class="section-head__title">四步搞定返工风险</h2>
        <p class="section-head__desc">从粘贴任务到确认开工，全程不到一分钟</p>
      </div>

      <div class="flow__timeline">
        <div class="flow__line" />
        <div
          v-for="(step, idx) in steps"
          :key="step.no"
          class="flow__step"
          :class="{ 'flow__step--last': idx === steps.length - 1 }"
        >
          <div class="flow__node">
            <span class="flow__no">{{ step.no }}</span>
          </div>
          <div class="flow__content">
            <h3 class="flow__title">{{ step.title }}</h3>
            <p class="flow__desc">{{ step.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== 最终 CTA ===== -->
    <section class="final-cta">
      <div class="final-cta__inner">
        <p class="final-cta__small">// READY?</p>
        <h2 class="final-cta__title">
          开工前<span class="final-cta__title-accent">多问一句</span>
        </h2>
        <p class="final-cta__desc">省下返工一天</p>
        <BrButton variant="primary" size="lg" @click="goScan">开始扫描 →</BrButton>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-page {
  /* 全宽页面：由 MainLayout 的 meta.fullWidth 控制，无需负 margin */
}

/* ===== Hero 区域 ===== */
.hero {
  background: var(--color-black);
  color: var(--color-gold);
  /* 动态计算水平 padding，确保 Hero 背景延伸至视口边缘 */
  padding: var(--space-5xl) calc((100vw - var(--container-max)) / 2 + var(--container-px));
  position: relative;
  overflow: hidden;
  border-bottom: var(--border-width-heavy) solid var(--color-gold);
}

.hero__inner {
  max-width: var(--container-max);
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

.hero__tag-row {
  display: flex;
  gap: var(--space-xs);
  margin-bottom: var(--space-lg);
}

.hero__tag {
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  color: var(--color-gold);
  letter-spacing: var(--ls-label);
  padding: 4px 10px;
  border: var(--border-width-thin) solid var(--color-gold);
  opacity: 0.85;
}

.hero__tag--gold {
  background: var(--color-gold);
  color: var(--color-black);
  border-color: var(--color-gold);
}

/* 大标题 */
.hero__title {
  font-family: var(--font-title);
  font-size: 160px;
  font-weight: var(--fw-black);
  line-height: 0.85;
  letter-spacing: -6px;
  margin: 0 0 var(--space-md);
  display: flex;
  align-items: baseline;
  gap: var(--space-md);
}

.hero__title-line {
  color: var(--color-cream);
}

.hero__title-line--skew {
  transform: skewX(-6deg);
  display: inline-block;
}

/* 删除线装饰 */
.hero__title-strike {
  position: relative;
  color: var(--color-gold);
}

.hero__title-strike::after {
  content: '';
  position: absolute;
  left: -8px;
  right: -8px;
  top: 52%;
  height: 12px;
  background: var(--color-gold);
  transform: translateY(-50%) skewX(-6deg);
  z-index: -1;
  opacity: 0.25;
}

/* 副标题 */
.hero__subtitle {
  font-family: var(--font-italic);
  font-style: italic;
  font-size: 28px;
  color: var(--color-gold);
  margin: 0 0 var(--space-md);
  letter-spacing: -0.3px;
}

.hero__desc {
  font-family: var(--font-body);
  font-size: 16px;
  color: var(--color-gray-1);
  line-height: var(--lh-body);
  margin: 0 0 var(--space-xl);
  max-width: 600px;
}

/* CTA */
.hero__cta {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.hero__cta-link {
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  color: var(--color-gold);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
  text-decoration: none;
  border-bottom: var(--border-width-thin) solid var(--color-gold);
  padding: 4px 0;
  transition: all var(--transition-fast);
}

.hero__cta-link:hover {
  background: var(--color-gold);
  color: var(--color-black);
  padding: 4px 8px;
}

/* 装饰元素 */
.hero__decorations {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.hero__deco {
  position: absolute;
  color: var(--color-gold);
  opacity: 0.12;
}

.hero__deco--1 {
  top: 15%;
  right: 8%;
  font-size: 200px;
  transform: rotate(15deg);
}

.hero__deco--2 {
  bottom: 10%;
  right: 25%;
  font-size: 120px;
}

.hero__deco--3 {
  top: 60%;
  right: 5%;
  font-size: 40px;
}

.hero__deco--4 {
  top: 25%;
  right: 35%;
  font-size: 80px;
  transform: rotate(-10deg);
}

/* ===== 通用 section head ===== */
.section-head {
  padding: var(--space-3xl) var(--container-px) var(--space-xl);
  max-width: var(--container-max);
  margin: 0 auto;
}

.section-head__label {
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  color: var(--color-gold-dark);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
}

.section-head__title {
  font-family: var(--font-title);
  font-size: 56px;
  font-weight: var(--fw-black);
  color: var(--color-black);
  letter-spacing: -2px;
  line-height: 1;
  margin: 8px 0 12px;
}

.section-head__desc {
  font-family: var(--font-body);
  font-size: 16px;
  color: var(--color-gray-2);
  margin: 0;
}

/* ===== 产品特点 ===== */
.features {
  background: var(--color-cream);
  padding-bottom: var(--space-3xl);
}

.features__grid {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: 0 var(--container-px);
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-md);
}

.feature-card {
  background: var(--color-white);
  border: var(--border-width-thick) solid var(--color-black);
  padding: var(--space-lg);
  position: relative;
  transition: all var(--transition-fast);
  display: flex;
  flex-direction: column;
}

.feature-card:hover {
  background: var(--color-gold);
  transform: translate(-3px, -3px);
  box-shadow: var(--shadow-md);
}

.feature-card__no {
  font-family: var(--font-title);
  font-size: 56px;
  font-weight: var(--fw-black);
  color: var(--color-gray-4);
  line-height: 0.85;
  margin-bottom: var(--space-md);
  transition: color var(--transition-fast);
}

.feature-card:hover .feature-card__no {
  color: var(--color-black);
}

.feature-card__title {
  font-family: var(--font-title);
  font-size: 18px;
  font-weight: var(--fw-black);
  color: var(--color-black);
  letter-spacing: -0.3px;
  line-height: 1.1;
  margin: 0 0 var(--space-xs);
}

.feature-card__desc {
  font-family: var(--font-body);
  font-size: var(--fs-body);
  color: var(--color-gray-3);
  line-height: var(--lh-card);
  margin: 0;
}

/* ===== 典型场景 ===== */
.scenarios {
  background: var(--color-white);
  padding-bottom: var(--space-3xl);
  border-top: var(--border-width-thick) solid var(--color-black);
  border-bottom: var(--border-width-thick) solid var(--color-black);
}

.scenarios__grid {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: 0 var(--container-px);
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-md);
}

.scenario-card {
  background: var(--color-cream);
  border: var(--border-width-thick) solid var(--color-black);
  padding: var(--space-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  flex-direction: column;
}

.scenario-card:hover {
  background: var(--color-gold);
  transform: translate(-3px, -3px);
  box-shadow: var(--shadow-lg);
}

.scenario-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-md);
}

.scenario-card__no {
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  color: var(--color-gold-dark);
  letter-spacing: var(--ls-label);
}

.scenario-card:hover .scenario-card__no {
  color: var(--color-black);
}

.scenario-card__arrow {
  font-family: var(--font-title);
  font-size: 20px;
  font-weight: var(--fw-black);
  color: var(--color-black);
  transition: transform var(--transition-fast);
}

.scenario-card:hover .scenario-card__arrow {
  transform: translateX(4px);
}

.scenario-card__title {
  font-family: var(--font-title);
  font-size: 20px;
  font-weight: var(--fw-black);
  color: var(--color-black);
  letter-spacing: -0.5px;
  line-height: 1.1;
  margin: 0 0 var(--space-xs);
}

.scenario-card__desc {
  font-family: var(--font-body);
  font-size: var(--fs-body);
  color: var(--color-gray-3);
  line-height: var(--lh-card);
  margin: 0 0 var(--space-md);
}

.scenario-card__example {
  margin-top: auto;
  padding-top: var(--space-sm);
  border-top: var(--border-width-thin) solid var(--color-black);
  display: flex;
  gap: 6px;
}

.scenario-card__quote {
  font-family: var(--font-title);
  font-size: 28px;
  font-weight: var(--fw-black);
  color: var(--color-gold-dark);
  line-height: 0.7;
}

.scenario-card:hover .scenario-card__quote {
  color: var(--color-black);
}

.scenario-card__text {
  font-family: var(--font-italic);
  font-style: italic;
  font-size: var(--fs-caption);
  color: var(--color-gray-2);
  line-height: var(--lh-caption);
  margin: 0;
}

/* ===== 使用流程 ===== */
.flow {
  background: var(--color-cream);
  padding-bottom: var(--space-3xl);
}

.flow__timeline {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: 0 var(--container-px);
  position: relative;
}

.flow__line {
  position: absolute;
  left: calc(var(--container-px) + 28px);
  top: 0;
  bottom: 0;
  width: var(--border-width-thick);
  background: var(--color-black);
}

.flow__step {
  display: flex;
  gap: var(--space-lg);
  align-items: flex-start;
  margin-bottom: var(--space-xl);
  position: relative;
}

.flow__step--last {
  margin-bottom: 0;
}

.flow__node {
  width: 60px;
  height: 60px;
  background: var(--color-black);
  color: var(--color-gold);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  border: var(--border-width-thick) solid var(--color-black);
}

.flow__no {
  font-family: var(--font-title);
  font-size: 32px;
  font-weight: var(--fw-black);
  line-height: 1;
}

.flow__content {
  flex: 1;
  padding-top: var(--space-xs);
}

.flow__title {
  font-family: var(--font-title);
  font-size: 24px;
  font-weight: var(--fw-black);
  color: var(--color-black);
  letter-spacing: -0.5px;
  line-height: 1;
  margin: 0 0 6px;
}

.flow__desc {
  font-family: var(--font-body);
  font-size: var(--fs-body);
  color: var(--color-gray-2);
  line-height: var(--lh-card);
  margin: 0;
}

/* ===== 最终 CTA ===== */
.final-cta {
  background: var(--color-black);
  color: var(--color-gold);
  /* 动态计算水平 padding，确保 CTA 背景延伸至视口边缘 */
  padding: var(--space-4xl) calc((100vw - var(--container-max)) / 2 + var(--container-px));
  text-align: center;
  border-top: var(--border-width-heavy) solid var(--color-gold);
}

.final-cta__inner {
  max-width: var(--container-max);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
}

.final-cta__small {
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  color: var(--color-gold);
  letter-spacing: var(--ls-label);
  opacity: 0.7;
  margin: 0;
}

.final-cta__title {
  font-family: var(--font-title);
  font-size: 80px;
  font-weight: var(--fw-black);
  color: var(--color-cream);
  letter-spacing: -3px;
  line-height: 1;
  margin: 0;
}

.final-cta__title-accent {
  color: var(--color-gold);
  transform: skewX(-5deg);
  display: inline-block;
}

.final-cta__desc {
  font-family: var(--font-italic);
  font-style: italic;
  font-size: 24px;
  color: var(--color-gold);
  margin: 0 0 var(--space-lg);
}

/* ===== 响应式（S12 断点对齐 1199/767）===== */
@media (max-width: 1199px) {
  .hero__title {
    font-size: 120px;
    letter-spacing: -4px;
  }
  .features__grid,
  .scenarios__grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .section-head__title {
    font-size: 40px;
  }
  .final-cta__title {
    font-size: 56px;
  }
}

@media (max-width: 767px) {
  .hero {
    /* 移动端使用固定 padding，避免动态 calc 负值 */
    padding: var(--space-3xl) var(--space-lg);
  }
  .final-cta {
    /* 移动端使用固定 padding */
    padding: var(--space-3xl) var(--space-lg);
  }
  .hero__title {
    font-size: 64px;
    letter-spacing: -2px;
    flex-direction: column;
    gap: 0;
  }
  .hero__subtitle {
    font-size: 20px;
  }
  .hero__desc {
    font-size: 14px;
  }
  .features__grid,
  .scenarios__grid {
    grid-template-columns: 1fr;
  }
  .section-head {
    padding: var(--space-2xl) var(--space-lg) var(--space-lg);
  }
  .section-head__title {
    font-size: 32px;
  }
  .flow__line {
    left: 30px;
  }
  .flow__node {
    width: 48px;
    height: 48px;
  }
  .flow__no {
    font-size: 24px;
  }
  .flow__title {
    font-size: 18px;
  }
  .final-cta__title {
    font-size: 40px;
  }
  .final-cta__desc {
    font-size: 18px;
  }
}
</style>
