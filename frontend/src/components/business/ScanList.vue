<script setup lang="ts">
/**
 * ScanList - 扫描记录列表容器
 *
 * - 列表区：渲染 ScanListItem
 * - 加载骨架
 * - 空状态（无记录 / 无搜索结果）
 * - 错误状态
 *
 * 事件：
 * - item-click
 * - toggle-favorite
 * - share（S11）
 * - delete
 * - go-scan（空状态点击去扫描）
 */
import type { ScanRecordBrief } from '@/types/scan'
import ScanListItem from './ScanListItem.vue'
import BrButton from '@/components/base/BrButton.vue'

interface Props {
  items: ScanRecordBrief[]
  loading: boolean
  /** 是否为筛选后的空结果（区别于从未扫描过的空） */
  filtered?: boolean
  /** 错误信息 */
  error?: string
}

withDefaults(defineProps<Props>(), {
  filtered: false,
  error: '',
})

const emit = defineEmits<{
  (e: 'item-click', item: ScanRecordBrief): void
  (e: 'toggle-favorite', item: ScanRecordBrief): void
  (e: 'share', item: ScanRecordBrief): void
  (e: 'delete', item: ScanRecordBrief): void
  (e: 'go-scan'): void
  (e: 'retry'): void
}>()

function onItemClick(item: ScanRecordBrief): void {
  emit('item-click', item)
}
function onToggleFavorite(item: ScanRecordBrief): void {
  emit('toggle-favorite', item)
}
function onShare(item: ScanRecordBrief): void {
  emit('share', item)
}
function onDelete(item: ScanRecordBrief): void {
  emit('delete', item)
}
function onGoScan(): void {
  emit('go-scan')
}
function onRetry(): void {
  emit('retry')
}
</script>

<template>
  <div class="scan-list">
    <!-- 加载中骨架 -->
    <div v-if="loading" class="scan-list__skeleton">
      <div v-for="i in 5" :key="i" class="scan-list__skeleton-item">
        <div class="scan-list__skeleton-score"></div>
        <div class="scan-list__skeleton-body">
          <div class="scan-list__skeleton-line scan-list__skeleton-line--long"></div>
          <div class="scan-list__skeleton-line scan-list__skeleton-line--short"></div>
        </div>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="scan-list__status scan-list__status--error">
      <span class="scan-list__status-icon">!</span>
      <p class="scan-list__status-text">// LOAD FAILED</p>
      <p class="scan-list__status-sub">{{ error }}</p>
      <BrButton variant="secondary" @click="onRetry">重试</BrButton>
    </div>

    <!-- 空状态 -->
    <div v-else-if="items.length === 0" class="scan-list__status scan-list__status--empty">
      <span class="scan-list__status-icon">{{ filtered ? '?' : '∅' }}</span>
      <p class="scan-list__status-text">
        {{ filtered ? '// NO MATCH' : '// NO RECORDS' }}
      </p>
      <p class="scan-list__status-sub">
        {{ filtered ? '没有符合条件的扫描记录，试试调整筛选条件' : '还没有扫描记录，去发起第一次扫描吧' }}
      </p>
      <BrButton v-if="!filtered" variant="primary" @click="onGoScan">去扫描</BrButton>
    </div>

    <!-- 列表 -->
    <ul v-else class="scan-list__items">
      <li v-for="item in items" :key="item.id" class="scan-list__item">
        <ScanListItem
          :item="item"
          @click="onItemClick"
          @toggle-favorite="onToggleFavorite"
          @share="onShare"
          @delete="onDelete"
        />
      </li>
    </ul>
  </div>
</template>

<style scoped>
.scan-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.scan-list__items {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.scan-list__item {
  display: block;
}

/* ===== 骨架屏 ===== */
.scan-list__skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.scan-list__skeleton-item {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: var(--space-md);
  padding: var(--space-md);
  border: var(--border-width-thick) solid var(--color-black);
  background: var(--color-white);
  box-shadow: var(--shadow-sm);
}

.scan-list__skeleton-score {
  width: 60px;
  height: 40px;
  background: var(--color-gray-4);
  border: var(--border-width-thin) solid var(--color-black);
}

.scan-list__skeleton-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  justify-content: center;
}

.scan-list__skeleton-line {
  height: 12px;
  background: var(--color-gray-4);
  border: var(--border-width-thin) solid var(--color-black);
}

.scan-list__skeleton-line--long {
  width: 100%;
}

.scan-list__skeleton-line--short {
  width: 40%;
}

/* ===== 状态（空 / 错误） ===== */
.scan-list__status {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-3xl) var(--space-md);
  border: var(--border-width-thick) solid var(--color-black);
  background: var(--color-white);
  box-shadow: var(--shadow-md);
  text-align: center;
}

.scan-list__status-icon {
  font-family: var(--font-title);
  font-size: 64px;
  font-weight: var(--fw-black);
  color: var(--color-gold-dark);
  line-height: 1;
}

.scan-list__status--error .scan-list__status-icon {
  color: var(--color-risk-high);
}

.scan-list__status-text {
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  color: var(--color-black);
  letter-spacing: var(--ls-label-lg);
  margin: 0;
}

.scan-list__status--error .scan-list__status-text {
  color: var(--color-risk-high);
}

.scan-list__status-sub {
  font-family: var(--font-body);
  font-size: var(--fs-body);
  color: var(--color-gray-2);
  margin: 0;
  max-width: 320px;
}
</style>
