<script setup lang="ts">
import { useCartStore, type CartItem } from '@/stores/cart'
import { useRouter } from 'vue-router'
import { ref } from 'vue'

const cartStore = useCartStore()
const router = useRouter()

// --- Custom UI Logic ---

// Toast System
interface Toast {
  id: number
  msg: string
  type: 'success' | 'error' | 'warning'
}
const toasts = ref<Toast[]>([])
const showToast = (msg: string, type: 'success' | 'error' | 'warning' = 'success') => {
  const id = Date.now()
  toasts.value.push({ id, msg, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }, 3000)
}

// Confirm Dialog System
const confirmState = ref({
  visible: false,
  message: '',
  resolve: null as ((val: boolean) => void) | null,
})

const safeConfirm = (message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    confirmState.value = {
      visible: true,
      message,
      resolve,
    }
  })
}

const handleConfirmAction = (result: boolean) => {
  if (confirmState.value.resolve) {
    confirmState.value.resolve(result)
  }
  confirmState.value.visible = false
  confirmState.value.resolve = null
}

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
      { threshold: 0.15 },
    )
    observer.observe(el)
  },
}

// --- Business Logic ---

const goToDetail = (productId: number, skuId: number) => {
  router.push({
    path: `/product/${productId}`,
    query: { skuId: String(skuId) },
  })
}

const handleDelete = async (skuId: number) => {
  const confirmed = await safeConfirm('确定要删除这个商品吗?')
  if (!confirmed) return

  try {
    await cartStore.removeFromCart(skuId)
    showToast('商品已删除', 'success')
  } catch {
    showToast('删除失败，请重试', 'error')
  }
}

const handleClear = async () => {
  const confirmed = await safeConfirm('确定要清空购物车吗？此操作无法恢复。')
  if (!confirmed) return

  try {
    await cartStore.clearCart()
    showToast('购物车已清空', 'success')
  } catch (error: unknown) {
    if (error) {
      showToast('清空失败，请重试', 'error')
    }
  }
}

const handleCheckout = () => {
  if (cartStore.selectedTotalCount === 0) {
    showToast('请至少选择一件商品', 'warning')
    return
  }
  router.push('/checkout')
}

const decreaseQuantity = async (item: CartItem) => {
  if (item.count <= 1) {
    showToast('最低限购一件！', 'warning')
    return
  }
  try {
    await cartStore.updateQuantity(item.skuId, item.count - 1)
  } catch {
    showToast('更新数量失败', 'error')
  }
}

const increaseQuantity = async (item: CartItem) => {
  try {
    await cartStore.updateQuantity(item.skuId, item.count + 1)
  } catch {
    showToast('更新数量失败', 'error')
  }
}

const handleSelectAllChange = async (e: Event) => {
  const target = e.target as HTMLInputElement
  try {
    await cartStore.toggleSelectAll(target.checked)
  } catch {
    showToast('操作失败', 'error')
  }
}

const formatPrice = (price: number) => {
  return Number.isInteger(price) ? price.toString() : price.toFixed(2)
}

// 保留此函数以兼容旧逻辑，但在新CSS中我们可能不再依赖它做探照灯，或者做微光效果
const handleMouseMove = (e: MouseEvent) => {
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  target.style.setProperty('--x', `${x}px`)
  target.style.setProperty('--y', `${y}px`)
}
</script>

<template>
  <div class="modern-cart-page">
    <!-- Header -->
    <div class="cart-header" v-scroll-reveal>
      <h2 class="page-title">购物车</h2>
      <span class="item-count">商品总数: {{ cartStore.totalCount }}</span>
    </div>

    <!-- Empty State -->
    <div v-if="cartStore.items.length === 0" class="empty-state" v-scroll-reveal>
      <div class="empty-icon">🛒</div>
      <p>您的购物车是空的。</p>
      <div class="beam-container center-beam">
        <div class="beam-border"></div>
        <button class="primary-btn-beam" @click="router.push('/')">去购物</button>
      </div>
    </div>

    <!-- Cart Content -->
    <div v-else class="cart-container">
      <!-- List Header -->
      <div class="list-header" v-scroll-reveal>
        <div class="col-checkbox"></div>
        <div class="col-product">商品信息</div>
        <div class="col-price">单价</div>
        <div class="col-quantity">数量</div>
        <div class="col-subtotal">小计</div>
        <div class="col-action">操作</div>
      </div>

      <!-- Items List -->
      <div class="cart-items">
        <div
          v-for="(item, index) in cartStore.items"
          :key="item.skuId"
          class="cart-item"
          v-scroll-reveal
          @mousemove="handleMouseMove"
          :style="{ animationDelay: `${index * 100}ms` }"
        >
          <!-- Selection -->
          <div class="col-checkbox">
            <label class="custom-checkbox">
              <input type="checkbox" v-model="item.selected" />
              <span class="checkmark"></span>
            </label>
          </div>

          <!-- Product Info -->
          <div class="col-product" @click="goToDetail(item.productId, item.skuId)">
            <div class="img-wrapper">
              <img :src="item.imgUrl" alt="product" />
            </div>
            <div class="info-wrapper">
              <div class="name">{{ item.name }}</div>
              <div class="specs">
                <span v-for="(val, key) in item.specs" :key="key" class="spec-tag">
                  {{ key }}: {{ val }}
                </span>
              </div>
            </div>
          </div>

          <!-- Price -->
          <div class="col-price">
            <span class="unit-price">¥{{ item.price }}</span>
          </div>

          <!-- Quantity -->
          <div class="col-quantity">
            <div class="qty-control">
              <button class="qty-btn" @click.stop="decreaseQuantity(item)">−</button>
              <span class="qty-val">{{ item.count }}</span>
              <button class="qty-btn" @click.stop="increaseQuantity(item)">+</button>
            </div>
          </div>

          <!-- Subtotal -->
          <div class="col-subtotal">
            <span class="price-val">¥{{ formatPrice(item.price * item.count) }}</span>
          </div>

          <!-- Action -->
          <div class="col-action">
            <button class="delete-btn" @click.stop="handleDelete(item.skuId)">删除</button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="cart-footer-bar">
        <div class="footer-left">
          <label class="custom-checkbox select-all">
            <input
              type="checkbox"
              :checked="cartStore.isAllSelected"
              @change="handleSelectAllChange"
            />
            <span class="checkmark"></span>
            <span class="label-text">全选</span>
          </label>
          <button class="text-btn" @click="handleClear">清空购物车</button>
        </div>

        <div class="footer-right">
          <div class="total-info">
            <div class="row-count">
              已选: <span>{{ cartStore.selectedTotalCount }}</span>
            </div>
            <div class="row-total">
              合计:
              <span class="total-amount">¥{{ formatPrice(cartStore.selectedTotalPrice) }}</span>
            </div>
          </div>

          <!-- Modern Beam/Gradient Button -->
          <div class="beam-container" :class="{ disabled: cartStore.selectedTotalCount === 0 }">
            <div class="beam-border" v-if="cartStore.selectedTotalCount > 0"></div>
            <button
              class="checkout-btn"
              :disabled="cartStore.selectedTotalCount === 0"
              @click="handleCheckout"
            >
              去结算
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Custom Toast Container -->
    <div class="toast-container">
      <transition-group name="toast-fade">
        <div v-for="toast in toasts" :key="toast.id" class="toast-msg" :class="toast.type">
          {{ toast.msg }}
        </div>
      </transition-group>
    </div>

    <!-- Custom Confirm Modal -->
    <transition name="modal-fade">
      <div v-if="confirmState.visible" class="modal-overlay">
        <div class="modal-content">
          <h3>确认</h3>
          <p>{{ confirmState.message }}</p>
          <div class="modal-actions">
            <button class="cancel-btn" @click="handleConfirmAction(false)">取消</button>
            <button class="confirm-btn" @click="handleConfirmAction(true)">确认</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
/* Google Font Import (Inter) */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

/* --- Scheme 1: Modern Clean & Trust --- */
.modern-cart-page {
  /* 基础背景：极浅的蓝灰色，比纯白更有质感 */
  --bg-color: #f8f9fc;

  /* 卡片背景：纯白，突出内容 */
  --card-bg: #ffffff;

  /* 字体颜色：深灰代替纯黑 */
  --text-primary: #1a1b25;
  --text-secondary: #5e6c84;
  --text-tertiary: #94a3b8;

  /* 核心强调色：现代靛蓝 */
  --accent-color: #4f46e5;

  /* 特殊感：靛蓝到洋红的流动渐变 */
  --accent-gradient: linear-gradient(135deg, #4f46e5, #9333ea);

  /* 辅助色 */
  --danger-color: #ef4444;
  --border-color: #e2e8f0;

  /* 浅色系下的毛玻璃效果 */
  --glass-bg: rgba(255, 255, 255, 0.85);
  --glass-border: rgba(255, 255, 255, 0.5);
  --glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);

  /* 电商必备：轻柔的阴影 */
  --card-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
  --card-hover-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025);

  font-family: 'Inter', sans-serif;
  background-color: var(--bg-color);
  color: var(--text-primary);
  min-height: 100vh;
  padding: 40px 20px 120px; /* 增加底部 padding 避免被 footer 遮挡 */
  box-sizing: border-box;
}

h2,
p,
div,
span,
button {
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

.cart-item,
.cart-header,
.empty-state,
.list-header {
  animation: slideFadeBlurIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  animation-play-state: paused;
}

.is-visible {
  animation-play-state: running;
}

/* --- Header --- */
.cart-header {
  max-width: 1200px;
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
  /* 浅色背景下使用深色渐变 */
  background: linear-gradient(to right, #1a1b25, #4f46e5);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.item-count {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 600;
  background: #eef2ff;
  color: var(--accent-color);
  padding: 4px 10px;
  border-radius: 99px;
}

/* --- Layout --- */
.cart-container {
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
}

.list-header {
  display: grid;
  grid-template-columns: 50px 4fr 1.5fr 2fr 1.5fr 1fr;
  padding: 15px 20px;
  font-size: 12px;
  letter-spacing: 0.5px;
  color: var(--text-tertiary);
  font-weight: 600;
  text-transform: uppercase;
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 80px;
}

/* --- Cart Item Card --- */
.cart-item {
  display: grid;
  grid-template-columns: 50px 4fr 1.5fr 2fr 1.5fr 1fr;
  align-items: center;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 20px;
  position: relative;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: var(--card-shadow);
  overflow: hidden;
}

.cart-item:hover {
  transform: translateY(-4px);
  box-shadow: var(--card-hover-shadow);
  border-color: rgba(79, 70, 229, 0.3); /* Accent border on hover */
}

/* 浅色系微光效果 (替代原本的探照灯) */
.cart-item::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.6), transparent);
  transform: skewX(-25deg);
  pointer-events: none;
  transition: 0.5s;
}
/* 鼠标滑过时一道光扫过 */
/*.cart-item:hover::after {
  left: 150%;
  transition: 0.7s ease-in-out;
}*/

/* --- Columns --- */
.col-checkbox {
  display: flex;
  justify-content: center;
}
.col-product {
  display: flex;
  align-items: center;
  gap: 20px;
  cursor: pointer;
}
.list-header .col-product {
  justify-content: center;
}
.col-price,
.col-quantity,
.col-subtotal,
.col-action {
  text-align: center;
}

/* --- Product Info --- */
.img-wrapper {
  min-width: 100px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  background: #f1f5f9; /* Lighter placeholder */
  border: 1px solid var(--border-color);
}
.img-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s;
  mix-blend-mode: multiply; /* Helps integrate product images on white */
}
.cart-item:hover .img-wrapper img {
  transform: scale(1.08);
}

.info-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.4;
}
.specs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.spec-tag {
  font-size: 11px;
  background: #f1f5f9;
  padding: 3px 8px;
  border-radius: 6px;
  color: var(--text-secondary);
  font-weight: 500;
}

/* --- Price --- */
.unit-price {
  font-size: 15px;
  color: var(--text-secondary);
  font-weight: 500;
}
.price-val {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  font-feature-settings: 'tnum';
}

/* --- Quantity Control --- */
.qty-control {
  display: inline-flex;
  align-items: center;
  background: #f8f9fc;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 4px;
}
.qty-btn {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: none;
  background: #fff;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}
.qty-btn:hover {
  background: var(--accent-color);
  color: #fff;
}
.qty-val {
  width: 36px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

/* --- Action --- */
.delete-btn {
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  font-size: 12px;
  cursor: pointer;
  transition: color 0.2s;
  font-weight: 600;
}
.delete-btn:hover {
  color: var(--danger-color);
}

/* --- Custom Checkbox (Light Mode Adapted) --- */
.custom-checkbox {
  position: relative;
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}
.custom-checkbox input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}
.checkmark {
  position: relative;
  height: 20px;
  width: 20px;
  background-color: #fff;
  border-radius: 6px;
  border: 2px solid #cbd5e1; /* Light grey border */
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.custom-checkbox:hover input ~ .checkmark {
  border-color: var(--accent-color);
}
.custom-checkbox input:checked ~ .checkmark {
  background-color: var(--accent-color);
  border-color: var(--accent-color);
  box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3); /* Glow in accent color */
}
.checkmark:after {
  content: '';
  position: absolute;
  display: none;
  left: 6px;
  top: 2px;
  width: 4px;
  height: 9px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
.custom-checkbox input:checked ~ .checkmark:after {
  display: block;
}
.label-text {
  margin-left: 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
}

/* --- Footer Bar (Glassmorphism Light) --- */
.cart-footer-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-top: 1px solid var(--glass-border);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.03);
  padding: 20px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 100;
}

.footer-left {
  display: flex;
  gap: 30px;
  align-items: center;
}
.text-btn {
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: 0.2s;
  font-size: 13px;
  font-weight: 600;
}
.text-btn:hover {
  color: var(--danger-color);
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 40px;
}
.total-info {
  text-align: right;
}
.row-count {
  font-size: 12px;
  color: var(--text-secondary);
}
.row-total {
  font-size: 16px;
  color: var(--text-primary);
  font-weight: 500;
}
.total-amount {
  font-size: 26px;
  font-weight: 800;
  margin-left: 10px;
  /* 价格使用渐变色突显 */
  background: var(--accent-gradient);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* --- Beam Button (Light Mode Version) --- */
/* 保留光束逻辑，但改为白色内部+彩色旋转边框 */
.beam-container {
  position: relative;
  border-radius: 9999px;
  padding: 3px; /* Border thickness */
  overflow: hidden;
  background: #e2e8f0; /* Inactive border color */
  display: flex;
  transition: all 0.3s;
}
.beam-container:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(79, 70, 229, 0.4);
}
.beam-container.disabled {
  opacity: 0.6;
  pointer-events: none;
  filter: grayscale(1);
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
  opacity: 1; /* Always visible for the effect */
  z-index: 0;
}

@keyframes rotateBeam {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.checkout-btn {
  position: relative;
  /* 按钮中心为纯白或渐变? 这里选深色渐变以对比浅色背景，或纯白配彩色字 */
  background: var(--text-primary);
  color: #fff;
  border: none;
  border-radius: 9999px;
  padding: 12px 40px;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 1px;
  cursor: pointer;
  z-index: 1;
  width: 100%;
  transition: background 0.3s;
}

/* 另一种风格：按钮也是渐变的，和光束融为一体 */
.checkout-btn {
  background: linear-gradient(135deg, #4f46e5, #4338ca);
}

.primary-btn-beam {
  position: relative;
  background: var(--text-primary);
  color: #fff;
  border: none;
  border-radius: 9999px;
  padding: 14px 48px;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 1px;
  cursor: pointer;
  z-index: 1;
}

/* --- Toast (Light Mode) --- */
.toast-container {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.toast-msg {
  padding: 12px 24px;
  border-radius: 12px;
  color: #1e293b;
  font-size: 14px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
}
.toast-msg.success {
  border-left: 4px solid #10b981;
  color: #059669;
}
.toast-msg.error {
  border-left: 4px solid #ef4444;
  color: #dc2626;
}
.toast-msg.warning {
  border-left: 4px solid #f59e0b;
  color: #d97706;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.3s ease;
}
.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* --- Modal (Light Mode) --- */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4); /* Darker overlay for contrast */
  backdrop-filter: blur(4px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-content {
  background: #ffffff;
  padding: 32px;
  border-radius: 20px;
  width: 320px;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
.modal-content h3 {
  margin-top: 0;
  color: var(--text-primary);
  font-size: 20px;
}
.modal-content p {
  color: var(--text-secondary);
  margin-bottom: 24px;
  line-height: 1.5;
}
.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
.modal-actions button {
  padding: 10px 24px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: transform 0.1s;
}
.modal-actions button:active {
  transform: scale(0.96);
}

.cancel-btn {
  background: #f1f5f9;
  color: var(--text-secondary);
}
.cancel-btn:hover {
  background: #e2e8f0;
}

.confirm-btn {
  background: var(--accent-color);
  color: #fff;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}
.confirm-btn:hover {
  background: #4338ca;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition:
    opacity 0.3s,
    transform 0.3s;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 100px 0;
}
.empty-icon {
  font-size: 64px;
  margin-bottom: 24px;
  opacity: 0.8;
  filter: grayscale(0.5);
}
.center-beam {
  display: inline-flex;
  margin-top: 20px;
}
</style>
