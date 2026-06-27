<script setup lang="ts">
/**
 * History 页面 - 扫描历史记录
 *
 * 新野兽派风格：
 * - 筛选/搜索区（关键词、风险等级、收藏、排序）
 * - 列表区（ScanList）
 * - 分页（BrPagination）
 * - 删除确认弹窗（BrModal）
 * - 收藏即时切换（乐观更新）
 *
 * 路由：/history（需登录）
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useScanStore } from '@/stores/scan'
import { scanApi } from '@/api/scan'
import { useToast } from '@/composables/useToast'
import type { ScanRecordBrief, ScanHistoryResult, RiskLevel } from '@/types/scan'
import ScanList from '@/components/business/ScanList.vue'
import ShareModal from '@/components/business/ShareModal.vue'
import BrPagination from '@/components/base/BrPagination.vue'
import BrInput from '@/components/base/BrInput.vue'
import BrButton from '@/components/base/BrButton.vue'
import BrModal from '@/components/base/BrModal.vue'

const router = useRouter()
const scanStore = useScanStore()
const { toast } = useToast()

// ===== 列表数据 =====
const list = ref<ScanRecordBrief[]>([])
const total = ref(0)
const loading = ref(false)
const loadError = ref('')

// ===== 删除确认弹窗 =====
const deleteModalVisible = ref(false)
const deleteTarget = ref<ScanRecordBrief | null>(null)
const deleting = ref(false)

// ===== 分享弹窗（S11） =====
const shareModalVisible = ref(false)
const shareScanId = ref('')

// ===== 派生自 store 的筛选状态（双向同步） =====
const filter = computed(() => scanStore.historyFilter)

/** 风险等级选项 */
const riskLevelOptions: Array<{ value: RiskLevel | ''; label: string }> = [
  { value: '', label: '全部' },
  { value: 'high', label: '高' },
  { value: 'mid', label: '中' },
  { value: 'low', label: '低' },
]

/** 是否有筛选条件（用于区分空状态类型） */
const hasFilter = computed(
  () =>
    !!filter.value.keyword.trim() ||
    filter.value.riskLevel !== '' ||
    filter.value.isFavorite,
)

// ===== 加载列表 =====
async function loadList(): Promise<void> {
  loading.value = true
  loadError.value = ''
  try {
    const res: ScanHistoryResult = await scanApi.getHistory({
      pageNum: filter.value.pageNum,
      pageSize: filter.value.pageSize,
      keyword: filter.value.keyword,
      riskLevel: filter.value.riskLevel,
      isFavorite: filter.value.isFavorite,
      order: filter.value.order,
    })
    list.value = res.list
    total.value = res.total
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : '加载失败'
    list.value = []
    total.value = 0
    console.error('[History] 加载列表失败:', e)
  } finally {
    loading.value = false
  }
}

// ===== 筛选操作 =====
/** 关键词输入（防抖后触发搜索） */
let keywordTimer: ReturnType<typeof setTimeout> | null = null
function onKeywordInput(value: string): void {
  scanStore.setHistoryFilter({ keyword: value, pageNum: 1 })
  if (keywordTimer) clearTimeout(keywordTimer)
  keywordTimer = setTimeout(loadList, 400)
}

/** 切换风险等级 */
function onRiskLevelChange(value: RiskLevel | ''): void {
  scanStore.setHistoryFilter({ riskLevel: value, pageNum: 1 })
  loadList()
}

/** 切换收藏筛选 */
function onFavoriteToggle(): void {
  scanStore.setHistoryFilter({ isFavorite: !filter.value.isFavorite, pageNum: 1 })
  loadList()
}

/** 切换排序 */
function onOrderChange(order: 'latest' | 'earliest'): void {
  scanStore.setHistoryFilter({ order, pageNum: 1 })
  loadList()
}

/** 翻页 */
function onPageChange(page: number): void {
  scanStore.setHistoryFilter({ pageNum: page })
  loadList()
  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

/** 重置筛选 */
function onResetFilter(): void {
  scanStore.resetHistoryFilter()
  loadList()
}

// ===== 列表项操作 =====
/** 点击列表项 → 跳转详情 */
function onItemClick(item: ScanRecordBrief): void {
  router.push({ name: 'result', params: { id: item.id } })
}

/** 切换收藏（乐观更新） */
async function onToggleFavorite(item: ScanRecordBrief): Promise<void> {
  const prev = item.isFavorite
  // 乐观更新
  item.isFavorite = !prev
  try {
    const res = await scanApi.toggleFavorite(item.id)
    item.isFavorite = res.isFavorite
    toast.success(res.isFavorite ? '已收藏' : '已取消收藏')
  } catch (e) {
    // 回滚
    item.isFavorite = prev
    toast.error('操作失败，请稍后重试')
    console.error('[History] 收藏失败:', e)
  }
}

/** 点击删除 → 打开确认弹窗 */
function onDeleteClick(item: ScanRecordBrief): void {
  deleteTarget.value = item
  deleteModalVisible.value = true
}

/** 点击分享 → 打开分享弹窗（S11） */
function onShareClick(item: ScanRecordBrief): void {
  shareScanId.value = item.id
  shareModalVisible.value = true
}

/** 确认删除 */
async function onConfirmDelete(): Promise<void> {
  if (!deleteTarget.value || deleting.value) return
  deleting.value = true
  const target = deleteTarget.value
  try {
    await scanApi.deleteScan(target.id)
    // 从列表移除
    list.value = list.value.filter((i) => i.id !== target.id)
    total.value = Math.max(0, total.value - 1)
    toast.success('已删除')
    deleteModalVisible.value = false
    deleteTarget.value = null
    // 若当前页删空且非第一页，回退一页
    if (list.value.length === 0 && filter.value.pageNum > 1) {
      scanStore.setHistoryFilter({ pageNum: filter.value.pageNum - 1 })
      loadList()
    }
  } catch (e) {
    toast.error('删除失败，请稍后重试')
    console.error('[History] 删除失败:', e)
  } finally {
    deleting.value = false
  }
}

/** 去扫描 */
function onGoScan(): void {
  router.push({ name: 'scan' })
}

// ===== 删除预览文本（弹窗中显示） =====
const deletePreview = computed(() => {
  if (!deleteTarget.value) return ''
  const text = deleteTarget.value.taskText
  return text.length > 60 ? text.slice(0, 60) + '...' : text
})

// ===== 生命周期 =====
onMounted(loadList)
</script>

<template>
  <div class="history-page">
    <!-- 页面标题 -->
    <header class="history-page__header">
      <span class="history-page__breadcrumb">// HISTORY</span>
      <h1 class="history-page__title">扫描历史</h1>
      <p class="history-page__sub">查看、收藏、管理你的所有扫描记录</p>
    </header>

    <!-- 筛选/搜索区 -->
    <section class="history-filter">
      <!-- 搜索框 -->
      <div class="history-filter__search">
        <BrInput
          :model-value="filter.keyword"
          placeholder="搜索任务文本..."
          @update:model-value="onKeywordInput"
        />
      </div>

      <!-- 筛选按钮组 -->
      <div class="history-filter__row">
        <!-- 风险等级 -->
        <div class="history-filter__group">
          <span class="history-filter__group-label">RISK</span>
          <div class="history-filter__btns">
            <button
              v-for="opt in riskLevelOptions"
              :key="opt.value || 'all'"
              class="history-filter__btn"
              :class="{
                'history-filter__btn--active': filter.riskLevel === opt.value,
                [`history-filter__btn--${opt.value || 'all'}`]: true,
              }"
              type="button"
              @click="onRiskLevelChange(opt.value)"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <!-- 收藏筛选 -->
        <div class="history-filter__group">
          <span class="history-filter__group-label">FAV</span>
          <button
            class="history-filter__btn"
            :class="{ 'history-filter__btn--active': filter.isFavorite }"
            type="button"
            @click="onFavoriteToggle"
          >
            {{ filter.isFavorite ? '仅收藏' : '全部' }}
          </button>
        </div>

        <!-- 排序 -->
        <div class="history-filter__group">
          <span class="history-filter__group-label">SORT</span>
          <div class="history-filter__btns">
            <button
              class="history-filter__btn"
              :class="{ 'history-filter__btn--active': filter.order === 'latest' }"
              type="button"
              @click="onOrderChange('latest')"
            >
              最新
            </button>
            <button
              class="history-filter__btn"
              :class="{ 'history-filter__btn--active': filter.order === 'earliest' }"
              type="button"
              @click="onOrderChange('earliest')"
            >
              最早
            </button>
          </div>
        </div>

        <!-- 重置 -->
        <div class="history-filter__group history-filter__group--reset">
          <BrButton variant="outline" size="sm" @click="onResetFilter">
            重置
          </BrButton>
        </div>
      </div>
    </section>

    <!-- 列表区 -->
    <section class="history-list">
      <ScanList
        :items="list"
        :loading="loading"
        :filtered="hasFilter"
        :error="loadError"
        @item-click="onItemClick"
        @toggle-favorite="onToggleFavorite"
        @share="onShareClick"
        @delete="onDeleteClick"
        @go-scan="onGoScan"
        @retry="loadList"
      />
    </section>

    <!-- 分页 -->
    <footer v-if="total > 0" class="history-pagination">
      <BrPagination
        :page-num="filter.pageNum"
        :page-size="filter.pageSize"
        :total="total"
        @change="onPageChange"
      />
    </footer>

    <!-- 删除确认弹窗 -->
    <BrModal
      v-model="deleteModalVisible"
      title="确认删除"
      width="440px"
    >
      <div class="delete-modal">
        <p class="delete-modal__text">
          确定要删除这条扫描记录吗？此操作不可撤销。
        </p>
        <div class="delete-modal__preview">
          <span class="delete-modal__preview-label">TASK</span>
          <p class="delete-modal__preview-text">{{ deletePreview }}</p>
        </div>
      </div>
      <template #footer>
        <BrButton variant="secondary" :disabled="deleting" @click="deleteModalVisible = false">
          取消
        </BrButton>
        <BrButton variant="primary" :loading="deleting" @click="onConfirmDelete">
          {{ deleting ? '删除中...' : '确认删除' }}
        </BrButton>
      </template>
    </BrModal>

    <!-- 分享弹窗（S11） -->
    <ShareModal
      v-model="shareModalVisible"
      :scan-id="shareScanId"
    />
  </div>
</template>

<style scoped>
.history-page {
  padding: var(--space-xl) 0 var(--space-3xl);
}

/* ===== 页面标题 ===== */
.history-page__header {
  margin-bottom: var(--space-xl);
}

.history-page__breadcrumb {
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  color: var(--color-gold-dark);
  letter-spacing: var(--ls-label);
}

.history-page__title {
  font-family: var(--font-title);
  font-size: var(--fs-h2);
  font-weight: var(--fw-black);
  color: var(--color-black);
  letter-spacing: var(--ls-h2);
  line-height: var(--lh-normal);
  margin: 8px 0 6px;
}

.history-page__sub {
  font-family: var(--font-body);
  font-size: var(--fs-body);
  color: var(--color-gray-2);
  margin: 0;
}

/* ===== 筛选区 ===== */
.history-filter {
  background: var(--color-white);
  border: var(--border-width-thick) solid var(--color-black);
  box-shadow: var(--shadow-sm);
  padding: var(--space-md);
  margin-bottom: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.history-filter__search {
  max-width: 480px;
}

.history-filter__row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-md);
}

.history-filter__group {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.history-filter__group--reset {
  margin-left: auto;
}

.history-filter__group-label {
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  color: var(--color-gray-2);
  letter-spacing: var(--ls-label);
}

.history-filter__btns {
  display: flex;
}

.history-filter__btn {
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  color: var(--color-black);
  background: var(--color-white);
  border: var(--border-width-thin) solid var(--color-black);
  border-right: none;
  padding: 6px 12px;
  cursor: pointer;
  user-select: none;
  transition: all var(--transition-fast);
  letter-spacing: var(--ls-label);
}

.history-filter__btns .history-filter__btn:last-child,
.history-filter__group > .history-filter__btn:only-child {
  border-right: var(--border-width-thin) solid var(--color-black);
}

.history-filter__btn:hover {
  background: var(--color-gold);
}

.history-filter__btn--active {
  background: var(--color-black);
  color: var(--color-gold);
}

.history-filter__btn--active:hover {
  background: var(--color-gold);
  color: var(--color-black);
}

/* 风险等级激活态配色 */
.history-filter__btn--high.history-filter__btn--active {
  background: var(--color-risk-high);
  color: var(--color-white);
}
.history-filter__btn--mid.history-filter__btn--active {
  background: var(--color-risk-mid);
  color: var(--color-black);
}
.history-filter__btn--low.history-filter__btn--active {
  background: var(--color-risk-low);
  color: var(--color-white);
}

/* ===== 列表区 ===== */
.history-list {
  margin-bottom: var(--space-xl);
}

/* ===== 分页 ===== */
.history-pagination {
  padding: var(--space-md) 0;
  border-top: var(--border-width-thin) solid var(--color-black);
}

/* ===== 删除弹窗 ===== */
.delete-modal {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.delete-modal__text {
  font-family: var(--font-body);
  font-size: var(--fs-body);
  color: var(--color-black);
  margin: 0;
  line-height: var(--lh-card);
}

.delete-modal__preview {
  background: var(--color-cream-light);
  border: var(--border-width-thin) solid var(--color-black);
  padding: var(--space-sm);
}

.delete-modal__preview-label {
  font-family: var(--font-mono);
  font-size: var(--fs-label-sm);
  font-weight: var(--fw-bold);
  color: var(--color-gold-dark);
  letter-spacing: var(--ls-label);
  display: block;
  margin-bottom: 4px;
}

.delete-modal__preview-text {
  font-family: var(--font-body);
  font-size: var(--fs-caption);
  color: var(--color-gray-3);
  margin: 0;
  line-height: var(--lh-card);
  word-break: break-word;
}

/* ===== 响应式（S12 断点对齐 1199/767）=====
 * 平板：筛选按钮组 2 列排布
 * 移动：筛选堆叠单列，重置按钮整行
 */
@media (max-width: 1199px) {
  .history-filter__row {
    gap: var(--space-sm);
  }
  .history-filter__search {
    max-width: none;
  }
}

@media (max-width: 767px) {
  .history-page__title {
    font-size: 32px;
    letter-spacing: -1px;
  }
  .history-filter {
    padding: var(--space-sm);
  }
  .history-filter__row {
    gap: var(--space-sm);
  }
  .history-filter__group--reset {
    margin-left: 0;
    width: 100%;
  }
  .history-filter__group--reset :deep(.br-button) {
    width: 100%;
  }
  .history-filter__btn {
    padding: 8px 12px;
    min-height: var(--touch-target);
    display: inline-flex;
    align-items: center;
  }
  .delete-modal__preview-text {
    font-size: var(--fs-label-sm);
  }
}
</style>
