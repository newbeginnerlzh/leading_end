<!-- 订单详情：根据路由参数加载并展示订单 -->
<template>
  <div class="order-detail-page">
    <el-card shadow="hover">
      <div class="card-header">
        <div class="left">
          <div class="title-block">
            <h3>订单详情</h3>
            <div class="sub">订单号：{{ order?.orderSn || '—' }}</div>
          </div>
        </div>
        <div class="right">
          <el-button type="primary" size="small" @click="onBack">返回订单列表</el-button>
        </div>
      </div>

      <div class="status-row" v-if="order">
        <div>状态：<span class="status-text" :class="statusClass(order.status)">{{ order.status || '未知状态' }}</span></div>
        <div class="amount-highlight">应付：{{ formatMoney(order?.payAmount ?? order?.totalAmount) }}</div>
      </div>

      <div v-if="loading" class="loading-wrap">加载中...</div>
      <div v-else-if="!order" class="loading-wrap">未找到订单</div>
      <div v-else class="detail-body">
        <el-row :gutter="16">
          <el-col :span="16">
            <el-card class="section" shadow="never">
              <div class="section-title">收货信息</div>
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="收货人">{{ order.receiverName || '—' }}</el-descriptions-item>
                <el-descriptions-item label="手机号">{{ order.receiverPhone || '—' }}</el-descriptions-item>
                <el-descriptions-item label="收货地址">{{ formatAddress(order) }}</el-descriptions-item>
                <el-descriptions-item label="买家留言">{{ order.buyerRemark || '（无）' }}</el-descriptions-item>
              </el-descriptions>
            </el-card>

            <el-card class="section" shadow="never">
              <div class="section-title">金额与支付</div>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="商品总额">{{ formatMoney(order.totalAmount) }}</el-descriptions-item>
                <el-descriptions-item label="折扣">{{ formatMoney(order.discountAmount) }}</el-descriptions-item>
                <el-descriptions-item label="运费">{{ formatMoney(order.shippingFee) }}</el-descriptions-item>
                <el-descriptions-item label="实付金额">{{ formatMoney(order.payAmount ?? order.totalAmount) }}</el-descriptions-item>
                <el-descriptions-item label="支付方式">{{ formatPayment(order.paymentMethod) }}</el-descriptions-item>
                <el-descriptions-item label="支付时间">{{ formatDate(order.payTime) }}</el-descriptions-item>
              </el-descriptions>
            </el-card>

            <el-card class="section" shadow="never">
              <div class="section-title">物流信息</div>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="配送方式">{{ order.shippingMethod || '—' }}</el-descriptions-item>
                <el-descriptions-item label="运单号">{{ order.trackingNumber || '—' }}</el-descriptions-item>
                <el-descriptions-item label="发货时间">{{ formatDate(order.shippingTime) }}</el-descriptions-item>
                <el-descriptions-item label="收货时间">{{ formatDate(order.confirmTime) }}</el-descriptions-item>
              </el-descriptions>
            </el-card>

            <el-card class="section" shadow="never">
              <div class="section-title">商品清单</div>
              <el-table :data="items" class="item-table" size="small" v-loading="loading">
                <el-table-column label="商品" min-width="180">
                  <template #default="{ row }">
                    <div class="item-info">
                      <img v-if="row.mainImage" :src="row.mainImage" alt="商品" class="thumb" />
                      <div class="item-text">
                        <div class="name">{{ row.productName || '—' }}</div>
                        <div class="spec" v-if="row.skuSpecs && Object.keys(row.skuSpecs).length">规格：{{ formatSpecs(row.skuSpecs) }}</div>
                      </div>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="price" label="单价" width="120">
                  <template #default="{ row }">{{ formatMoney(row.price) }}</template>
                </el-table-column>
                <el-table-column prop="quantity" label="数量" width="100" />
                <el-table-column prop="totalPrice" label="小计" width="120">
                  <template #default="{ row }">{{ formatMoney(row.totalPrice ?? (row.price || 0) * (row.quantity || 0)) }}</template>
                </el-table-column>
                <el-table-column prop="afterSaleStatus" label="售后状态" width="140">
                  <template #default="{ row }">{{ row.afterSaleStatus || '—' }}</template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-col>

          <el-col :span="8">
            <el-card class="section" shadow="never">
              <div class="section-title">时间线</div>
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="创建时间">{{ formatDate(order.createdAt) }}</el-descriptions-item>
                <el-descriptions-item label="支付时间">{{ formatDate(order.payTime) }}</el-descriptions-item>
                <el-descriptions-item label="发货时间">{{ formatDate(order.shippingTime) }}</el-descriptions-item>
                <el-descriptions-item label="收货时间">{{ formatDate(order.confirmTime) }}</el-descriptions-item>
                <el-descriptions-item label="取消时间">{{ formatDate(order.cancelTime) }}</el-descriptions-item>
              </el-descriptions>
            </el-card>

            <el-card class="section" shadow="never">
              <div class="section-title">操作</div>
              <div class="actions">

                <el-button
                  v-if="isRefundable(order?.status)"
                  type="warning"
                  @click="openRefund"
                  :loading="refunding"
                  class="full-btn"
                >申请退款</el-button>

                <el-button 
                  v-if="order.status === '待付款'" 
                  type="success" 
                  @click="goPay" 
                  :loading="acting"
                  class="full-btn"
                  >去支付</el-button>

                <el-button type="danger" @click="onDelete" class="full-btn">删除订单</el-button>
                
              </div>
              <div class="cancel-reason" v-if="order.cancelReason">
                取消原因：{{ order.cancelReason }}
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
      <el-dialog v-model="refundDialogVisible" title="申请退款" width="420px" :close-on-click-modal="false">
        <el-form label-width="80px">
          <el-form-item label="退款理由">
            <el-input v-model="refundReason" type="textarea" :rows="3" placeholder="请填写退款理由" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="refundDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="refunding" @click="submitRefund">确定</el-button>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOrderDetail, deleteOrder, updateOrderStatus, OrderAction } from '@/api/order'
import type { Order, OrderItem } from '@/api/model/orderModel'
import { ElMessageBox, ElMessage } from 'element-plus'


const route = useRoute()
const router = useRouter()
const order = ref<Order | null>(null)
const items = ref<OrderItem[]>([])
const loading = ref(true)
const acting = ref(false)
const deleting = ref(false)
const refundDialogVisible = ref(false)
const refundReason = ref('')
const refunding = ref(false)

function formatMoney(val?: number | null) {
  const num = typeof val === 'number' ? val : 0
  return `¥${num.toFixed(2)}`
}

function formatAddress(o: Order | null) {
  if (!o) return '—'
  const parts = [o.receiverProvince, o.receiverCity, o.receiverDistrict, o.receiverDetail].filter(Boolean)
  return parts.length ? parts.join(' ') : '—'
}

function formatDate(val?: Date | string | number | null) {
  if (!val) return '—'
  const d = new Date(val)
  if (Number.isNaN(d.getTime())) return '—'
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`
}

function formatPayment(method?: string | null) {
  if (!method) return '—'
  const map: Record<string, string> = {
    alipay: '支付宝',
    wechat: '微信支付',
    card: '银行卡',
    cod: '货到付款',
    unpaid: '未支付',
  }
  return map[method] || method
}

// 收紧规格类型，移除 any
type SkuSpecs = Record<string, string | number>
function formatSpecs(specs: SkuSpecs) {
  return Object.entries(specs)
    .map(([k, v]) => `${k}:${String(v)}`)
    .join('；')
}

function statusClass(text?: string | null) {
  switch (text) {
    case '待付款':
      return 'st-pending'
    case '待发货':
      return 'st-shipping'
    case '待收货':
      return 'st-receiving'
    case '已完成':
      return 'st-success'
    case '已取消':
      return 'st-cancel'
    case '退款中':
      return 'st-refund'
    case '退款成功':
      return 'st-refund-success'
    case '退款失败':
      return 'st-refund-fail'
    default:
      return 'st-default'
  }
}

function isRefundable(text?: string | null) {
  return ['待发货', '待收货', '已完成'].includes(text || '')
}

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
    router.push({ path: '/payment', query: { orderId: order.value.orderSn || '' } })
  } finally {
    acting.value = false
  }
}

function openRefund() {
  if (!order.value) return
  refundReason.value = ''
  refundDialogVisible.value = true
}

async function submitRefund() {
  if (!order.value || refunding.value) return
  refunding.value = true
  try {
    const reason = refundReason.value?.trim() || null
    await updateOrderStatus(order.value.orderSn || '', { action: OrderAction.APPLY_REFUND, reason })
    // TODO 若需记录取消原因/时间字段，请与后端确认返回字段后补充
    order.value = { ...order.value, status: '退款中' }
    refundDialogVisible.value = false
    ElMessage.success('已提交退款，状态更新为退款中')
  } catch (err) {
    ElMessage.error((err as Error).message || '申请退款失败')
  } finally {
    refunding.value = false
  }
}

onMounted(load)


async function onDelete() {
  if (!order.value || deleting.value) return
  const allowed = new Set(['已完成', '已取消', '退款成功'])
  const status = order.value.status || ''
  if (!allowed.has(status)) {
    await ElMessageBox.alert('仅状态为“已完成/已取消/退款成功”的订单可以删除。当前状态不支持删除。', '无法删除', {
      confirmButtonText: '我知道了',
      type: 'info'
    })
    return
  }

  try {
    await ElMessageBox.confirm('确认删除该订单？删除后不可恢复。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '再想想',
      type: 'warning'
    })
  } catch {
    return
  }

  deleting.value = true
  try {
    await deleteOrder(order.value.orderSn || '')
    ElMessage.success('已删除订单')
    router.replace({ path: '/user/orders' })
  } catch (err) {
    ElMessage.error((err as Error).message || '删除失败')
  } finally {
    deleting.value = false
  }
}

function onBack() {
  router.push({ path: '/user/orders' })
}
</script>

<style scoped>
.order-detail-page { padding: 12px; }
.card-header { display: flex; align-items: center; justify-content: space-between; }
.left { display: flex; align-items: center; gap: 12px; }
.title-block h3 { margin: 0; }
.title-block .sub { color: #666; font-size: 13px; margin-top: 2px; }
.right { display: flex; align-items: center; gap: 12px; }
.status-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0 4px; color: #333; font-weight: 600; }
.amount-highlight { font-weight: 700; color: #e53935; }
.status-text { font-weight: 700; }
.st-pending { color: #e6a23c; }
.st-shipping { color: #409eff; }
.st-receiving { color: #67c23a; }
.st-success { color: #2e7d32; }
.st-cancel { color: #909399; }
.st-refund { color: #e6a23c; }
.st-refund-success { color: #67c23a; }
.st-refund-fail { color: #f56c6c; }
.st-default { color: #606266; }
.loading-wrap { padding: 24px; text-align: center; color: #666; }
.detail-body { margin-top: 12px; }
.section { margin-bottom: 12px; }
.section-title { font-weight: 700; margin-bottom: 8px; }
.item-table :deep(.el-table__cell) { font-size: 13px; }
.item-info { display: flex; align-items: center; gap: 10px; }
.thumb { width: 48px; height: 48px; object-fit: cover; border-radius: 4px; background: #f6f6f6; }
.item-text .name { font-weight: 600; }
.item-text .spec { color: #666; font-size: 12px; }
.actions { display: flex; flex-direction: column; gap: 8px; }
.actions .full-btn { width: 100%; }
.cancel-reason { margin-top: 8px; color: #666; }
</style>
