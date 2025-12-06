<!-- 订单列表：从 mock storage 读取并展示 -->
<template>
  <div>
    <el-card>
      <h3>我的订单</h3>
      <el-table :data="orders" style="width:100%" size="small">
        <el-table-column prop="id" label="订单号" />
        <el-table-column prop="createTime" label="创建时间" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">{{ statusText(row.status) }}</template>
        </el-table-column>
        <el-table-column prop="totalPrice" label="金额(¥)" width="120">
          <template #default="{ row }">{{ row.totalPrice.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewDetail(row.id)">查看详情</el-button>
            <el-button v-if="row.status === 10" type="success" size="small" style="margin-left:8px" @click="toPay(row.id)">去支付</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getOrderList } from '@/api/order'

const orders = ref<any[]>([])
const router = useRouter()

function statusText(s: number) {
  switch (s) {
    case 10:
      return '待支付'
    case 20:
      return '待发货'
    case 30:
      return '待收货'
    case 40:
      return '已完成'
    default:
      return '未知'
  }
}

async function load() {
  const res = await getOrderList({ page: 1, pageSize: 50 })
  orders.value = res.list || []
}

function viewDetail(id: string) {
  router.push({ path: `/user/order/${id}` })
}

function toPay(id: string) {
  router.push({ path: '/payment', query: { orderId: id } })
}

onMounted(load)
</script>

<style scoped>
h3 { margin: 0 0 12px 0 }
</style>
