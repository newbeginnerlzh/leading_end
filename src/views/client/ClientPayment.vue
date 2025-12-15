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
        <div>收货人：{{ order.receiverName }}</div>
        <div>手机号：{{ order.receiverPhone }}</div>
        <div>地址：{{ order.receiverProvince }} {{ order.receiverCity }} {{ order.receiverDistrict }} {{ order.receiverDetail }}</div>
        <div class="remark">备注：{{ order.buyerRemark ? order.buyerRemark : '（无）' }}</div>
        <div v-if="remainingSeconds > 0" class="countdown">
          <strong>支付倒计时：</strong>
          <span v-if="remainingSeconds > 0">{{ minutes }}:{{ seconds }}</span>
          <span v-else style="color:#e4393c">已超时（订单已过期）</span>
        </div>

        <el-table :data="orderItems" style="width:100%;margin-top:12px" size="small">
          <el-table-column prop="name" label="商品" />
          <el-table-column prop="price" label="单价(¥)" width="120">
            <template #default="{ row }">{{ (row.price || 0).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="count" label="数量" width="100" />
        </el-table>

        <div class="pay-actions">
          <div class="pay-amount">应付金额：<span class="price-highlight">¥{{ (order.payAmount || order.totalAmount || 0).toFixed(2) }}</span></div>
          <div class="buttons">
            <el-button type="primary" @click="pay" :disabled="!isPending">立即支付</el-button>
            <el-button @click="cancelAndAbandon" :disabled="!isPending">放弃支付</el-button>
          </div>
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
import { onBeforeRouteLeave } from 'vue-router'
import { useCartStore } from '@/stores/cart'

const route = useRoute()
const router = useRouter()
const order = ref<any | null>(null)
const orderItems = ref<OrderItem[]>([])
const loading = ref(true)
const remainingSeconds = ref<number>(0)
let timer: number | null = null
const paying = ref(false)
const canceling = ref(false)

const pendingStatuses = new Set(['待付款', '未支付'])
const isPending = computed(() => pendingStatuses.has(order.value?.status || ''))
const orderSnRef = ref<string>('')
let popHandler: (() => void) | null = null

function parseDate(input?: string | number | Date | null): number | null {
  if (!input) return null
  const d = new Date(input as string | number | Date)
  const t = d.getTime()
  return isNaN(t) ? null : t
}

function setupCountdown() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  remainingSeconds.value = 0

  // 优先使用后端过期时间字段（若存在）：expireAt / expiresAt
  const o = order.value as Order | null
  const expireTs = parseDate((o as unknown as { expireAt?: string | number | Date })?.expireAt) ??
                   parseDate((o as unknown as { expiresAt?: string | number | Date })?.expiresAt)
  let endTs = expireTs ?? null
  if (!endTs) {
    // 没有明确过期时间时，按创建时间 +15 分钟作为默认支付时限
    const createdTs = parseDate(o?.createdAt as Date | string | number | null)
    if (createdTs) {
      endTs = createdTs + 15 * 60 * 1000
    }
  }

  const now = Date.now()
  if (!endTs || endTs <= now) {
    remainingSeconds.value = 0
    return
  }
  remainingSeconds.value = Math.floor((endTs - now) / 1000)

  timer = window.setInterval(() => {
    if (remainingSeconds.value > 0) {
      remainingSeconds.value -= 1
    } else {
      clearInterval(timer as number)
      timer = null
    }
  }, 1000)
}

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
    orderSnRef.value = order.value?.orderSn || ''
  } catch {
    order.value = null
    orderItems.value = []
    orderSnRef.value = ''
  }

  // 如果订单不处于待支付状态，直接提示并跳到首页（防止回到支付页）
  if (order.value && order.value.status && !pendingStatuses.has(order.value.status)) {
    ElMessage.success({ message: '订单不在待付款状态，已跳转到商城首页', duration: 1800 })
    router.replace({ path: '/' })
    loading.value = false
    return
  }

  // 设置真实倒计时（若存在过期时间，或按创建时间默认 15 分钟）
  if (order.value) {
    setupCountdown()
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
    const cartStore = useCartStore()
    cartStore.getCloudCart()

    router.replace({ path: `/user/order/${order.value.orderSn}` , query: { fromPay: '1' } })
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
  if (popHandler) {
    window.removeEventListener('popstate', popHandler)
    popHandler = null
  }
})

onMounted(load)

onMounted(() => {
  popHandler = () => {
    if (orderSnRef.value) {
      router.replace({ path: `/user/order/${orderSnRef.value}`, query: { fromPay: '1' } })
    }
  }
  window.addEventListener('popstate', popHandler)
})

onBeforeRouteLeave((_to, _from, next) => {
  if (popHandler) {
    window.removeEventListener('popstate', popHandler)
    popHandler = null
  }
  next()
})
</script>

<style scoped>
.payment-page h3 { margin: 0 0 12px 0 }
.countdown { margin-top: 8px; font-weight: 600; color: #e53935; }
.pay-actions { display: flex; align-items: center; justify-content: flex-end; gap: 16px; margin-top: 16px; }
.pay-amount { font-size: 18px; font-weight: 700; color: #e53935; }
.price-highlight { font-size: 20px; font-weight: 800; color: #e53935; }
.buttons { display: flex; gap: 10px; }
.remark { margin-top: 8px; color: #333; font-weight: 500; }
:deep(.el-table__cell) { font-size: 14px; }
</style>
