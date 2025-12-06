<!-- 支付页：显示订单信息并模拟支付 -->
<template>
  <div class="payment-page">
    <el-card>
      <h3>订单支付</h3>
      <div v-if="!order">加载中或未找到订单</div>
      <div v-else>
        <div>订单号：{{ order.id }}</div>
        <div>创建时间：{{ order.createTime }}</div>
        <div>收货：{{ order.receiverName }} / {{ order.receiverPhone }}</div>
        <div>地址：{{ order.receiverAddress }}</div>
        <el-table :data="order.items" style="width:100%;margin-top:12px" size="small">
          <el-table-column prop="name" label="商品" />
          <el-table-column prop="price" label="单价(¥)" width="120">
            <template #default="{ row }">{{ row.price.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="count" label="数量" width="100" />
        </el-table>

        <div style="margin-top:12px">应付金额：<strong>¥{{ order.totalPrice.toFixed(2) }}</strong></div>

        <div style="margin-top:12px">
          <el-button type="primary" @click="pay">立即支付（模拟）</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getOrderDetail, payOrder } from '@/api/order'

const route = useRoute()
const router = useRouter()
const order = ref<any | null>(null)

async function load() {
  const id = (route.query.orderId as string) || ''
  if (!id) return
  const found = await getOrderDetail(id)
  order.value = found
}

async function pay() {
  if (!order.value) return
  try {
    await payOrder(order.value.id)
    ElMessage.success('支付成功（模拟）')
    router.push({ path: '/user/orders' })
  } catch (e) {
    ElMessage.error('支付失败：' + (e as Error).message)
  }
}

onMounted(load)
</script>

<style scoped>
.payment-page h3 { margin: 0 0 12px 0 }
</style>
