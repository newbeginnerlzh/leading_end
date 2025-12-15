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
      </el-form>
      <el-table :data="orders" style="width:100%" size="small">
        <el-table-column prop="orderSn" label="订单号" width="160" />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="商品" min-width="200">
          <template #default="{ row }">
            <div>{{ formatPreview(row.previewItems) }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="statusText" label="状态" width="120" />
        <el-table-column prop="payAmount" label="实付(¥)" width="120">
          <template #default="{ row }">{{ (row.payAmount || row.totalAmount || 0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewDetail(row.orderSn)">查看详情</el-button>
            <el-button v-if="row.statusText === '待付款'" type="success" size="small" style="margin-left:8px" @click="toPay(row.orderSn)">去支付</el-button>
          </template>
        </el-table-column>
      </el-table>
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getOrderList, type GetOrderListParams } from '@/api/order'
import type { OrderListItem, OrderPreviewItem } from '@/api/order'

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
const pageSize = ref(10)
const total = ref(0)
const router = useRouter()

const filters = ref<{ status: number | null; dateRange: string[] | [] }>({ status: null, dateRange: [] })

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

onMounted(load)
</script>

<style scoped>
h3 { margin: 0 0 12px 0 }
</style>
