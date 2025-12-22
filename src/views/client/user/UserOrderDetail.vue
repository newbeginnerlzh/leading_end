<!-- 订单详情：根据路由参数加载并展示订单 -->
<template>
  <div class="modern-detail-page">
    <!-- Header -->
    <div class="page-header" v-scroll-reveal>
      <div class="header-title-group">
        <h1 class="page-title">订单详情</h1>
        <span class="step-indicator">Order Details</span>
      </div>
      <div class="header-right" @click="onBack">
        <el-icon class="back-icon"><ArrowLeft /></el-icon>
        <span class="back-text">返回列表</span>
      </div>
    </div>

    <!-- Loading / Empty -->
    <div v-if="loading" class="loading-wrap" v-scroll-reveal>
      <el-skeleton :rows="5" animated />
    </div>
    <div v-else-if="!order" class="empty-wrap" v-scroll-reveal>
      <el-empty description="未找到订单信息" />
    </div>

    <div v-else class="content-wrapper">
      <!-- Status Section -->
      <div class="section-card status-section" v-scroll-reveal>
        <div class="status-header">
          <div class="status-info">
            <div class="status-badge-large" :class="statusClass(displayStatus)">
              {{ displayStatus }}
            </div>
            <div class="order-sn">订单号：{{ order.orderSn }}</div>
          </div>
          <div class="status-actions">
             <button
              v-if="isRefundable(order?.status)"
              class="custom-btn"
              :disabled="refunding"
              @click="openRefund"
            >申请退款</button>

            <button
              v-if="canPay"
              class="custom-btn primary"
              :disabled="acting"
              @click="goPay"
            >去支付</button>

            <button
               class="custom-btn danger"
               @click="onDelete"
            >删除订单</button>
          </div>
        </div>

        <!-- Steps -->
        <div class="order-steps" v-if="showSteps">
          <el-steps :active="activeStep" align-center finish-status="success" class="custom-steps">
            <el-step title="提交订单" :description="formatDate(order.createdAt)" />
            <el-step title="支付订单" :description="formatDate(order.payTime)" />
            <el-step title="平台发货" :description="formatDate(order.shippingTime)" />
            <el-step title="确认收货" :description="formatDate(order.confirmTime)" />
          </el-steps>
        </div>

        <!-- Alerts -->
        <div v-else class="status-alert">
           <el-alert
             v-if="displayStatus === '已取消'"
             title="订单已取消"
             :description="order.cancelReason ? `取消原因：${order.cancelReason}` : ''"
             type="info"
             show-icon
             :closable="false"
           />
           <el-alert
             v-else-if="displayStatus && displayStatus.includes('退款')"
             :title="displayStatus"
             :description="order.refundReason ? `退款原因：${order.refundReason}` : ''"
             type="warning"
             show-icon
             :closable="false"
           />
           <el-alert
             v-else-if="displayStatus === '已超时'"
             title="订单已超时"
             description="支付超时，请返回订单列表或重新下单"
             type="warning"
             show-icon
             :closable="false"
           />
        </div>
      </div>

      <!-- Info Grid -->
      <div class="info-grid">
        <!-- Receiver Info -->
        <div class="section-card info-card" v-scroll-reveal>
          <h3 class="card-title">收货信息</h3>
          <div class="info-list">
            <div class="info-item">
              <span class="label">收货人</span>
              <div class="value">
                <span class="name">{{ order.receiverName }}</span>
                <span class="phone">{{ order.receiverPhone }}</span>
              </div>
            </div>
            <div class="info-item">
              <span class="label">地址</span>
              <div class="value">{{ formatAddress(order) }}</div>
            </div>
            <div class="info-item">
              <span class="label">配送</span>
              <div class="value">
                <div>{{ order.shippingMethod || '—' }}</div>
                <div v-if="order.trackingNumber" class="tracking-no">单号：{{ order.trackingNumber }}</div>
              </div>
            </div>
            <div class="info-item" v-if="order.buyerRemark">
              <span class="label">备注</span>
              <div class="value">{{ order.buyerRemark }}</div>
            </div>
          </div>
        </div>

        <!-- Timeline -->
        <div class="section-card info-card" v-scroll-reveal>
           <h3 class="card-title">订单追踪</h3>
           <el-timeline class="custom-timeline">
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
        </div>

        <!-- Price Info -->
        <div class="section-card info-card" v-scroll-reveal>
          <h3 class="card-title">费用明细</h3>
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
        </div>
      </div>

      <!-- Product List -->
      <div class="section-card product-section" v-scroll-reveal>
        <h3 class="card-title">商品清单</h3>
        <el-table :data="items" class="modern-table" style="width: 100%" :header-cell-style="{ background: '#f8fafc', color: '#64748b', fontWeight: '600', height: '50px' }">
          <el-table-column label="商品详情" min-width="240">
            <template #default="{ row }">
              <div class="goods-info">
                <div class="img-wrapper">
                   <img :src="row.mainImage" class="goods-thumb" alt="Product" />
                </div>
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
          <el-table-column label="小计" width="140" align="center">
            <template #default="{ row }">
              <span class="subtotal">{{ formatMoney(row.totalPrice ?? (row.price || 0) * (row.quantity || 0)) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="afterSaleStatus" label="售后" width="100" align="center">
             <template #default="{ row }">
                <span v-if="row.afterSaleStatus" class="status-tag-small">{{ row.afterSaleStatus }}</span>
                <span v-else class="text-gray">-</span>
             </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- Dialog -->
    <el-dialog v-model="refundDialogVisible" title="申请退款" width="420px" :close-on-click-modal="false" destroy-on-close class="custom-dialog">
        <el-form label-width="80px" class="modern-form">
          <el-form-item label="退款理由">
            <el-input v-model="refundReason" type="textarea" :rows="3" placeholder="请填写退款理由" />
          </el-form-item>
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <button class="custom-btn" @click="refundDialogVisible = false">取消</button>
            <button class="custom-btn primary" :disabled="refunding" @click="submitRefund">
              {{ refunding ? '提交中...' : '确定' }}
            </button>
          </div>
        </template>
      </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
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
const pendingStatuses = new Set(['待付款', '未支付'])

// Scroll Reveal Directive
const vScrollReveal = {
  mounted: (el: HTMLElement) => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add('is-visible')
            observer.unobserve(el)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )
    observer.observe(el)
  },
}

// Computed Properties
const isExpired = computed(() => {
  const o = order.value
  if (!o) return false
  const status = o.status || ''
  if (!pendingStatuses.has(status)) return false
  return isOrderExpired(o)
})

const displayStatus = computed(() => (isExpired.value ? '已超时' : order.value?.status || ''))

const activeStep = computed(() => {
  const s = displayStatus.value
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
  const s = displayStatus.value
  return ['待付款', '待发货', '待收货', '已完成'].includes(s || '')
})

const canPay = computed(() => !!order.value && pendingStatuses.has(order.value.status || '') && !isExpired.value)

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

function parseDate(val?: Date | string | number | null): number | null {
  if (!val) return null
  const d = new Date(val)
  const t = d.getTime()
  return Number.isNaN(t) ? null : t
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

function isOrderExpired(record: { createdAt?: Date | string | number | null; expireAt?: Date | string | number | null; expiresAt?: Date | string | number | null }) {
  const expireTs =
    parseDate((record as { expireAt?: Date | string | number | null }).expireAt) ??
    parseDate((record as { expiresAt?: Date | string | number | null }).expiresAt)
  let endTs = expireTs ?? null
  if (!endTs) {
    const createdTs = parseDate(record.createdAt)
    if (createdTs) {
      endTs = createdTs + 15 * 60 * 1000
    }
  }
  if (!endTs) return false
  return Date.now() >= endTs
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
    case '已超时': return 'st-expired'
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
  if (!order.value || acting.value || isExpired.value) return
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

function listQueryParams() {
  const q: Record<string, string> = {}
  if (route.query.page) q.page = String(route.query.page)
  if (route.query.pageSize) q.pageSize = String(route.query.pageSize)
  return q
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
    router.replace({ path: '/user/orders', query: listQueryParams() })
  } catch (err) {
    ElMessage.error((err as Error).message || '删除失败')
  } finally {
    deleting.value = false
  }
}

function onBack() {
  router.push({ path: '/user/orders', query: listQueryParams() })
}
</script>

<style scoped>
.modern-detail-page {
  padding: 40px 20px;
  max-width: 1200px;
  margin: 0 auto;
  background-color: #f8f9fc;
  min-height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Header */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 15px;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s;
  padding: 8px 16px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e2e8f0;
}
.header-right:hover {
  color: #4f46e5;
  border-color: #4f46e5;
  background: #eef2ff;
}
.back-icon {
  font-size: 16px;
}
.back-text {
  font-size: 14px;
  font-weight: 500;
}
.page-title {
  font-size: 28px;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(to right, #1a1b25, #4f46e5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.5px;
}
.header-title-group {
  display: flex;
  align-items: baseline;
  gap: 20px;
}
.step-indicator {
  font-size: 14px;
  font-weight: 600;
  color: #4f46e5;
  background: #eef2ff;
  padding: 4px 12px;
  border-radius: 99px;
}

/* Cards */
.section-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  margin-bottom: 24px;
  border: 1px solid #f1f5f9;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.section-card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
}
.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 20px;
  padding-left: 12px;
  border-left: 4px solid #4f46e5;
}

/* Status Section */
.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f1f5f9;
}
.status-info {
  display: flex;
  align-items: center;
  gap: 16px;
}
.status-badge-large {
  font-size: 20px;
  font-weight: 600;
  padding: 8px 20px;
  border-radius: 99px;
  background: #f1f5f9;
  color: #64748b;
}
.status-badge-large.st-pending { background: #fff7ed; color: #ea580c; }
.status-badge-large.st-shipping { background: #eff6ff; color: #2563eb; }
.status-badge-large.st-receiving { background: #f0fdf4; color: #16a34a; }
.status-badge-large.st-success { background: #f0fdf4; color: #15803d; }
.status-badge-large.st-cancel { background: #f1f5f9; color: #64748b; }
.status-badge-large.st-refund { background: #fff7ed; color: #d97706; }
.status-badge-large.st-expired { background: #fff7ed; color: #ea580c; }

.order-sn {
  color: #94a3b8;
  font-size: 14px;
  font-family: monospace;
}
.status-actions {
  display: flex;
  gap: 12px;
}

/* Buttons */
.custom-btn {
  padding: 10px 24px;
  border-radius: 10px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #475569;
}
.custom-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #1e293b;
}
.custom-btn.primary {
  background: #4f46e5;
  color: #fff;
  border: none;
  box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
}
.custom-btn.primary:hover {
  background: #4338ca;
  transform: translateY(-1px);
  box-shadow: 0 6px 8px -1px rgba(79, 70, 229, 0.3);
}
.custom-btn.danger {
  color: #ef4444;
  border-color: #fee2e2;
  background: #fef2f2;
}
.custom-btn.danger:hover {
  background: #fee2e2;
}

/* Steps */
.order-steps {
  padding: 0 20px;
}
:deep(.el-step__title) {
  font-size: 14px;
  font-weight: 500;
}
:deep(.el-step__head.is-success) {
  color: #4f46e5;
  border-color: #4f46e5;
}
:deep(.el-step__title.is-success) {
  color: #4f46e5;
}
:deep(.el-step__description) {
  font-size: 12px;
  margin-top: 4px;
}

/* Info Grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 24px;
}
.info-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.info-item .label {
  font-size: 12px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.info-item .value {
  font-size: 14px;
  color: #334155;
  font-weight: 500;
  line-height: 1.5;
}
.info-item .name {
  font-weight: 600;
  color: #1e293b;
  margin-right: 8px;
}

/* Timeline */
.custom-timeline {
  padding-left: 4px;
}
:deep(.el-timeline-item__node--primary) {
  background-color: #4f46e5;
}
:deep(.el-timeline-item__content) {
  color: #334155;
  font-size: 14px;
}
:deep(.el-timeline-item__timestamp) {
  color: #94a3b8;
  font-size: 12px;
}

/* Price Summary */
.price-summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #64748b;
}
.summary-row .value {
  color: #334155;
  font-weight: 500;
}
.summary-row .discount {
  color: #ef4444;
}
.summary-divider {
  height: 1px;
  background: #f1f5f9;
  margin: 8px 0;
}
.summary-row.total {
  margin-top: 4px;
  align-items: baseline;
}
.summary-row.total .label {
  font-weight: 600;
  color: #1e293b;
}
.summary-row.total .final-price {
  font-size: 24px;
  font-weight: 700;
  color: #4f46e5;
}

/* Product Table */
.modern-table {
  --el-table-border-color: #f1f5f9;
  --el-table-header-bg-color: #f8fafc;
  border-radius: 8px;
  overflow: hidden;
}
.goods-info {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
}
.img-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #f1f5f9;
  background: #f8fafc;
}
.goods-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}
.goods-thumb:hover {
  transform: scale(1.05);
}
.goods-meta {
  flex: 1;
}
.goods-name {
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 6px;
  line-height: 1.4;
}
.goods-spec {
  font-size: 12px;
  color: #94a3b8;
  background: #f8fafc;
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
}
.subtotal {
  font-weight: 600;
  color: #1e293b;
}
.status-tag-small {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background: #f1f5f9;
  color: #64748b;
}

/* --- Animations --- */
@keyframes slideFadeBlurIn {
  0% {
    opacity: 0;
    transform: translateY(20px);
    filter: blur(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}

.page-header,
.section-card,
.loading-wrap,
.empty-wrap {
  animation: slideFadeBlurIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  animation-play-state: paused;
}

/* Info Cards 交错延迟 */
.info-card:nth-child(1) { animation-delay: 0.1s; }
.info-card:nth-child(2) { animation-delay: 0.2s; }
.info-card:nth-child(3) { animation-delay: 0.3s; }

/* 表格行交错动画 */
.modern-table :deep(.el-table__row) {
  animation: slideFadeBlurIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  animation-play-state: paused;
}

/* 当卡片可见时，表格行开始播放 */
.section-card.is-visible .modern-table :deep(.el-table__row) {
  animation-play-state: running;
}

/* 表格行延迟 */
.modern-table :deep(.el-table__row:nth-child(1)) { animation-delay: 0.1s; }
.modern-table :deep(.el-table__row:nth-child(2)) { animation-delay: 0.15s; }
.modern-table :deep(.el-table__row:nth-child(3)) { animation-delay: 0.2s; }
.modern-table :deep(.el-table__row:nth-child(4)) { animation-delay: 0.25s; }
.modern-table :deep(.el-table__row:nth-child(n+5)) { animation-delay: 0.3s; }

.is-visible {
  animation-play-state: running;
}

/* Responsive */
@media (max-width: 1024px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
