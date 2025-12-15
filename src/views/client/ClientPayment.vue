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
        <div v-if="remainingSeconds > 0" style="margin-top:8px">
          <strong>支付倒计时：</strong>
          <span>{{ minutes }}:{{ seconds }}</span>
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
          <el-button type="primary" @click="pay" :disabled="!isPending">立即支付（占位）</el-button>
          <el-button @click="cancelAndAbandon" :disabled="!isPending">放弃支付</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getOrderDetail, updateOrderStatus, OrderAction } from '@/api/order'
import type { Order, OrderItem } from '@/api/model/orderModel'

const route = useRoute()
const router = useRouter()
const order = ref<Order | null>(null)
const orderItems = ref<OrderItem[]>([])
const loading = ref(true)
const paying = ref(false)
const canceling = ref(false)
// 后端未提供倒计时/过期时间字段，暂设为 0
const remainingSeconds = ref<number>(0)
let timer: number | null = null

const pendingStatuses = new Set(['待付款', '未支付'])
const isPending = computed(() => pendingStatuses.has(order.value?.status || ''))

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

  // 如果订单不处于待支付状态，直接提示并跳到首页（防止回到支付页）
  if (order.value && order.value.status && !pendingStatuses.has(order.value.status)) {
    ElMessage.success({ message: '订单不在待付款状态，已跳转到商城首页', duration: 1800 })
    router.replace({ path: '/' })
    loading.value = false
    return
  }

  loading.value = false
}

async function pay() {
  if (!order.value) return
  if (paying.value) return
  paying.value = true
  try {
    await updateOrderStatus(order.value.orderSn || '', { action: OrderAction.PAY_ORDER })
    ElMessage.success('支付成功')
    router.replace({ path: `/user/order/${order.value.orderSn}` })
  } catch (err) {
    ElMessage.error((err as Error).message || '支付失败')
  } finally {
    paying.value = false
  }
}

// 新增：放弃支付功能
async function cancelAndAbandon() {
  if (!order.value || canceling.value) return
  try {
    await ElMessageBox.confirm('确认放弃支付并取消订单吗？', '提示', { confirmButtonText: '确定', cancelButtonText: '再想想' })
  } catch {
    return
  }

  canceling.value = true
  try {
    await updateOrderStatus(order.value.orderSn || '', { action: OrderAction.CANCEL_ORDER, reason: '用户放弃支付' })
    ElMessage.success('已取消订单')
    router.replace({ path: '/' })
  } catch (err) {
    ElMessage.error((err as Error).message || '取消失败')
  } finally {
    canceling.value = false
  }
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
