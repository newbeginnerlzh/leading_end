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

        <div style="margin-top:12px; display: flex; gap: 10px;">
          <el-button type="primary" @click="pay" :disabled="order.status !== 10 || remainingSeconds <= 0">立即支付（模拟）</el-button>
          <el-button @click="cancelAndAbandon" :disabled="order.status !== 10 || remainingSeconds <= 0">放弃支付</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getOrderDetail, payOrder, cancelOrder } from '@/api/order'
import { useCartStore } from '@/stores/cart'

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
  // 如果订单已处于已支付状态，显示短暂提示并返回商城首页（防止用户通过浏览器返回看到已完成的支付页）
  if (order.value && order.value.status === 20) {
    try {
      ElMessage.success({ message: '此订单已支付，已跳转到商城首页', duration: 2000 })
    } catch (e) {
      // ignore
    }
    router.replace({ path: '/' })
    loading.value = false
    return
  }
  
  // 如果订单已被取消（状态为0），则直接跳转到首页
  if (order.value && order.value.status === 0) {
    try {
      ElMessage.info({ message: '订单已取消，已跳转到商城首页', duration: 2000 })
    } catch (e) {
      // ignore
    }
    router.replace({ path: '/' })
    loading.value = false
    return
  }
  
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
    // 支付成功后，如果订单记录了购物车 sku 列表，则从 Pinia 购物车中物理删除对应条目
    try {
      const cartStore = useCartStore()
      const skuIds: number[] | undefined = (order.value as any).cartSkuIds
      if (Array.isArray(skuIds) && skuIds.length > 0) {
        for (const sku of skuIds) {
          // 串行删除以保持顺序；removeFromCart 会在登录时调用后端接口
          // 忽略单项删除错误，不阻塞导航
          // eslint-disable-next-line no-await-in-loop
          await cartStore.removeFromCart(sku)
        }
      }
    } catch (err) {
      console.error('清理购物车失败', err)
    }
    router.push({ path: '/user/orders' })
  } catch (e) {
    ElMessage.error('支付失败：' + (e as Error).message)
  }
}

// 新增：放弃支付功能
async function cancelAndAbandon() {
  try {
    await ElMessageBox.confirm(
      '确定要放弃支付并取消此订单吗？此操作不可撤销。',
      '确认取消订单',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 调用API取消订单
    await cancelOrder(order.value!.id)
    
    // 更新本地状态
    order.value!.status = 0
    
    // 显示成功消息
    ElMessage.success('订单已取消，已跳转到商城首页')
    
    // 清理倒计时
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    
    // 跳转到首页，防止用户通过返回键返回支付页
    router.replace({ path: '/' })
  } catch (error) {
    // 用户取消操作或API调用失败
    if (error !== 'cancel') {
      ElMessage.error('取消订单失败：' + (error as Error).message)
    }
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
