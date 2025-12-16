<!-- 订单列表：从 mock storage 读取并展示 -->
<template>
  <div>
    <el-card>
      <h3>我的订单</h3>
      <el-form inline style="margin-bottom:12px" :model="filters" label-width="80px" size="small">
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable style="width:160px" @change="onFilterChange">
            <el-option v-for="opt in statusOptions" :key="opt.value ?? 'all'" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="onFilterChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="applyFilters">筛选</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>

        <el-form-item label="每页显示">
          <el-select v-model="pageSize" size="small" style="width:110px" @change="onPageSizeChange">
            <el-option v-for="size in pageSizeOptions" :key="size" :label="`${size} 条`" :value="size" />
          </el-select>
        </el-form-item>

        




      </el-form>
      <el-table :data="orders" class="order-table" style="width:100%" size="small">
        <el-table-column prop="orderSn" label="订单号" width="160" />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="商品" min-width="200">
          <template #default="{ row }">
            <div class="cell-ellipsis">
              <span class="cell-text" :ref="(el) => setPreviewTextEl(row.orderSn, el as HTMLElement | null)">{{ formatPreview(row.previewItems) }}</span>
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
        <el-table-column prop="statusText" label="状态" width="120">
          <template #default="{ row }">
            <span class="status-tag" :class="statusClass(row.statusText)">{{ row.statusText }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="payAmount" label="实付(¥)" width="120">
          <template #default="{ row }">{{ (row.payAmount || row.totalAmount || 0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="260">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewDetail(row.orderSn)">查看详情</el-button>
            <el-dropdown
              trigger="click"
              style="margin-left:8px"
              @command="onMoreCommandWrapper(row)"
            >
              <el-button type="success" size="small" :disabled="availableMoreActions(row).length === 0">
                更多
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-for="act in availableMoreActions(row)"
                    :key="act.command"
                    :command="act.command"
                  >
                    {{ act.label }}
                  </el-dropdown-item>
                  <el-dropdown-item v-if="availableMoreActions(row).length === 0" disabled>暂无可用操作</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
      <el-dialog v-model="refundDialogVisible" title="申请退款" width="420px" :close-on-click-modal="false">
        <el-form label-width="80px">
          <el-form-item label="退款理由">
            <el-input v-model="refundReason" type="textarea" :rows="3" placeholder="请填写退款理由" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="refundDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="refunding" @click="submitRefund">确定</el-button>
        </template>
      </el-dialog>
      <div style="display:flex;justify-content:flex-end;margin-top:12px;">
        <el-pagination
          background
          layout="prev, pager, next"
          :total="total"
          :page-size="pageSize"
          :current-page="currentPage"
          @current-change="onPageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowDown } from '@element-plus/icons-vue'
import { getOrderList, updateOrderStatus, deleteOrder, OrderAction, type GetOrderListParams } from '@/api/order'
import type { OrderListItem, OrderPreviewItem } from '@/api/order'
import { ElMessage, ElMessageBox } from 'element-plus'

type OrderListView = OrderListItem & { statusText: string }

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

const orders = ref<OrderListView[]>([])
const currentPage = ref(1)
const pageSize = ref(7)
const total = ref(0)
const router = useRouter()

const pageSizeOptions = [7, 10, 20, 50]

const filters = ref<{ status: number | null; dateRange: string[] | [] }>({ status: null, dateRange: [] })
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

function onMoreCommandWrapper(row: OrderListView) {
  return (cmd: 'pay' | 'refund' | 'delete') => handleMoreCommand(cmd, row)
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

    orders.value = orders.value.map((o) => (o.orderSn === refundTargetSn.value ? { ...o, statusText: '退款中', status: '退款中' } : o))
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
    await ElMessageBox.alert('仅状态为“已完成/已取消/退款成功”的订单可以删除。当前状态不支持删除。', '无法删除', {
      confirmButtonText: '我知道了',
      type: 'info'
    })
    return
  }

  try {
    await ElMessageBox.confirm('确认删除该订单？删除后不可恢复。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '再想想',
      type: 'warning'
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
    orders.value = list.map((o) => ({ ...o, statusText: statusTextOf((o as OrderListItem).status) }))
    total.value = res.data?.total ?? 0
  } catch {
    orders.value = []
    total.value = 0
  }
}

function viewDetail(orderSn: string) {
  router.push({ path: `/user/order/${orderSn}` })
}

function toPay(orderSn: string) {
  router.push({ path: '/payment', query: { orderId: orderSn } })
}

function onPageChange(page: number) {
  currentPage.value = page
  load()
}

function onPageSizeChange(size: number) {
  pageSize.value = size
  currentPage.value = 1
  load()
}

function onFilterChange() {
  currentPage.value = 1
}

function applyFilters() {
  currentPage.value = 1
  load()
}

function resetFilters() {
  filters.value = { status: null, dateRange: [] }
  currentPage.value = 1
  load()
}

onBeforeUnmount(() => {
  previewObservers.forEach((o) => o.disconnect())
  previewObservers.clear()
})

onMounted(load)
</script>

<style scoped>
h3 { margin: 0 0 12px 0 }

/* 固定行高 + 放大字体 */
:deep(.order-table .el-table__row) { height: 56px; }
:deep(.order-table .el-table__cell) { font-size: 14px; }

.cell-ellipsis { display: flex; align-items: center; white-space: nowrap; overflow: hidden; }
.cell-text { flex: 1; min-width: 0; overflow: hidden; text-overflow: clip; }
.blue-ellipsis { color: #1677ff !important; cursor: pointer; padding-left: 4px; flex-shrink: 0; }

.status-tag { font-weight: 600; }
.st-pending { color: #e6a23c; }
.st-shipping { color: #409eff; }
.st-receiving { color: #67c23a; }
.st-success { color: #2e7d32; }
.st-cancel { color: #909399; }
.st-refund { color: #e6a23c; }
.st-refund-success { color: #67c23a; }
.st-refund-fail { color: #f56c6c; }
.st-default { color: #606266; }


</style>
