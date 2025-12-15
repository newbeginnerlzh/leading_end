<!-- 订单详情：根据路由参数加载并展示订单 -->
<template>
  <div>
    <el-card>
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <el-button type="text" :icon="ArrowLeft" @click="router.back()">返回</el-button>
        <div style="display:flex;align-items:center;gap:8px;">
          
          <h3 style="margin:0">订单详情</h3>
        </div>
        <div>
          <el-button type="danger" size="small" @click="onDelete">删除订单</el-button>
        </div>
      </div>
      <div v-if="loading">加载中...</div>
      <div v-else-if="!order">未找到订单</div>
      <div v-else>
        <div>订单号：{{ order.orderSn }}</div>
        <div>状态：{{ order.status }}</div>
        <div>创建时间：{{ order.createdAt }}</div>
        <div>收货人：{{ order.receiverName }} / {{ order.receiverPhone }}</div>
        <div>地址：{{ order.receiverProvince }} {{ order.receiverCity }} {{ order.receiverDistrict }} {{ order.receiverDetail }}</div>

        <el-table :data="items" style="width:100%;margin-top:12px" size="small">
          <el-table-column prop="productName" label="商品" />
          <el-table-column prop="price" label="单价(¥)" width="120">
            <template #default="{ row }">{{ (row.price || 0).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="100" />
        </el-table>

        <div style="margin-top:12px">总计：<strong>¥{{ (order.totalAmount || 0).toFixed(2) }}</strong>，实付：<strong>¥{{ (order.payAmount || 0).toFixed(2) }}</strong></div>
        <div style="margin-top:12px">
          <!-- 后端支付接口暂缺，按钮仅做占位，点按提示 -->
          <el-button v-if="order.status === '待付款'" type="success" @click="goPay">去支付</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOrderDetail, updateOrderStatus, deleteOrder, OrderAction } from '@/api/order'
import type { Order, OrderItem } from '@/api/model/orderModel'
import { ElMessageBox, ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const order = ref<Order | null>(null)
const items = ref<OrderItem[]>([])
const loading = ref(true)
const acting = ref(false)
const deleting = ref(false)

async function load() {
  loading.value = true
  const id = route.params.id as string
  if (!id) {
    loading.value = false
    return
  }
  try {
    const res = await getOrderDetail(id)
    const data = (res as { data?: { order?: Order, items?: OrderItem[] } }).data
    order.value = data?.order || null
    items.value = data?.items || []
  } catch {
    order.value = null
    items.value = []
  }
  loading.value = false
}

async function goPay() {
  if (!order.value || acting.value) return
  acting.value = true
  try {
    await updateOrderStatus(order.value.orderSn || '', { action: OrderAction.PAY_ORDER })
    ElMessage.success('支付成功')
    await load()
  } catch (err) {
    ElMessage.error((err as Error).message || '支付失败')
  } finally {
    acting.value = false
  }
}

onMounted(load)

async function onDelete() {
  if (!order.value || deleting.value) return
  try {
    await ElMessageBox.confirm('确认删除该订单？已完成/已取消/退款完成的订单才可删除。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '再想想'
    })
  } catch {
    return
  }

  deleting.value = true
  try {
    await deleteOrder(order.value.orderSn || '')
    ElMessage.success('已删除订单')
    router.replace({ path: '/user/order' })
  } catch (err) {
    ElMessage.error((err as Error).message || '删除失败')
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
h3 { margin: 0 0 12px 0 }
</style>
