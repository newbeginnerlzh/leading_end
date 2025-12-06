<!-- 订单详情：根据路由参数加载并展示订单 -->
<template>
  <div>
    <el-card>
      <h3>订单详情</h3>
      <div v-if="!order">加载中或未找到订单</div>
      <div v-else>
        <div>订单号：{{ order.id }}</div>
        <div>状态：{{ statusText(order.status) }}</div>
        <div>创建时间：{{ order.createTime }}</div>
        <div>收货人：{{ order.receiverName }} / {{ order.receiverPhone }}</div>
        <div>地址：{{ order.receiverAddress }}</div>

        <el-table :data="order.items" style="width:100%;margin-top:12px" size="small">
          <el-table-column prop="name" label="商品" />
          <el-table-column prop="price" label="单价(¥)" width="120">
            <template #default="{ row }">{{ row.price.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="count" label="数量" width="100" />
        </el-table>

        <div style="margin-top:12px">总计：<strong>¥{{ order.totalPrice.toFixed(2) }}</strong></div>
        <div style="margin-top:12px">
          <el-button v-if="order.status === 10" type="success" @click="goPay">去支付</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOrderDetail } from '@/api/order'

const route = useRoute()
const router = useRouter()
const order = ref<any | null>(null)

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
  const id = route.params.id as string
  if (!id) return
  const res = await getOrderDetail(id)
  order.value = res
}

function goPay() {
  if (!order.value) return
  router.push({ path: '/payment', query: { orderId: order.value.id } })
}

onMounted(load)
</script>

<style scoped>
h3 { margin: 0 0 12px 0 }
</style>
