<!-- 订单详情：根据路由参数加载并展示订单 -->
<template>
  <div class="order-detail-page">
    <!-- 顶部导航 -->
    <div class="page-header">
      <div class="header-left-group">
        <div class="header-left" @click="onBack">
          <span class="back-arrow">&larr;</span>
          <span>返回列表</span>
        </div>
        <div class="header-title">订单详情</div>
      </div>
      <div class="header-actions">
        <el-button
          v-if="isRefundable(order?.status)"
          @click="openRefund"
          :loading="refunding"
          size="small"
        >申请退款</el-button>

        <el-button
          v-if="order?.status === '待付款'"
          type="primary"
          size="small"
          @click="goPay"
          :loading="acting"
        >去支付</el-button>

        <el-button
           type="danger"
           plain
           size="small"
           @click="onDelete"
        >删除订单</el-button>
      </div>
    </div>

    <el-card class="main-card-wrapper">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-wrap">
        <el-skeleton :rows="5" animated />
      </div>

      <!-- 空状态 -->
      <div v-else-if="!order" class="empty-wrap">
        <el-empty description="未找到订单信息" />
      </div>

      <!-- 主要内容 -->
      <div v-else class="content-container">
        <!-- 状态概览卡片 -->
        <el-card class="status-card" shadow="never">
          <div class="status-header">
            <div class="status-left">
              <div class="status-text" :class="statusClass(order.status)">
                {{ order.status }}
              </div>
              <div class="order-sn">订单号：{{ order.orderSn }}</div>
            </div>
            <div class="status-right">
               <div class="total-price-block">
                 <span class="label">应付金额</span>
                 <span class="price">{{ formatMoney(order.payAmount ?? order.totalAmount) }}</span>
               </div>
            </div>
          </div>

          <!-- 进度条：仅在正常流程下显示 -->
          <div class="order-steps" v-if="showSteps">
            <el-steps :active="activeStep" align-center finish-status="success">
              <el-step title="提交订单" :description="formatDate(order.createdAt)" />
              <el-step title="支付订单" :description="formatDate(order.payTime)" />
              <el-step title="平台发货" :description="formatDate(order.shippingTime)" />
              <el-step title="确认收货" :description="formatDate(order.confirmTime)" />
            </el-steps>
          </div>

          <!-- 特殊状态提示 -->
          <div v-else class="status-alert">
             <el-alert
               v-if="order.status === '已取消'"
               title="订单已取消"
               :description="order.cancelReason ? `取消原因：${order.cancelReason}` : ''"
               type="info"
               show-icon
               :closable="false"
             />
             <el-alert
               v-else-if="order.status && order.status.includes('退款')"
               :title="order.status"
               :description="order.cancelReason ? `退款原因：${order.cancelReason}` : ''"
               type="warning"
               show-icon
               :closable="false"
             />
          </div>
        </el-card>

        <!-- 中间行：收货、追踪、费用 -->
        <el-row :gutter="20" class="middle-row">
          <!-- 收货与物流 -->
          <el-col :span="8">
            <el-card class="info-card" shadow="never">
              <template #header>
                <div class="card-title">收货与物流</div>
              </template>
              <div class="info-list">
                <div class="info-item">
                  <span class="info-label">收货人</span>
                  <div class="info-content">
                    <span class="name">{{ order.receiverName }}</span>
                    <span class="phone">{{ order.receiverPhone }}</span>
                  </div>
                </div>
                <div class="info-item">
                  <span class="info-label">地址</span>
                  <div class="info-content">{{ formatAddress(order) }}</div>
                </div>
                <div class="info-item">
                  <span class="info-label">配送</span>
                  <div class="info-content">
                    <div>{{ order.shippingMethod || '—' }}</div>
                    <div v-if="order.trackingNumber" class="tracking-no">单号：{{ order.trackingNumber }}</div>
                  </div>
                </div>
                <div class="info-item" v-if="order.buyerRemark">
                  <span class="info-label">备注</span>
                  <div class="info-content">{{ order.buyerRemark }}</div>
                </div>
              </div>
            </el-card>
          </el-col>

          <!-- 订单追踪 -->
          <el-col :span="8">
            <el-card class="info-card" shadow="never">
               <template #header>
                <div class="card-title">订单追踪</div>
              </template>
               <el-timeline>
                  <el-timeline-item
                    v-for="(activity, index) in timelineItems"
                    :key="index"
                    :type="index === timelineItems.length - 1 ? 'primary' : ''"
                    :timestamp="activity.timestamp"
                    :hollow="index !== timelineItems.length - 1"
                  >
                    {{ activity.content }}
                  </el-timeline-item>
               </el-timeline>
            </el-card>
          </el-col>

          <!-- 费用明细 -->
          <el-col :span="8">
            <el-card class="info-card" shadow="never">
              <template #header>
                <div class="card-title">费用明细</div>
              </template>
              <div class="price-summary">
                <div class="summary-row">
                  <span class="label">商品总额</span>
                  <span class="value">{{ formatMoney(order.totalAmount) }}</span>
                </div>
                <div class="summary-row">
                  <span class="label">运费</span>
                  <span class="value">+ {{ formatMoney(order.shippingFee) }}</span>
                </div>
                <div class="summary-row">
                  <span class="label">优惠</span>
                  <span class="value discount">- {{ formatMoney(order.discountAmount) }}</span>
                </div>
                <div class="summary-row" v-if="order.paymentMethod">
                  <span class="label">支付方式</span>
                  <span class="value">{{ formatPayment(order.paymentMethod) }}</span>
                </div>
                <div class="summary-divider"></div>
                <div class="summary-row total">
                  <span class="label">实付款</span>
                  <span class="value final-price">{{ formatMoney(order.payAmount ?? order.totalAmount) }}</span>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- 底部：商品清单 -->
        <el-card class="info-card full-width-card" shadow="never">
          <template #header>
            <div class="card-title">商品信息</div>
          </template>
          <el-table :data="items" class="goods-table" :header-cell-style="{background:'#f8f9fa', color:'#606266'}">
            <el-table-column label="商品详情" min-width="240">
              <template #default="{ row }">
                <div class="goods-info">
                  <el-image :src="row.mainImage" class="goods-thumb" fit="cover">
                    <template #error>
                      <div class="image-slot">
                        <span class="text-xs">无图</span>
                      </div>
                    </template>
                  </el-image>
                  <div class="goods-meta">
                    <div class="goods-name">{{ row.productName }}</div>
                    <div class="goods-spec" v-if="row.skuSpecs && Object.keys(row.skuSpecs).length">
                      {{ formatSpecs(row.skuSpecs) }}
                    </div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="price" label="单价" width="120" align="center">
              <template #default="{ row }">{{ formatMoney(row.price) }}</template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="100" align="center" />
            <el-table-column label="小计" width="140" align="right">
              <template #default="{ row }">
                <span class="subtotal">{{ formatMoney(row.totalPrice ?? (row.price || 0) * (row.quantity || 0)) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="afterSaleStatus" label="售后" width="100" align="center">
               <template #default="{ row }">
                  <el-tag v-if="row.afterSaleStatus" size="small" type="info">{{ row.afterSaleStatus }}</el-tag>
                  <span v-else class="text-gray">-</span>
               </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>
    </el-card>

    <!-- Dialog -->
    <el-dialog v-model="refundDialogVisible" title="申请退款" width="420px" :close-on-click-modal="false" destroy-on-close>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
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

// Computed Properties
const activeStep = computed(() => {
  const s = order.value?.status
  if (!s) return 0
  switch (s) {
    case '待付款': return 1
    case '待发货': return 2
    case '待收货': return 3
    case '已完成': return 4
    default: return 0
  }
})

const showSteps = computed(() => {
  const s = order.value?.status
  return ['待付款', '待发货', '待收货', '已完成'].includes(s || '')
})

const timelineItems = computed(() => {
  const o = order.value
  if (!o) return []
  const list = [
    { content: '订单创建', timestamp: formatDate(o.createdAt), show: !!o.createdAt },
    { content: '支付成功', timestamp: formatDate(o.payTime), show: !!o.payTime },
    { content: '平台发货', timestamp: formatDate(o.shippingTime), show: !!o.shippingTime },
    { content: '确认收货', timestamp: formatDate(o.confirmTime), show: !!o.confirmTime },
    { content: '订单取消', timestamp: formatDate(o.cancelTime), show: !!o.cancelTime },
  ]
  return list.filter(i => i.show)
})

function formatMoney(val?: number | null) {
  const num = typeof val === 'number' ? val : 0
  return `¥${num.toFixed(2)}`
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

function formatAddress(o: Order | null) {
  if (!o) return ''
  const parts = [o.receiverProvince, o.receiverCity, o.receiverDistrict, o.receiverDetail].filter(Boolean)
  return parts.length ? parts.join(' ') : ''
}

function formatDate(val?: Date | string | number | null) {
  if (!val) return ''
  const d = new Date(val)
  if (Number.isNaN(d.getTime())) return ''
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`
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
    case '待付款': return 'st-pending'
    case '待发货': return 'st-shipping'
    case '待收货': return 'st-receiving'
    case '已完成': return 'st-success'
    case '已取消': return 'st-cancel'
    case '退款中': return 'st-refund'
    case '退款成功': return 'st-refund-success'
    case '退款失败': return 'st-refund-fail'
    default: return 'st-default'
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
    await ElMessageBox.alert('仅状态为已完成/已取消/退款成功的订单可以删除。当前状态不支持删除。', '无法删除', {
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
.order-detail-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Header */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 12px 0;
  min-height: 50.5px;
  color: #606266;
}
.header-left-group {
  display: flex;
  align-items: center;
}
.header-left {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.2s;
  font-size: 14px;
}
.header-left:hover {
  color: #409eff;
}
.back-arrow {
  font-size: 16px;
  font-weight: bold;
}
.header-title {
  margin-left: 12px;
  padding-left: 12px;
  border-left: 1px solid #dcdfe6;
  font-size: 24px;
  font-weight: 600;
  line-height: 1;
  color: #1f2329;
}
.header-actions {
  display: flex;
  gap: 12px;
}

/* Loading & Empty */
.loading-wrap, .empty-wrap {
  background: #fff;
  padding: 40px;
  border-radius: 8px;
}

/* Status Card */
.status-card {
  border-radius: 8px;
  margin-bottom: 20px;
}
.status-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}
.status-left .status-text {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
}
.status-left .order-sn {
  color: #909399;
  font-size: 13px;
}
.status-right .total-price-block {
  text-align: right;
}
.status-right .label {
  color: #606266;
  font-size: 14px;
  margin-right: 8px;
}
.status-right .price {
  color: #f56c6c;
  font-size: 24px;
  font-weight: bold;
  font-family: DIN, 'Roboto', sans-serif;
}

/* Steps */
.order-steps {
  padding: 0 40px;
}

/* Middle Row */
.middle-row {
  margin-bottom: 20px;
}

/* Info Cards */
.info-card {
  border-radius: 8px;
  margin-bottom: 20px;
  overflow: hidden;
  height: 100%;
}
.card-title {
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}

/* Goods Table */
.goods-info {
  display: flex;
  align-items: center;
  gap: 12px;
}
.goods-thumb {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  background: #f5f7fa;
  flex-shrink: 0;
}
.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  color: #909399;
  background: #f5f7fa;
}
.goods-meta .goods-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  line-height: 1.4;
}
.goods-meta .goods-spec {
  font-size: 12px;
  color: #909399;
}
.subtotal {
  font-weight: 600;
  color: #303133;
}
.text-gray {
  color: #c0c4cc;
}

/* Price Summary */
.price-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}
.summary-row .label {
  color: #606266;
}
.summary-row .value {
  color: #303133;
  font-weight: 500;
}
.summary-row .discount {
  color: #f56c6c;
}
.summary-divider {
  height: 1px;
  background: #ebeef5;
  margin: 8px 0;
}
.summary-row.total .label {
  font-weight: 600;
  font-size: 15px;
}
.summary-row.total .final-price {
  color: #f56c6c;
  font-size: 20px;
  font-weight: bold;
}

/* Info List (Sidebar) */
.info-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.info-item {
  display: flex;
  font-size: 14px;
  line-height: 1.5;
}
.info-label {
  color: #909399;
  width: 60px;
  flex-shrink: 0;
}
.info-content {
  color: #303133;
  flex: 1;
}
.info-content .name {
  font-weight: 500;
  margin-right: 8px;
}
.info-content .phone {
  color: #606266;
}
.tracking-no {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

/* Status Colors */
.st-pending { color: #e6a23c; }
.st-shipping { color: #409eff; }
.st-receiving { color: #67c23a; }
.st-success { color: #2e7d32; }
.st-cancel { color: #909399; }
.st-refund { color: #e6a23c; }
.st-refund-success { color: #67c23a; }
.st-refund-fail { color: #f56c6c; }
.st-default { color: #606266; }
</style>
