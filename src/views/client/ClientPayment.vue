<!-- 支付页：显示订单信息并模拟支付 -->
<template>
  <div class="payment-page">
    <el-card>
      <h3>订单支付</h3>
      <div v-if="loading">加载中...</div>
      <div v-else-if="!order">未找到订单</div>
      <div v-else>
        <div>订单号：{{ order.id }}</div>
        <div>创建时间：{{ order.createTime }}</div>
        <div>收货：{{ order.receiverName }} / {{ order.receiverPhone }}</div>
        <div>地址：{{ order.receiverAddress }}</div>
        <div style="margin-top:8px">
          <strong>支付倒计时：</strong>
          <span v-if="remainingSeconds > 0">{{ minutes }}:{{ seconds }}</span>
          <span v-else style="color:#e4393c">已超时（订单已过期）</span>
        </div>

        <el-table :data="order.items" style="width:100%;margin-top:12px" size="small">
          <el-table-column prop="name" label="商品" />
          <el-table-column prop="price" label="单价(¥)" width="120">
            <template #default="{ row }">{{ (row.price || 0).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="count" label="数量" width="100" />
        </el-table>

        <div style="margin-top:12px">应付金额：<strong>¥{{ (order.totalPrice || 0).toFixed(2) }}</strong></div>

        <div style="margin-top:12px">
          <el-button type="primary" @click="pay" :disabled="order.status !== 10 || remainingSeconds <= 0">立即支付（模拟）</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getOrderDetail, payOrder } from '@/api/order'
import { cancelOrder } from '@/api/order'

const route = useRoute()
const router = useRouter()
const order = ref<any | null>(null)
const loading = ref(true)
const remainingSeconds = ref<number>(0)
let timer: any = null

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
  const res = await getOrderDetail(id)
  order.value = res && Object.keys(res).length ? res : null
  // 计算倒计时：10 分钟从订单创建时间开始
  if (order.value && order.value.createTime) {
    const createTs = new Date(order.value.createTime).getTime()
    const expireTs = createTs + 10 * 60 * 1000
    const now = Date.now()
    remainingSeconds.value = Math.max(0, Math.floor((expireTs - now) / 1000))
    if (remainingSeconds.value <= 0 && order.value.status === 10) {
      // 已过期且仍为待支付，标记为未支付/过期
      try {
        await cancelOrder(order.value.id)
        order.value.status = 0
        ElMessage.warning('订单已超时，标记为未支付')
      } catch {
        // ignore
      }
    }
    // 启动定时器
    if (!timer) {
      timer = setInterval(() => {
        remainingSeconds.value = Math.max(0, remainingSeconds.value - 1)
        if (remainingSeconds.value <= 0) {
          // 超时处理
          if (order.value && order.value.status === 10) {
            cancelOrder(order.value.id).then(() => {
              order.value!.status = 0
              ElMessage.warning('订单已超时，标记为未支付')
            }).catch(() => {})
          }
          if (timer) {
            clearInterval(timer)
            timer = null
          }
        }
      }, 1000)
    }
  }

  loading.value = false
}

async function pay() {
  if (!order.value) return
  try {
    await payOrder(order.value.id)
    ElMessage.success('支付成功（模拟）')
    // 更新本地状态以反映已支付
    order.value.status = 20
    // 清理倒计时
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    router.push({ path: '/user/orders' })
  } catch (e) {
    ElMessage.error('支付失败：' + (e as Error).message)
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
