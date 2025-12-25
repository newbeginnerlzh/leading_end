<!-- 订单列表：从 mock storage 读取并展示 -->
<template>
  <div class="modern-order-page">
    <div class="page-header" v-scroll-reveal>
      <h1 class="page-title">我的订单</h1>
      <span class="step-indicator">{{ total }} 笔订单</span>
    </div>

    <div class="section-card" v-scroll-reveal>
      <!-- Filters -->
      <div class="filter-bar" v-scroll-reveal>
        <div class="filter-left">
          <div class="filter-group">
            <span class="filter-label">状态</span>
            <el-select
              v-model="filters.status"
              placeholder="全部"
              clearable
              class="filter-select"
              @change="onFilterChange"
            >
              <el-option
                v-for="opt in statusOptions"
                :key="opt.value ?? 'all'"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </div>

          <div class="filter-group">
            <span class="filter-label">日期</span>
            <el-date-picker
              v-model="filters.dateRange"
              type="daterange"
              range-separator="-"
              start-placeholder="开始"
              end-placeholder="结束"
              value-format="YYYY-MM-DD"
              class="filter-date"
              @change="onFilterChange"
            />
          </div>
        </div>

        <div class="filter-actions">
          <button class="custom-btn primary" @click="applyFilters">筛选</button>
          <button class="custom-btn" @click="resetFilters">重置</button>
        </div>
      </div>

      <!-- Table -->
      <el-table
        :data="orders"
        class="modern-table"
        style="width: 100%"
        :header-cell-style="{
          background: '#f8fafc',
          color: '#64748b',
          fontWeight: '600',
          height: '50px',
        }"
      >
        <el-table-column prop="orderSn" label="订单号" width="170" align="center" />
        <el-table-column prop="createdAt" label="创建时间" width="170" align="center" />
        <el-table-column label="商品" min-width="250" align="center">
          <template #default="{ row }">
            <div class="cell-ellipsis">
              <span
                class="cell-text"
                :ref="(el) => setPreviewTextEl(row.orderSn, el as HTMLElement | null)"
                >{{ formatPreview(row.previewItems) }}</span
              >
              <el-tooltip
                v-if="overflowFlags[row.orderSn]"
                :content="formatPreview(row.previewItems)"
                placement="top"
                effect="light"
                :show-after="150"
              >
                <span class="blue-ellipsis">...</span>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="statusText" label="状态" width="80" align="center">
          <template #default="{ row }">
            <span class="status-badge" :class="statusClass(row.statusText)">{{
              row.statusText
            }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="payAmount" label="实付" width="100" align="center">
          <template #default="{ row }">
            <span class="price-text"
              >¥{{ (row.payAmount || row.totalAmount || 0).toFixed(2) }}</span
            >
          </template>
        </el-table-column>
        <el-table-column label="操作" width="110" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-group">
              <span class="action-link" @click="viewDetail(row.orderSn)">详情</span>
              <el-dropdown trigger="click" @command="onMoreCommand($event, row)">
                <span
                  class="action-link more-link"
                  :class="{ disabled: availableMoreActions(row).length === 0 }"
                >
                  更多 <el-icon><ArrowDown /></el-icon>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      v-for="act in availableMoreActions(row)"
                      :key="act.command"
                      :command="act.command"
                    >
                      {{ act.label }}
                    </el-dropdown-item>
                    <el-dropdown-item v-if="availableMoreActions(row).length === 0" disabled
                      >暂无可用操作</el-dropdown-item
                    >
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-bar" v-scroll-reveal>
        <div class="page-size-selector">
          <span class="label">每页显示</span>
          <div
            class="custom-select-wrapper"
            @mouseenter="showPageSizeDropdown = true"
            @mouseleave="showPageSizeDropdown = false"
          >
            <div class="select-trigger">
              <span class="current-value">{{ pageSize }} 条</span>
              <el-icon class="arrow-icon" :class="{ 'is-rotated': showPageSizeDropdown }">
                <ArrowDown />
              </el-icon>
            </div>
            <Transition name="dropdown-fade">
              <div v-show="showPageSizeDropdown" class="custom-dropdown-menu">
                <div
                  v-for="size in pageSizeOptions"
                  :key="size"
                  class="dropdown-item"
                  :class="{ 'is-active': pageSize === size }"
                  @click="onPageSizeChange(size); showPageSizeDropdown = false"
                >
                  <span class="item-text">{{ size }} 条</span>
                </div>
              </div>
            </Transition>
          </div>
        </div>
        <el-pagination
          background
          layout="prev, pager, next"
          :total="total"
          :page-size="pageSize"
          :current-page="currentPage"
          @current-change="onPageChange"
        />
      </div>
    </div>

    <!-- Refund Dialog -->
    <el-dialog
      v-model="refundDialogVisible"
      title="申请退款"
      width="420px"
      :close-on-click-modal="false"
      class="custom-dialog"
    >
      <el-form label-width="80px" class="modern-form">
        <el-form-item label="退款理由">
          <el-input v-model="refundReason" type="textarea" :rows="3" placeholder="请填写退款理由" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <button class="custom-btn" @click="refundDialogVisible = false">取消</button>
          <button class="custom-btn primary" :disabled="refunding" @click="submitRefund">
            {{ refunding ? '提交中...' : '确定' }}
          </button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowDown } from '@element-plus/icons-vue'
import {
  getOrderList,
  updateOrderStatus,
  deleteOrder,
  OrderAction,
  type GetOrderListParams,
} from '@/api/order'
import type { OrderListItem, OrderPreviewItem } from '@/api/order'
import { ElMessage, ElMessageBox } from 'element-plus'

type OrderListView = OrderListItem & { statusText: string }

// Scroll Reveal Directive
const vScrollReveal = {
  mounted: (el: HTMLElement) => {
    el.classList.add('reveal-item')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add('is-visible')
            observer.unobserve(el)
          }
        })
      },
      { threshold: 0.1, rootMargin: '50px' },
    )
    observer.observe(el)
  },
}

const statusOptions = [
  { label: '全部', value: null },
  { label: '待付款', value: 0 },
  { label: '待发货', value: 1 },
  { label: '待收货', value: 2 },
  { label: '已完成', value: 3 },
  { label: '已取消', value: 4 },
  { label: '退款中', value: 5 },
  { label: '退款成功', value: 6 },
  { label: '退款失败', value: 7 },
]

const statusNumberMap: Record<number, string> = {
  0: '待付款',
  1: '待发货',
  2: '待收货',
  3: '已完成',
  4: '已取消',
  5: '退款中',
  6: '退款成功',
  7: '退款失败',
}

const pendingStatusTexts = new Set(['待付款', '未支付'])

const router = useRouter()
const route = useRoute()

const orders = ref<OrderListView[]>([])
const currentPage = ref(Number(route.query.page) > 0 ? Number(route.query.page) : 1)
const pageSize = ref(Number(route.query.pageSize) > 0 ? Number(route.query.pageSize) : 10)
const total = ref(0)
const showPageSizeDropdown = ref(false)

const pageSizeOptions = [10, 20, 50]

// 监听路由参数变化，处理从其他页面跳转回来或点击导航栏的情况
watch(
  () => route.query,
  (newQuery) => {
    if (route.path !== '/user/orders') return
    const p = Number(newQuery.page) || 1
    const s = Number(newQuery.pageSize) || 10
    if (p !== currentPage.value || s !== pageSize.value) {
      currentPage.value = p
      pageSize.value = s
      load()
    }
  },
  { deep: true },
)

const filters = ref<{ status: number | null; dateRange: string[] | [] }>({
  status: null,
  dateRange: [],
})
const overflowFlags = ref<Record<string, boolean>>({})
const previewObservers = new Map<string, ResizeObserver>()
const refundDialogVisible = ref(false)
const refundReason = ref('')
const refunding = ref(false)
const refundTargetSn = ref('')

function statusTextOf(status?: string | number): string {
  if (typeof status === 'number') return statusNumberMap[status] || `${status}`
  if (typeof status === 'string') return status
  return ''
}

function parseDate(input?: string | number | Date | null): number | null {
  if (!input) return null
  const d = new Date(input as string | number | Date)
  const t = d.getTime()
  return Number.isNaN(t) ? null : t
}

function isOrderExpired(record: {
  createdAt?: string | number | Date
  expireAt?: string | number | Date
  expiresAt?: string | number | Date
}): boolean {
  const expireTs =
    parseDate((record as { expireAt?: string | number | Date }).expireAt) ??
    parseDate((record as { expiresAt?: string | number | Date }).expiresAt)
  let endTs = expireTs ?? null
  if (!endTs) {
    const createdTs = parseDate(record.createdAt as string | number | Date)
    if (createdTs) {
      endTs = createdTs + 15 * 60 * 1000
    }
  }
  if (!endTs) return false
  return Date.now() >= endTs
}

function calcStatusText(order: OrderListItem): string {
  const base = statusTextOf(order.status)
  if (pendingStatusTexts.has(base) && isOrderExpired(order)) return '已超时'
  return base
}

function formatPreview(items?: OrderPreviewItem[]): string {
  if (!items || items.length === 0) return '—'
  if (items.length === 1) return items[0]?.productName || ''
  return items.map((i) => i.productName).join(' / ')
}

function statusClass(text?: string): string {
  switch (text) {
    case '待付款':
      return 'st-pending'
    case '待发货':
      return 'st-shipping'
    case '待收货':
      return 'st-receiving'
    case '已完成':
      return 'st-success'
    case '已取消':
      return 'st-cancel'
    case '退款中':
      return 'st-refund'
    case '退款成功':
      return 'st-refund-success'
    case '退款失败':
      return 'st-refund-fail'
    case '已超时':
      return 'st-expired'
    default:
      return 'st-default'
  }
}

function isRefundable(statusText?: string) {
  return ['待发货', '待收货', '已完成'].includes(statusText || '')
}

function isDeletable(statusText?: string) {
  return ['已完成', '已取消', '退款成功'].includes(statusText || '')
}

function availableMoreActions(row: OrderListView) {
  const acts: { command: 'pay' | 'refund' | 'delete'; label: string }[] = []
  if (row.statusText === '待付款') acts.push({ command: 'pay', label: '去支付' })
  if (isRefundable(row.statusText)) acts.push({ command: 'refund', label: '申请退款' })
  if (isDeletable(row.statusText)) acts.push({ command: 'delete', label: '删除订单' })
  return acts
}

function handleMoreCommand(cmd: 'pay' | 'refund' | 'delete', row: OrderListView) {
  if (cmd === 'pay') return toPay(row.orderSn)
  if (cmd === 'refund') return openRefund(row)
  if (cmd === 'delete') return onDeleteFromList(row)
}

function onMoreCommand(cmd: 'pay' | 'refund' | 'delete', row: OrderListView) {
  handleMoreCommand(cmd, row)
}

function openRefund(row: OrderListView) {
  refundTargetSn.value = row.orderSn
  refundReason.value = ''
  refundDialogVisible.value = true
}

async function submitRefund() {
  if (!refundTargetSn.value || refunding.value) return
  refunding.value = true
  try {
    const reason = refundReason.value?.trim() || null
    await updateOrderStatus(refundTargetSn.value, { action: OrderAction.APPLY_REFUND, reason })

    orders.value = orders.value.map((o) =>
      o.orderSn === refundTargetSn.value ? { ...o, statusText: '退款中', status: '退款中' } : o,
    )
    refundDialogVisible.value = false
    ElMessage.success('已提交退款，状态更新为退款中')
  } catch (err) {
    ElMessage.error((err as Error).message || '申请退款失败')
  } finally {
    refunding.value = false
  }
}

async function onDeleteFromList(row: OrderListView) {
  // 和详情页一致：仅“已完成/已取消/退款成功”可删
  if (!isDeletable(row.statusText)) {
    await ElMessageBox.alert(
      '仅状态为“已完成/已取消/退款成功”的订单可以删除。当前状态不支持删除。',
      '无法删除',
      {
        confirmButtonText: '我知道了',
        type: 'info',
      },
    )
    return
  }

  try {
    await ElMessageBox.confirm('确认删除该订单？删除后不可恢复。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '再想想',
      type: 'warning',
    })
  } catch {
    return
  }

  try {
    await deleteOrder(row.orderSn)
    ElMessage.success('已删除订单')
    // 刷新列表
    await load()
  } catch (err) {
    ElMessage.error((err as Error).message || '删除失败')
  }
}

function setPreviewTextEl(key: string, el: HTMLElement | null) {
  const existed = previewObservers.get(key)
  if (existed && !el) {
    existed.disconnect()
    previewObservers.delete(key)
    const next = { ...overflowFlags.value }
    delete next[key]
    overflowFlags.value = next
    return
  }
  if (!el) return

  const measure = () => {
    // 检测文本真实宽度与可视宽度，略放宽阈值以避免边界误差
    const over = el.scrollWidth > el.clientWidth + 1
    if (overflowFlags.value[key] !== over) {
      overflowFlags.value = { ...overflowFlags.value, [key]: over }
    }
  }

  const observer = new ResizeObserver(() => measure())
  observer.observe(el)
  previewObservers.set(key, observer)
  measure()
}

function updateListQuery(page = currentPage.value, size = pageSize.value) {
  router.replace({
    path: '/user/orders',
    query: { ...route.query, page: String(page), pageSize: String(size) },
    state: { noScroll: true },
  })
}

async function load() {
  try {
    const params: GetOrderListParams = { page: currentPage.value, pageSize: pageSize.value }
    if (filters.value.status !== null) params.status = filters.value.status
    if (Array.isArray(filters.value.dateRange) && filters.value.dateRange.length === 2) {
      params.startDate = filters.value.dateRange[0]
      params.endDate = filters.value.dateRange[1]
    }

    const res = await getOrderList(params)
    const list = (res.data?.orders || []) as OrderListItem[]
    orders.value = list.map((o) => ({ ...o, statusText: calcStatusText(o) }))
    total.value = res.data?.total ?? 0
  } catch {
    orders.value = []
    total.value = 0
  }
}

function viewDetail(orderSn: string) {
  router.push({
    path: `/user/order/${orderSn}`,
    query: { page: String(currentPage.value), pageSize: String(pageSize.value) },
  })
}

function toPay(orderSn: string) {
  router.push({ path: '/payment', query: { orderId: orderSn } })
}

function onPageChange(page: number) {
  updateListQuery(page, pageSize.value)
}

function onPageSizeChange(size: number) {
  updateListQuery(1, size)
}

function onFilterChange() {
  // 仅更新状态，不立即加载，等待点击“筛选”按钮
}

function applyFilters() {
  updateListQuery(1, pageSize.value)
  load() // 筛选需要手动触发 load，因为 query 可能没变（如果已经在第一页）
}

function resetFilters() {
  filters.value = { status: null, dateRange: [] }
  updateListQuery(1, pageSize.value)
  load()
}

onBeforeUnmount(() => {
  previewObservers.forEach((o) => o.disconnect())
  previewObservers.clear()
})

onMounted(load)
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.modern-order-page {
  --bg-color: #f8f9fc;
  --card-bg: #ffffff;
  --text-primary: #1a1b25;
  --text-secondary: #5e6c84;
  --text-tertiary: #94a3b8;
  --accent-color: #4f46e5;
  --accent-gradient: linear-gradient(135deg, #4f46e5, #9333ea);
  --danger-color: #ef4444;
  --border-color: #e2e8f0;
  --card-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
  --card-hover-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025);

  font-family: 'Inter', sans-serif;
  background-color: var(--bg-color);
  color: var(--text-primary);
  min-height: auto;
  padding: 18px 0;
  box-sizing: border-box;
}

/* --- Animations --- */
@keyframes slideFadeBlurIn {
  0% {
    opacity: 0;
    transform: translateY(20px);
    filter: blur(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}

.page-header,
.section-card,
.filter-bar {
  animation: slideFadeBlurIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  animation-play-state: paused;
}

/* 表格行交错动画 */
.modern-table :deep(.el-table__row) {
  animation: slideFadeBlurIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  animation-play-state: paused;
}

/* 当卡片可见时，表格行开始播放 */
.section-card.is-visible .modern-table :deep(.el-table__row) {
  animation-play-state: running;
}

/* 延迟 */
.modern-table :deep(.el-table__row:nth-child(1)) {
  animation-delay: 0.1s;
}
.modern-table :deep(.el-table__row:nth-child(2)) {
  animation-delay: 0.15s;
}
.modern-table :deep(.el-table__row:nth-child(3)) {
  animation-delay: 0.2s;
}
.modern-table :deep(.el-table__row:nth-child(4)) {
  animation-delay: 0.25s;
}
.modern-table :deep(.el-table__row:nth-child(5)) {
  animation-delay: 0.3s;
}
.modern-table :deep(.el-table__row:nth-child(6)) {
  animation-delay: 0.35s;
}
.modern-table :deep(.el-table__row:nth-child(7)) {
  animation-delay: 0.4s;
}
.modern-table :deep(.el-table__row:nth-child(n + 8)) {
  animation-delay: 0.45s;
}

.is-visible {
  animation-play-state: running;
}

/* --- Header --- */
.page-header {
  margin: 0 auto 30px;
  display: flex;
  align-items: baseline;
  gap: 20px;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 15px;
}

.page-title {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.5px;
  margin: 0;
  background: linear-gradient(to right, #1a1b25, #4f46e5);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.step-indicator {
  font-size: 14px;
  font-weight: 600;
  color: var(--accent-color);
  background: #eef2ff;
  padding: 4px 12px;
  border-radius: 99px;
}

/* --- Card --- */
.section-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--card-shadow);
  transition: all 0.3s ease;
  margin: 0 auto;
}

.section-card:hover {
  box-shadow: var(--card-hover-shadow);
}

/* --- Filters --- */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.filter-left {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
}

.filter-select {
  width: 120px;
}

.filter-date {
  width: 240px;
}

.filter-actions {
  display: flex;
  gap: 12px;
}

/* --- Table --- */
.modern-table {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

:deep(.modern-table .el-table__row) {
  height: 64px;
}

:deep(.modern-table .el-table__cell) {
  font-size: 14px;
}

.cell-ellipsis {
  display: flex;
  align-items: center;
  white-space: nowrap;
  overflow: hidden;
}

.cell-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: clip;
  color: var(--text-primary);
}

.blue-ellipsis {
  color: var(--accent-color) !important;
  cursor: pointer;
  padding-left: 4px;
  flex-shrink: 0;
}

.price-text {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  color: var(--text-primary);
}

/* Status Badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

.st-pending {
  background: #fff7ed;
  color: #c2410c;
}
.st-shipping {
  background: #eff6ff;
  color: #1d4ed8;
}
.st-receiving {
  background: #f0fdf4;
  color: #15803d;
}
.st-success {
  background: #f0fdf4;
  color: #15803d;
}
.st-cancel {
  background: #f1f5f9;
  color: #64748b;
}
.st-refund {
  background: #fff7ed;
  color: #c2410c;
}
.st-refund-success {
  background: #f0fdf4;
  color: #15803d;
}
.st-refund-fail {
  background: #fef2f2;
  color: #b91c1c;
}
.st-expired {
  background: #fff7ed;
  color: #ea580c;
}
.st-default {
  background: #f1f5f9;
  color: #64748b;
}

/* Actions */
.action-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.action-link {
  font-size: 13px;
  font-weight: 500;
  color: var(--accent-color);
  cursor: pointer;
  transition: color 0.2s;
}

.action-link:hover {
  color: #4338ca;
  text-decoration: underline;
}

.more-link {
  display: flex;
  align-items: center;
  gap: 2px;
}

.more-link.disabled {
  color: var(--text-tertiary);
  cursor: not-allowed;
  text-decoration: none;
}

/* --- Pagination --- */
.pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

/* --- Custom Select --- */
.custom-select-wrapper {
  position: relative;
  z-index: 10;
}

.select-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 85px;
  justify-content: space-between;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.select-trigger:hover {
  border-color: var(--accent-color);
}

.current-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.arrow-icon {
  font-size: 12px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: var(--text-tertiary);
}

.arrow-icon.is-rotated {
  transform: rotate(180deg);
  color: var(--accent-color);
}

.custom-dropdown-menu {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  min-width: 100px;
  padding: 6px;
  background: var(--bg-color);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  z-index: 1000;
  transform-origin: bottom center;
}

/* 桥接层 */
.custom-dropdown-menu::before {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 100%;
  height: 8px;
  background: transparent;
}

.dropdown-item {
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 2px 0;
  text-align: center;
  position: relative;
  user-select: none;
  border: 1px solid transparent;
}

.dropdown-item:hover {
  background: var(--hover-bg);
  border-color: var(--accent-color);
  color: var(--accent-color);
}

.dropdown-item.is-active {
  background: rgba(79, 70, 229, 0.05);
  color: var(--accent-color);
  font-weight: 700;
}

/* Dropdown Fade Animation */
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(8px) scaleY(0.9) scaleX(0.95);
  filter: blur(4px);
}

.dropdown-fade-enter-to,
.dropdown-fade-leave-from {
  opacity: 1;
  transform: translateY(0) scaleY(1) scaleX(1);
  filter: blur(0);
}

:deep(.el-pagination) {
  background: #f8f9fc;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 4px;
}

:deep(.el-pagination.is-background .el-pager li) {
  background-color: #fff;
  border: none;
  border-radius: 8px;
  color: var(--text-primary);
  font-weight: 600;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  min-width: 28px;
  height: 28px;
  line-height: 28px;
  margin: 0 2px;
}

:deep(.el-pagination.is-background .el-pager li:not(.is-disabled).is-active) {
  background: var(--accent-color) !important;
  color: #fff;
}

:deep(.el-pagination.is-background .el-pager li:not(.is-disabled):hover) {
  background: var(--accent-color);
  color: #fff;
}

:deep(.el-pagination.is-background .btn-prev),
:deep(.el-pagination.is-background .btn-next) {
  background-color: #fff;
  border: none;
  border-radius: 8px;
  width: 28px;
  height: 28px;
  margin: 0 2px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

:deep(.el-pagination.is-background .btn-prev:hover:not(:disabled)),
:deep(.el-pagination.is-background .btn-next:hover:not(:disabled)) {
  background: var(--accent-color);
  color: #fff;
}

/* --- Buttons --- */
.custom-btn {
  height: 36px;
  padding: 0 16px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: #fff;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.custom-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.custom-btn.primary {
  background: var(--accent-color);
  border-color: transparent;
  color: #fff;
}

.custom-btn.primary:hover {
  background: #4338ca;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

.custom-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* --- Dialog --- */
.custom-dialog :deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
}

.custom-dialog :deep(.el-dialog__header) {
  margin: 0;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.custom-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

.custom-dialog :deep(.el-dialog__footer) {
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
  background: #f8fafc;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* Form Styles */
.modern-form :deep(.el-form-item__label) {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

.modern-form :deep(.el-input__wrapper),
.modern-form :deep(.el-textarea__inner) {
  box-shadow: 0 0 0 1px var(--border-color) inset;
  border-radius: 8px;
  padding: 8px 12px;
  transition: all 0.2s;
}

.modern-form :deep(.el-input__wrapper.is-focus),
.modern-form :deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 2px var(--accent-color) inset !important;
}
</style>
