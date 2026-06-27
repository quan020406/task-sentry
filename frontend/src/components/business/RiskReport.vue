<script setup lang="ts">
/**
 * RiskReport - 风险扫描报告（中栏）
 *
 * 新野兽派风格：
 * - 卡片标题 + 右侧风险总数
 * - 7 个标准风险分组（可折叠）
 * - 默认展开有风险的分组，无风险的折叠
 * - 每个分组内渲染 RiskItem 列表
 * - 无风险的分组显示绿色对勾空状态
 *
 * 数据：scan.riskGroups
 * 注意：后端返回的分组数量可能少于 7 个标准分组，只渲染返回的分组
 */
import { computed, ref, watch } from 'vue'
import type { RiskGroup } from '@/types/scan'
import CollapseGroup from './CollapseGroup.vue'
import RiskItem from './RiskItem.vue'

interface Props {
  groups: RiskGroup[]
}

const props = defineProps<Props>()

/** 风险总数 */
const totalCount = computed(() => {
  return props.groups.reduce((sum, g) => sum + g.items.length, 0)
})

/** 各分组风险数 */
const groupCounts = computed(() => {
  return props.groups.map((g) => g.items.length)
})

/**
 * 默认展开的分组索引
 * 策略：有风险的分组默认展开，无风险的默认折叠
 */
const openIndices = ref<number[]>([])

function initOpenIndices(): void {
  openIndices.value = props.groups
    .map((g, idx) => (g.items.length > 0 ? idx : -1))
    .filter((idx) => idx !== -1)
}

// 初始化 + 数据变化时重新计算
initOpenIndices()
watch(
  () => props.groups,
  () => initOpenIndices(),
)

/** 切换某分组展开/折叠（受控模式） */
function toggleGroup(idx: number, val: boolean): void {
  const i = openIndices.value.indexOf(idx)
  if (val && i === -1) {
    openIndices.value.push(idx)
  } else if (!val && i > -1) {
    openIndices.value.splice(i, 1)
  }
}

/** 当前是否展开 */
function isOpen(idx: number): boolean {
  return openIndices.value.includes(idx)
}
</script>

<template>
  <div class="risk-report">
    <!-- 标题行：左标题 + 右总数 -->
    <header class="risk-report__head">
      <div class="risk-report__title-wrap">
        <span class="risk-report__label">// RISK REPORT</span>
        <h2 class="risk-report__title">风险扫描报告</h2>
      </div>
      <div class="risk-report__count">
        <span class="risk-report__count-num">{{ totalCount }}</span>
        <span class="risk-report__count-label">RISKS</span>
      </div>
    </header>

    <!-- 主体：分组列表 -->
    <div class="risk-report__body">
      <template v-if="groups.length">
        <CollapseGroup
          v-for="(group, idx) in groups"
          :key="`group-${idx}-${group.name}`"
          :title="group.name"
          :count="group.items.length"
          :empty="group.items.length === 0"
          :open="isOpen(idx)"
          @toggle="(val) => toggleGroup(idx, val)"
        >
          <div class="risk-report__items">
            <RiskItem
              v-for="(item, i) in group.items"
              :key="`risk-${idx}-${i}`"
              :item="item"
              :index="i + 1"
            />
          </div>
        </CollapseGroup>
      </template>

      <!-- 完全无分组数据 -->
      <div v-else class="risk-report__empty">
        <span class="risk-report__empty-icon" aria-hidden="true">✓</span>
        <p class="risk-report__empty-text">未发现风险，扫描结果为空。</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.risk-report {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* ===== 标题行 ===== */
.risk-report__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: var(--space-md) var(--space-lg);
  background: var(--color-cream-light);
  border-bottom: var(--border-width-thick) solid var(--color-black);
}

.risk-report__title-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.risk-report__label {
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  color: var(--color-gold-dark);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
}

.risk-report__title {
  font-family: var(--font-title);
  font-size: 20px;
  font-weight: var(--fw-black);
  color: var(--color-black);
  letter-spacing: var(--ls-h2);
  line-height: 1;
  margin: 0;
}

/* 右侧总数 */
.risk-report__count {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.risk-report__count-num {
  font-family: var(--font-title);
  font-size: 36px;
  font-weight: var(--fw-black);
  color: var(--color-black);
  line-height: 0.85;
  letter-spacing: -1px;
}

.risk-report__count-label {
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  color: var(--color-gray-2);
  letter-spacing: var(--ls-label);
}

/* ===== 主体 ===== */
.risk-report__body {
  flex: 1;
  overflow-y: auto;
  border: var(--border-width-thick) solid var(--color-black);
  border-top: none;
}

.risk-report__items {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* 空状态 */
.risk-report__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-3xl) var(--space-md);
  text-align: center;
}

.risk-report__empty-icon {
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

.risk-report__empty-text {
  font-family: var(--font-italic);
  font-style: italic;
  font-size: var(--fs-body);
  color: var(--color-gray-2);
  margin: 0;
}
</style>
