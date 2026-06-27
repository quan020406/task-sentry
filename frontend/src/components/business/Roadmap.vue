<script setup lang="ts">
/**
 * Roadmap - 安全开工路线（时间线）
 *
 * 新野兽派风格：
 * - 左侧 3px 粗黑色竖线
 * - 每步骤金色填充方块节点（黑色边框）
 * - 步骤号：Archivo Black 大号数字，浅灰，hover 变金
 * - 步骤标题：Work Sans 粗体
 * - 步骤说明：正文稍浅
 * - hover：背景变浅米
 *
 * 数据：scan.roadmap
 *   RoadmapStep = { step, title, desc, duration }
 */
import { computed } from 'vue'
import type { RoadmapStep } from '@/types/scan'

interface Props {
  steps: RoadmapStep[]
}

const props = defineProps<Props>()

/** 步骤总数 */
const totalSteps = computed(() => props.steps.length)

/** 副标题 */
const subtitle = computed(() => `${totalSteps.value} 步走，减少返工`)
</script>

<template>
  <div class="roadmap">
    <!-- 标题行 -->
    <header class="roadmap__head">
      <span class="roadmap__label">// ROADMAP</span>
      <h2 class="roadmap__title">安全开工路线</h2>
      <p class="roadmap__subtitle">{{ subtitle }}</p>
    </header>

    <!-- 时间线主体 -->
    <div class="roadmap__body">
      <template v-if="steps.length">
        <ol class="roadmap__timeline">
          <li
            v-for="(step, idx) in steps"
            :key="`step-${idx}-${step.step}`"
            class="roadmap__step"
          >
            <!-- 节点 + 竖线 -->
            <div class="roadmap__node-col">
              <span class="roadmap__node" aria-hidden="true">{{ step.step }}</span>
              <!-- 竖线（最后一个不显示） -->
              <span
                v-if="idx < steps.length - 1"
                class="roadmap__line"
                aria-hidden="true"
              ></span>
            </div>

            <!-- 内容 -->
            <div class="roadmap__content">
              <div class="roadmap__step-head">
                <span class="roadmap__step-num">{{ String(step.step).padStart(2, '0') }}</span>
                <h3 class="roadmap__step-title">{{ step.title }}</h3>
                <span v-if="step.duration" class="roadmap__step-duration">
                  // {{ step.duration }}
                </span>
              </div>
              <p class="roadmap__step-desc">{{ step.desc }}</p>
            </div>
          </li>
        </ol>
      </template>

      <!-- 空状态 -->
      <div v-else class="roadmap__empty">
        <span class="roadmap__empty-icon" aria-hidden="true">✓</span>
        <p class="roadmap__empty-text">暂无开工路线建议。</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.roadmap {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* ===== 标题行 ===== */
.roadmap__head {
  padding: var(--space-md) var(--space-lg);
  background: var(--color-cream-light);
  border-bottom: var(--border-width-thick) solid var(--color-black);
}

.roadmap__label {
  display: block;
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  color: var(--color-gold-dark);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
  margin-bottom: 4px;
}

.roadmap__title {
  font-family: var(--font-title);
  font-size: 20px;
  font-weight: var(--fw-black);
  color: var(--color-black);
  letter-spacing: var(--ls-h2);
  line-height: 1;
  margin: 0 0 6px;
}

.roadmap__subtitle {
  font-family: var(--font-mono);
  font-size: var(--fs-caption);
  font-weight: var(--fw-bold);
  color: var(--color-gray-2);
  letter-spacing: var(--ls-label);
  margin: 0;
}

/* ===== 主体 ===== */
.roadmap__body {
  flex: 1;
  padding: var(--space-lg);
}

/* ===== 时间线 ===== */
.roadmap__timeline {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
}

.roadmap__step {
  display: flex;
  gap: var(--space-md);
  padding: var(--space-sm) 0;
  transition: background var(--transition-fast);
  border-radius: 0;
}

.roadmap__step:hover {
  background: var(--color-cream-light);
}

.roadmap__step:hover .roadmap__step-num {
  color: var(--color-gold);
}

/* 节点列：固定宽度，含节点方块 + 下方竖线 */
.roadmap__node-col {
  flex-shrink: 0;
  width: 36px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 节点方块：金色填充 + 黑边 */
.roadmap__node {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--color-gold);
  color: var(--color-black);
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  border: var(--border-width-thick) solid var(--color-black);
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
}

/* 竖线：3px 黑色 */
.roadmap__line {
  width: var(--border-width-thick);
  flex: 1;
  background: var(--color-black);
  margin-top: 4px;
  margin-bottom: 4px;
  min-height: 24px;
}

/* 内容区 */
.roadmap__content {
  flex: 1;
  min-width: 0;
  padding-bottom: var(--space-md);
}

.roadmap__step-head {
  display: flex;
  align-items: baseline;
  gap: var(--space-sm);
  flex-wrap: wrap;
  margin-bottom: 6px;
}

/* 大号步骤号（浅灰，hover 金） */
.roadmap__step-num {
  font-family: var(--font-title);
  font-size: 28px;
  font-weight: var(--fw-black);
  color: var(--color-gray-3);
  line-height: 0.85;
  letter-spacing: -1px;
  transition: color var(--transition-fast);
}

.roadmap__step-title {
  font-family: var(--font-body);
  font-size: 16px;
  font-weight: var(--fw-bold);
  color: var(--color-black);
  line-height: 1.3;
  margin: 0;
  flex: 1;
  min-width: 0;
}

/* 时长标签 */
.roadmap__step-duration {
  font-family: var(--font-mono);
  font-size: var(--fs-caption);
  font-weight: var(--fw-bold);
  color: var(--color-gold-dark);
  letter-spacing: var(--ls-label);
  white-space: nowrap;
}

.roadmap__step-desc {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: var(--fw-regular);
  line-height: var(--lh-body);
  color: var(--color-gray-3);
  margin: 0;
  word-break: break-word;
}

/* ===== 空状态 ===== */
.roadmap__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-3xl) var(--space-md);
  text-align: center;
}

.roadmap__empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: var(--color-risk-low);
  color: var(--color-black);
  font-size: 28px;
  font-weight: var(--fw-bold);
  border: var(--border-width-thick) solid var(--color-black);
  box-shadow: var(--shadow-sm);
}

.roadmap__empty-text {
  font-family: var(--font-italic);
  font-style: italic;
  font-size: var(--fs-body);
  color: var(--color-gray-2);
  margin: 0;
}
</style>
