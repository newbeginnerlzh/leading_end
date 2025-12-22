<!-- 支付页：显示订单信息并模拟支付 -->
<template>
  <div class="modern-payment-page">
    <!-- Header -->
    <div class="page-header" v-scroll-reveal>
      <h2 class="page-title">收银台</h2>
      <span class="step-indicator">安全支付</span>
    </div>

    <div class="payment-container loading-state" v-if="loading">
      <div class="loading-overlay">
        <div class="loading-badge">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>正在加载支付信息...</span>
        </div>
      </div>
      <div class="main-content">
        <div class="section-card">
          <el-skeleton :rows="5" animated />
        </div>
        <div class="section-card">
          <el-skeleton :rows="3" animated />
        </div>
      </div>
      <div class="sidebar-content">
        <div class="section-card">
          <el-skeleton :rows="6" animated />
        </div>
      </div>
    </div>

    <div class="payment-container" v-else-if="order">
      <!-- Left Column: Order Details -->
      <div class="main-content">
        <!-- Order Info Card -->
        <section class="section-card info-card" v-scroll-reveal>
          <h3>订单信息</h3>
          <div class="info-row">
            <span class="label">订单编号</span>
            <span class="value">{{ order.orderSn }}</span>
          </div>
          <div class="info-row">
            <span class="label">下单时间</span>
            <span class="value">{{ order.createdAt }}</span>
          </div>
          <div class="divider"></div>
          <!-- Receiver -->
          <div class="receiver-info">
            <div class="icon">📍</div>
            <div class="details">
              <div class="name-row">
                <span class="name">{{ order.receiverName }}</span>
                <span class="phone">{{ order.receiverPhone }}</span>
              </div>
              <div class="address-row">
                {{ order.receiverProvince }} {{ order.receiverCity }} {{ order.receiverDistrict }}
                {{ order.receiverDetail }}
              </div>
            </div>
          </div>
          <div class="remark-row" v-if="order.buyerRemark">
            <span class="label">备注:</span>
            <span class="value">{{ order.buyerRemark }}</span>
          </div>
        </section>

        <!-- Items Card -->
        <section class="section-card items-card" v-scroll-reveal>
          <h3>商品明细</h3>
          <div class="items-list">
            <div v-for="(item, index) in orderItems" :key="index" class="item-row">
              <div class="item-name">{{ item.productName }}</div>
              <div class="item-meta">
                <span class="price">¥{{ (item.price || 0).toFixed(2) }}</span>
                <span class="count">x{{ item.quantity }}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- Right Column: Payment Action -->
      <div class="sidebar-content">
        <section class="section-card action-card" v-scroll-reveal>
          <!-- Countdown -->
          <div class="countdown-box" :class="{ expired: remainingSeconds <= 0 }">
            <div class="label">{{ remainingSeconds > 0 ? '支付剩余时间' : '订单状态' }}</div>
            <div class="timer" v-if="remainingSeconds > 0">{{ minutes }}:{{ seconds }}</div>
            <div class="timer expired-text" v-else>已超时</div>
          </div>

          <div class="amount-box">
            <span class="label">应付金额</span>
            <span class="amount">¥{{ (order.payAmount || order.totalAmount || 0).toFixed(2) }}</span>
          </div>

          <div class="payment-method-display">
            <span class="label">支付方式</span>
            <span class="method-tag">在线支付</span>
          </div>

          <!-- Beam Button -->
          <div class="beam-container" :class="{ disabled: !isPending }">
            <div class="beam-border" v-if="isPending"></div>
            <button class="primary-btn-beam full-width" @click="pay" :disabled="!isPending">
              立即支付
            </button>
          </div>
          <button class="text-btn cancel-btn" @click="openCancel" :disabled="!isPending">
            放弃支付
          </button>
        </section>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="error-state">
      <p>未找到订单信息</p>
      <button class="text-btn" @click="router.push('/')">返回首页</button>
    </div>

    <!-- 放弃支付理由弹窗 -->
    <el-dialog
      v-model="cancelDialogVisible"
      title="放弃支付"
      width="420px"
      :close-on-click-modal="false"
      center
      class="custom-dialog"
    >
      <el-form label-position="top" class="custom-form">
        <el-form-item label="放弃理由">
          <el-input
            v-model="cancelReason"
            type="textarea"
            :rows="3"
            placeholder="请填写放弃支付理由（选填）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <button class="cancel-btn-dialog" @click="cancelDialogVisible = false">取消</button>
          <button class="confirm-btn-dialog" :disabled="canceling" @click="submitCancel">
            {{ canceling ? '提交中...' : '确定放弃' }}
          </button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { getOrderDetail, updateOrderStatus, OrderAction } from '@/api/order'
import type { Order, OrderItem } from '@/api/model/orderModel'
import { onBeforeRouteLeave } from 'vue-router'
import { useCartStore } from '@/stores/cart'

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
      { threshold: 0.1 },
    )
    observer.observe(el)
  },
}

const route = useRoute()
const router = useRouter()
const order = ref<Order | null>(null)
const orderItems = ref<OrderItem[]>([])
const loading = ref(true)
const remainingSeconds = ref<number>(0)
let timer: number | null = null
const paying = ref(false)
const canceling = ref(false)
const cancelDialogVisible = ref(false)
const cancelReason = ref('')

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
  const expireTs =
    parseDate((o as unknown as { expireAt?: string | number | Date })?.expireAt) ??
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
    const data = (res as { data?: { order?: Order; items?: OrderItem[] } }).data
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

  setTimeout(() => {
    loading.value = false
  }, 400)
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

    router.replace({ path: `/user/order/${order.value.orderSn}`, query: { fromPay: '1' } })
  } catch (err) {
    ElMessage.error((err as Error).message || '支付失败')
  } finally {
    paying.value = false
  }
}

function openCancel() {
  if (!order.value) return
  cancelReason.value = ''
  cancelDialogVisible.value = true
}

async function submitCancel() {
  if (!order.value || canceling.value) return
  canceling.value = true
  try {
    const reason = cancelReason.value?.trim() || null
    await updateOrderStatus(order.value.orderSn || '', {
      action: OrderAction.CANCEL_ORDER,
      reason,
    })
    ElMessage.success('已取消订单')
    cancelDialogVisible.value = false
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
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.modern-payment-page {
  --bg-color: #f8f9fc;
  --card-bg: #ffffff;
  --text-primary: #1a1b25;
  --text-secondary: #5e6c84;
  --text-tertiary: #94a3b8;
  --accent-color: #4f46e5;
  --accent-gradient: linear-gradient(135deg, #4f46e5, #9333ea);
  --danger-color: #ef4444;
  --border-color: #e2e8f0;
  --card-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
  --card-hover-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025);

  font-family: 'Inter', sans-serif;
  background-color: var(--bg-color);
  color: var(--text-primary);
  min-height: 100vh;
  padding: 40px 20px;
  box-sizing: border-box;
}

/* --- Animations --- */
@keyframes slideFadeBlurIn {
  0% {
    opacity: 0;
    transform: translateY(20px);
    filter: blur(5px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}

.page-header,
.section-card,
.info-row,
.receiver-info,
.remark-row,
.item-row,
.countdown-box,
.amount-box,
.payment-method-display,
.beam-container,
.cancel-btn {
  animation: slideFadeBlurIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  animation-play-state: paused;
}

.is-visible,
.section-card.is-visible .info-row,
.section-card.is-visible .receiver-info,
.section-card.is-visible .remark-row,
.section-card.is-visible .item-row,
.section-card.is-visible .countdown-box,
.section-card.is-visible .amount-box,
.section-card.is-visible .payment-method-display,
.section-card.is-visible .beam-container,
.section-card.is-visible .cancel-btn {
  animation-play-state: running;
}

/* Delays for Info Card */
.info-card .info-row:nth-child(1) { animation-delay: 0.1s; }
.info-card .info-row:nth-child(2) { animation-delay: 0.15s; }
.info-card .receiver-info { animation-delay: 0.2s; }
.info-card .remark-row { animation-delay: 0.25s; }

/* Delays for Items Card */
.items-list .item-row:nth-child(1) { animation-delay: 0.1s; }
.items-list .item-row:nth-child(2) { animation-delay: 0.15s; }
.items-list .item-row:nth-child(3) { animation-delay: 0.2s; }
.items-list .item-row:nth-child(n+4) { animation-delay: 0.25s; }

/* Delays for Action Card */
.action-card .countdown-box { animation-delay: 0.1s; }
.action-card .amount-box { animation-delay: 0.15s; }
.action-card .payment-method-display { animation-delay: 0.2s; }
.action-card .beam-container { animation-delay: 0.25s; }
.action-card .cancel-btn { animation-delay: 0.3s; }

/* --- Header --- */
.page-header {
  max-width: 1000px;
  margin: 0 auto 30px;
  display: flex;
  align-items: baseline;
  gap: 20px;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 15px;
}

.page-title {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.5px;
  margin: 0;
  background: linear-gradient(to right, #1a1b25, #4f46e5);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.step-indicator {
  font-size: 14px;
  font-weight: 600;
  color: var(--accent-color);
  background: #eef2ff;
  padding: 4px 12px;
  border-radius: 99px;
}

/* --- Layout --- */
.payment-container {
  max-width: 1000px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--card-shadow);
  transition: all 0.3s ease;
}

.section-card:hover {
  box-shadow: var(--card-hover-shadow);
}

.section-card h3 {
  margin: 0 0 20px;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

/* --- Info Card --- */
.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 14px;
}
.info-row .label {
  color: var(--text-secondary);
}
.info-row .value {
  font-weight: 600;
  color: var(--text-primary);
}

.divider {
  height: 1px;
  background: var(--border-color);
  margin: 16px 0;
}

.receiver-info {
  display: flex;
  gap: 12px;
  background: #f8fafc;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
}
.receiver-info .icon {
  font-size: 20px;
}
.receiver-info .details {
  flex: 1;
}
.name-row {
  display: flex;
  gap: 10px;
  font-weight: 700;
  margin-bottom: 4px;
  color: var(--text-primary);
}
.address-row {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.4;
}
.remark-row {
  margin-top: 16px;
  font-size: 13px;
  color: var(--text-secondary);
  background: #fff7ed;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #ffedd5;
}
.remark-row .label {
  font-weight: 600;
  color: #c2410c;
  margin-right: 6px;
}

/* --- Items List --- */
.items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid var(--border-color);
}
.item-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}
.item-meta {
  display: flex;
  gap: 12px;
  font-size: 14px;
}
.item-meta .price {
  font-weight: 600;
}
.item-meta .count {
  color: var(--text-secondary);
}

/* --- Action Card --- */
.action-card {
  position: sticky;
  top: 20px;
  text-align: center;
}

.countdown-box {
  background: #eef2ff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  border: 1px solid #e0e7ff;
}
.countdown-box.expired {
  background: #fef2f2;
  border-color: #fee2e2;
}
.countdown-box .label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.countdown-box .timer {
  font-size: 32px;
  font-weight: 800;
  color: var(--accent-color);
  font-variant-numeric: tabular-nums;
}
.countdown-box.expired .timer {
  color: var(--danger-color);
  font-size: 24px;
}

.amount-box {
  margin-bottom: 24px;
}
.amount-box .label {
  display: block;
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}
.amount-box .amount {
  font-size: 36px;
  font-weight: 800;
  background: var(--accent-gradient);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.payment-method-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
}
.method-tag {
  font-weight: 600;
  color: var(--text-primary);
}

/* --- Buttons --- */
.beam-container {
  position: relative;
  border-radius: 9999px;
  padding: 3px;
  overflow: hidden;
  background: #e2e8f0;
  margin-bottom: 12px;
}
.beam-container.disabled {
  opacity: 0.6;
  pointer-events: none;
}
.beam-border {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: conic-gradient(
    transparent,
    transparent 80deg,
    #4f46e5 100deg,
    #9333ea 140deg,
    transparent 180deg
  );
  animation: rotateBeam 3s linear infinite;
}
@keyframes rotateBeam {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.primary-btn-beam {
  position: relative;
  background: var(--text-primary);
  color: #fff;
  border: none;
  border-radius: 9999px;
  padding: 14px 0;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 1px;
  cursor: pointer;
  z-index: 1;
  width: 100%;
}
.cancel-btn {
  width: 100%;
  padding: 10px;
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: color 0.2s;
}
.cancel-btn:hover {
  color: var(--danger-color);
}

/* --- Loading/Error --- */
.loading-state {
  position: relative;
  min-height: 60vh;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(4px);
  border-radius: 24px;
}

.loading-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 32px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06),
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border-radius: 9999px;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 16px;
  backdrop-filter: blur(12px);
}

.loading-badge .el-icon {
  font-size: 22px;
  color: var(--accent-color);
  animation: spin 1s linear infinite;
}

.error-state {
  text-align: center;
  padding: 100px 0;
  color: var(--text-secondary);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* --- Dialog --- */
.custom-dialog :deep(.el-dialog__body) {
  padding: 20px 30px;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.cancel-btn-dialog,
.confirm-btn-dialog {
  padding: 8px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  border: none;
}
.cancel-btn-dialog {
  background: #f1f5f9;
  color: var(--text-secondary);
}
.confirm-btn-dialog {
  background: var(--danger-color);
  color: #fff;
}
.confirm-btn-dialog:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
