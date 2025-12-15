<!-- 支付页：显示订单信息并模拟支付 -->
<template>
  <div class="payment-page">
    <el-card>
      <h3>订单支付</h3>
      <div v-if="loading">加载中...</div>
      <div v-else-if="!order">未找到订单</div>
      <div v-else>
        <div>订单号：{{ order.orderSn }}</div>
        <div>创建时间：{{ order.createdAt }}</div>
        <div>收货：{{ order.receiverName }} / {{ order.receiverPhone }}</div>
        <div>地址：{{ order.receiverProvince }} {{ order.receiverCity }} {{ order.receiverDistrict }} {{ order.receiverDetail }}</div>
        <div style="margin-top:8px">
          <strong>支付倒计时：</strong>
          <span v-if="remainingSeconds > 0">{{ minutes }}:{{ seconds }}</span>
          <span v-else style="color:#e4393c">已超时（订单已过期）</span>
        </div>

        <el-table :data="orderItems" style="width:100%;margin-top:12px" size="small">
          <el-table-column prop="productName" label="商品" />
          <el-table-column prop="price" label="单价(¥)" width="120">
            <template #default="{ row }">{{ (row.price || 0).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="100" />
        </el-table>

        <div style="margin-top:12px">应付金额：
          <strong>¥{{ (order.payAmount || order.totalAmount || 0).toFixed(2) }}</strong>
        </div>

        <div style="margin-top:12px; display: flex; gap: 10px;">
          <el-button type="primary" @click="pay" :disabled="order.status !== '待付款'">立即支付（占位）</el-button>
          <el-button @click="cancelAndAbandon" :disabled="order.status !== '待付款'">放弃支付</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getOrderDetail } from '@/api/order'
import type { Order, OrderItem } from '@/api/model/orderModel'

const route = useRoute()
const router = useRouter()
const order = ref<Order | null>(null)
const orderItems = ref<OrderItem[]>([])
const loading = ref(true)
// 后端未提供倒计时/过期时间字段，暂设为 0
const remainingSeconds = ref<number>(0)
let timer: number | null = null

const minutes = computed(() => {
  const m = Math.floor(Math.max(0, remainingSeconds.value) / 60)
  return String(m).padStart(2, '0')
})

const seconds = computed(() => {
  const s = Math.floor(Math.max(0, remainingSeconds.value) % 60)
  return String(s).padStart(2, '0')
})

async function load() {
  loading.value = true
  const id = (route.query.orderId as string) || ''
  if (!id) {
    loading.value = false
    return
  }
  try {
    const res = await getOrderDetail(id)
    const data = (res as { data?: { order?: Order, items?: OrderItem[] } }).data
    order.value = data?.order || null
    orderItems.value = data?.items || []
  } catch {
    order.value = null
    orderItems.value = []
  }

  // 如果订单状态不是“待付款”，直接提示并跳到首页（防止回到支付页）
  if (order.value && order.value.status && order.value.status !== '待付款') {
    ElMessage.success({ message: '订单不在待付款状态，已跳转到商城首页', duration: 1800 })
    router.replace({ path: '/' })
    loading.value = false
    return
  }

  loading.value = false
}

async function pay() {
  if (!order.value) return
  // 后端尚未提供支付接口，这里仅展示占位提示
  ElMessage.info('支付接口待后端提供，当前仅为展示状态')
}

// 新增：放弃支付功能
async function cancelAndAbandon() {
  // 后端未提供取消/废弃订单接口，这里仅提示
  await ElMessageBox.alert('后端未提供放弃支付接口，暂无法在此页面取消订单。', '提示', {
    confirmButtonText: '我知道了'
  })
}

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})

onMounted(load)
</script>

<style scoped>
.payment-page h3 { margin: 0 0 12px 0 }
</style>
