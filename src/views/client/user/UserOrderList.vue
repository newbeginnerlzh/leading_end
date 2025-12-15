<!-- 订单列表：从 mock storage 读取并展示 -->
<template>
  <div>
    <el-card>
      <h3>我的订单</h3>
      <el-table :data="orders" style="width:100%" size="small">
        <el-table-column prop="orderSn" label="订单号" width="160" />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="商品" min-width="200">
          <template #default="{ row }">
            <div>
              <template v-if="row.previewItems && row.previewItems.length === 1">{{ row.previewItems[0].productName }}</template>
              <template v-else-if="row.previewItems && row.previewItems.length > 1">{{ row.previewItems.map((i:any)=>i.productName).join(' / ') }}</template>
              <template v-else>—</template>
            </div>
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
import { getOrderList } from '@/api/order'
import type { OrderListItem } from '@/api/order'

const orders = ref<OrderListItem[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const router = useRouter()

async function load() {
  try {
    const res = await getOrderList({ page: currentPage.value, pageSize: pageSize.value })
    orders.value = (res.data?.orders || []) as OrderListItem[]
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

onMounted(load)
</script>

<style scoped>
h3 { margin: 0 0 12px 0 }
</style>
