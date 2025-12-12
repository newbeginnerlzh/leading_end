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
        <div>订单号：{{ order.id }}</div>
        <div>状态：{{ statusText(order.status) }}</div>
        <div>创建时间：{{ order.createTime }}</div>
        <div>收货人：{{ order.receiverName }} / {{ order.receiverPhone }}</div>
        <div>地址：{{ order.receiverAddress }}</div>

        <el-table :data="order.items" style="width:100%;margin-top:12px" size="small">
          <el-table-column prop="name" label="商品" />
          <el-table-column prop="price" label="单价(¥)" width="120">
            <template #default="{ row }">{{ (row.price || 0).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="count" label="数量" width="100" />
        </el-table>

        <div style="margin-top:12px">总计：<strong>¥{{ (order.totalPrice || 0).toFixed(2) }}</strong></div>
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
import { deleteOrder } from '@/api/order'
import { ElMessageBox, ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const order = ref<any | null>(null)
const loading = ref(true)

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
  loading.value = true
  const id = route.params.id as string
  if (!id) {
    loading.value = false
    return
  }
  const res = await getOrderDetail(id)
  order.value = res && Object.keys(res).length ? res : null
  loading.value = false
}

function goPay() {
  if (!order.value) return
  router.push({ path: '/payment', query: { orderId: order.value.id } })
}

onMounted(load)

async function onDelete() {
  if (!order.value) return
  try {
    await ElMessageBox.confirm('确定要删除该订单吗？此操作不可恢复', '删除订单', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteOrder(order.value.id)
    ElMessage.success('订单已删除')
    router.push({ path: '/user/orders' })
  } catch (e) {
    // 如果用户取消或删除失败，都在这里忽略或提示
    if (e && typeof e === 'object' && 'message' in e) {
      ElMessage.error('删除失败：' + (e as Error).message)
    }
  }
}
</script>

<style scoped>
h3 { margin: 0 0 12px 0 }
</style>
