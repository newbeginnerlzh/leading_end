<template>
  <div class="header-container">
    <div class="content-wrapper">
      <!-- 1. 左侧：Logo + 导航菜单 -->
      <div class="left-section">
        <div class="logo" @click="goHome">
          <span class="logo-text">联想商城</span>
          <span class="logo-badge">MALL</span>
        </div>
        <nav class="nav-links">
          <router-link to="/" class="nav-item">
            <span class="nav-text">商城首页</span>
          </router-link>
          <router-link to="/products" class="nav-item">
            <span class="nav-text">商品列表</span>
          </router-link>
        </nav>
      </div>

      <!-- 2. 中间：圆角搜索框 -->
      <div class="center-section">
        <div class="search-box">
          <el-input
            v-model="keyword"
            placeholder="搜索"
            class="round-input"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #suffix>
              <el-icon :size="20" class="search-icon" @click="handleSearch"><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </div>

      <!-- 3. 右侧：用户操作区 -->
      <div class="right-section">
        <template v-if="isLogin">
          <div class="nav-item cart-item" :class="{ 'is-active': isCartActive }" @click="goCart">
            <el-badge :value="cartStore.totalCount" :max="99" class="cart-badge">
              <span class="nav-text">购物车</span>
            </el-badge>
          </div>

          <div
            class="user-menu-wrapper"
            @mouseenter="showDropdown = true"
            @mouseleave="showDropdown = false"
          >
            <div class="action-item user-profile">
              <div class="avatar-mini">
                <el-image v-if="userAvatar" :src="userAvatar" class="image-avatar" fit="cover" />
                <el-icon v-else :size="18"><User /></el-icon>
              </div>
              <span class="action-text username">{{ username }}</span>
              <el-icon class="arrow-icon" :class="{ 'is-rotated': showDropdown }"
                ><ArrowDown
              /></el-icon>
            </div>

            <Transition name="dropdown-fade">
              <div v-show="showDropdown" class="custom-dropdown-menu">
                <div class="dropdown-item" @click="handleMenuClick('center')">
                  <span class="item-text">个人中心</span>
                </div>
                <div class="dropdown-item" @click="handleMenuClick('address')">
                  <span class="item-text">地址管理</span>
                </div>
                <div class="dropdown-item" @click="handleMenuClick('orders')">
                  <span class="item-text">我的订单</span>
                </div>
                <div class="dropdown-divider"></div>
                <div class="dropdown-item logout-item" @click="handleMenuClick('logout')">
                  <span class="item-text">退出登录</span>
                </div>
              </div>
            </Transition>
          </div>
        </template>

        <template v-else>
          <div class="login-auth">
            <span class="auth-btn login-btn" @click="goLogin('login')">登录</span>
            <span class="auth-btn register-btn" @click="goLogin('register')">注册</span>
          </div>
        </template>
      </div>
    </div>

    <!-- 悬浮客服按钮 -->
    <div
      class="floating-service-btn"
      :style="{ left: pos.x + 'px', top: pos.y + 'px', bottom: 'auto', right: 'auto' }"
      @mousedown="handleMouseDown"
      @click="handleServiceClick"
      title="联系客服"
    >
      <el-icon size="24"><Headset /></el-icon>
      <span class="btn-text">客服</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Search, User, ArrowDown, Headset } from '@element-plus/icons-vue'
import { useCartStore } from '@/stores/cart'

const router = useRouter()
const route = useRoute()
const cartStore = useCartStore()

const isCartActive = computed(() => route.path === '/cart')

const keyword = ref('')
const isLogin = ref(false)
const username = ref('')
const userAvatar = ref('')
const showDropdown = ref(false)

// 悬浮按钮拖拽逻辑
const EDGE_MARGIN = 40
const BUTTON_SIZE = 60

const pos = ref({
  x: typeof window !== 'undefined' ? window.innerWidth - BUTTON_SIZE - EDGE_MARGIN : 1130,
  y: typeof window !== 'undefined' ? window.innerHeight - BUTTON_SIZE - EDGE_MARGIN : 590,
})
const startPos = ref({ x: 0, y: 0 })
const relativePos = ref({ x: 0, y: 0 })
let isMoved = false

const handleMouseDown = (e: MouseEvent) => {
  isMoved = false
  startPos.value = { x: e.clientX, y: e.clientY }
  const initialX = pos.value.x
  const initialY = pos.value.y

  const onMouseMove = (moveEvent: MouseEvent) => {
    const dx = moveEvent.clientX - startPos.value.x
    const dy = moveEvent.clientY - startPos.value.y

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      isMoved = true
    }

    let newX = initialX + dx
    let newY = initialY + dy

    const maxX = window.innerWidth - BUTTON_SIZE - EDGE_MARGIN
    const maxY = window.innerHeight - BUTTON_SIZE - EDGE_MARGIN
    newX = Math.max(EDGE_MARGIN, Math.min(newX, maxX))
    newY = Math.max(EDGE_MARGIN, Math.min(newY, maxY))

    pos.value = { x: newX, y: newY }
    relativePos.value = {
      x: newX / window.innerWidth,
      y: newY / window.innerHeight,
    }
  }

  const onMouseUp = () => {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

const handleServiceClick = () => {
  if (!isMoved) {
    goService()
  }
}

const initPosition = () => {
  const x = window.innerWidth - BUTTON_SIZE - EDGE_MARGIN
  const y = window.innerHeight - BUTTON_SIZE - EDGE_MARGIN
  pos.value = { x, y }
  relativePos.value = {
    x: x / window.innerWidth,
    y: y / window.innerHeight,
  }
}

const clampPosition = () => {
  const newX = relativePos.value.x * window.innerWidth
  const newY = relativePos.value.y * window.innerHeight

  const maxX = window.innerWidth - BUTTON_SIZE - EDGE_MARGIN
  const maxY = window.innerHeight - BUTTON_SIZE - EDGE_MARGIN

  pos.value.x = Math.max(EDGE_MARGIN, Math.min(newX, maxX))
  pos.value.y = Math.max(EDGE_MARGIN, Math.min(newY, maxY))
}

const goHome = () => router.push('/')
const goLogin = (type: 'login' | 'register') => router.push({ path: '/login', query: { type } })
const goCart = () => router.push('/cart')
const goService = () => router.push('/service')

const handleSearch = () => {
  const queryText = keyword.value.trim()
  router.push({
    path: '/products',
    query: { keyword: queryText },
  })
}

const handleMenuClick = (command: string) => {
  showDropdown.value = false
  switch (command) {
    case 'center':
      router.push('/user/profile')
      break
    case 'orders':
      router.push('/user/orders')
      break
    case 'address':
      router.push('/user/address')
      break
    case 'logout':
      try {
        localStorage.removeItem('cart')
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
      } catch {
        console.warn('Logout cleanup failed')
      }
      try {
        cartStore.userId = null
      } catch {}
      isLogin.value = false
      username.value = ''
      router.push('/')
      break
  }
}

const updateUsernameFromStorage = () => {
  try {
    const raw = localStorage.getItem('userInfo')
    if (!raw) {
      username.value = ''
      userAvatar.value = ''
      isLogin.value = false
      return
    }
    const info = JSON.parse(raw) as Record<string, unknown>
    username.value = (info.nickname as string) || (info.username as string) || ''
    userAvatar.value = (info.avatar as string) || ''
    // 只要有用户信息，就认为是登录状态
    isLogin.value = !!(username.value || info.id)
  } catch {
    username.value = ''
    userAvatar.value = ''
    isLogin.value = false
  }
}

onMounted(() => {
  initPosition()
  updateUsernameFromStorage()
  window.addEventListener('storage', updateUsernameFromStorage)
  // 监听同一标签页内的用户信息更新事件
  window.addEventListener('userInfoUpdated', updateUsernameFromStorage)
  // 监听窗口大小变化，防止按钮超出边界
  window.addEventListener('resize', clampPosition)
})

onUnmounted(() => {
  window.removeEventListener('storage', updateUsernameFromStorage)
  window.removeEventListener('userInfoUpdated', updateUsernameFromStorage)
  window.removeEventListener('resize', clampPosition)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

/* CSS Variables - 与其他页面保持一致 */
.header-container {
  --bg-color: #ffffff;
  --text-primary: #1a1b25;
  --text-secondary: #5e6c84;
  --text-tertiary: #94a3b8;
  --accent-color: #4f46e5;
  --accent-gradient: linear-gradient(135deg, #4f46e5, #9333ea);
  --danger-color: #ef4444;
  --border-color: #e2e8f0;
  --card-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
  --hover-bg: #f8f9fc;

  font-family: 'Inter', sans-serif;
  width: 100%;
  height: 64px;
  background: var(--bg-color);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 999;
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.75);
}

.content-wrapper {
  max-width: 1240px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

/* --- Left Section --- */
.left-section {
  display: flex;
  align-items: center;
  gap: 48px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.logo-text {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, #1a1b25, #4f46e5);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.logo-badge {
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  background: var(--accent-gradient);
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 1px;
}

.nav-links {
  display: flex;
  gap: 8px;
}

.nav-item {
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.2s ease;
  position: relative;
}

.nav-item:hover {
  color: var(--accent-color);
  background: var(--hover-bg);
}

.nav-item.router-link-exact-active {
  color: var(--accent-color);
  background: #eef2ff;
}

.nav-item.router-link-exact-active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 3px;
  background: var(--accent-color);
  border-radius: 2px;
}

/* --- Center Section --- */
.center-section {
  flex: 1;
  display: flex;
  justify-content: center;
  max-width: 480px;
  margin: 0 32px;
}

.search-box {
  width: 100%;
}

:deep(.round-input .el-input__wrapper) {
  border-radius: 12px;
  padding: 4px 16px;
  background-color: var(--hover-bg);
  box-shadow: none !important;
  border: 1px solid transparent;
  transition: all 0.3s ease;
  height: 28px;
}

:deep(.round-input .el-input__wrapper:hover) {
  background-color: #f1f5f9;
}

:deep(.round-input .el-input__wrapper.is-focus) {
  background-color: #fff;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1) !important;
}

:deep(.round-input .el-input__inner) {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

:deep(.round-input .el-input__inner::placeholder) {
  color: var(--text-tertiary);
  font-weight: 400;
}

.search-icon {
  cursor: pointer;
  color: var(--text-tertiary);
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.search-icon:hover {
  color: var(--accent-color);
  background: #eef2ff;
}

/* --- Right Section --- */
.right-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.action-item:hover {
  color: var(--accent-color);
}

.action-item:not(.cart-item):hover {
  background: var(--hover-bg);
}

.action-text {
  font-weight: 600;
  font-size: 14px;
}

.action-text.router-link-exact-active {
  color: var(--accent-color);
  background: #eef2ff;
}

.action-text.router-link-exact-active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translatex(-50%);
  width: 20px;
  height: 3px;
  background: var(--accent-color);
  border-radius: 2px;
}

.cart-badge :deep(.el-badge__content) {
  width: 18px;
  height: 18px;
  line-height: 18px;
  font-size: 10px;
  font-weight: 600;
  border: none;
  background: var(--accent-color);
  border-radius: 50%;
  padding: 0;
}

/* --- User Profile --- */
.user-profile {
  padding: 6px 12px;
}

.avatar-mini {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eef2ff, #e0e7ff);
  border-radius: 50%;
  color: var(--accent-color);
  transition: all 0.2s ease;
  overflow: hidden;
}

.image-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-profile:hover .avatar-mini {
  background: var(--accent-gradient);
  color: #fff;
}

.username {
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}

.arrow-icon {
  font-size: 12px;
  transition: transform 0.2s ease;
}

.user-profile:hover .arrow-icon {
  transform: rotate(180deg);
}

/* --- Cart Item Active --- */
.cart-item {
  cursor: pointer;
}

.cart-item.is-active {
  color: var(--accent-color);
  background: #eef2ff;
}

.cart-item.is-active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 3px;
  background: var(--accent-color);
  border-radius: 2px;
}

/* --- Login Auth --- */
.login-auth {
  display: flex;
  align-items: center;
  gap: 12px;
}

.auth-btn {
  font-size: 14px;
  font-weight: 600;
  padding: 8px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.login-btn {
  color: var(--accent-color);
  background: #eef2ff;
}

.login-btn:hover {
  background: #e0e7ff;
}

.register-btn {
  color: #fff;
  background: var(--accent-gradient);
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
}

.register-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
}

/* --- Custom Dropdown Menu --- */
.user-menu-wrapper {
  position: relative;
}

.arrow-icon {
  font-size: 12px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.arrow-icon.is-rotated {
  transform: rotate(180deg);
}

.custom-dropdown-menu {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  min-width: 100px;
  padding: 8px;
  background: var(--bg-color);
  border-radius: 16px;
  border: 1px solid var(--border-color);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  transform-origin: top center;
}

/* 桥接层：防止鼠标移动到菜单时因 12px 间隙导致菜单消失 */
.custom-dropdown-menu::before {
  content: '';
  position: absolute;
  top: -14px;
  left: 0;
  width: 100%;
  height: 14px;
  background: transparent;
}

.dropdown-item {
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 2px 0;
  text-align: center;
  position: relative;
  user-select: none;
  border: 1px solid transparent;
}

.dropdown-item:hover {
  background: var(--hover-bg);
  border-color: var(--accent-color);
  color: var(--accent-color);
}

.dropdown-divider {
  height: 1px;
  background: rgba(226, 232, 240, 0.5);
  margin: 8px 8px;
}

.dropdown-item.logout-item:hover {
  background: rgba(239, 68, 68, 0.08);
  border-color: var(--danger-color);
  color: var(--danger-color);
}

.item-text {
  display: block;
}

/* Dropdown Fade Animation */
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-12px) scaleY(0.9) scaleX(0.95);
  filter: blur(8px);
}

.dropdown-fade-enter-to,
.dropdown-fade-leave-from {
  opacity: 1;
  transform: translateY(0) scaleY(1) scaleX(1);
  filter: blur(0);
}

:deep(.el-dropdown :focus-visible) {
  outline: none !important;
}

:deep(.el-tooltip__trigger:focus-visible) {
  outline: none !important;
}

/* --- Floating Service Button --- */
.floating-service-btn {
  position: fixed;
  width: 60px;
  height: 60px;
  background: #ffffff;
  border: 2px solid transparent;
  border-radius: 50%;
  box-shadow: 0 4px 20px rgba(79, 70, 229, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--accent-color);
  cursor: pointer;
  z-index: 9999;
  transition: all 0.3s ease;
  user-select: none;
}

.floating-service-btn:hover {
  border-color: var(--hover-bg);
  box-shadow: 0 4px 20px rgba(79, 70, 229, 0.3);
}

.btn-text {
  font-size: 10px;
  margin-top: 2px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

/* --- Responsive --- */
@media (max-width: 992px) {
  .nav-links {
    display: none;
  }

  .center-section {
    margin: 0 16px;
  }

  .logo-badge {
    display: none;
  }
}

@media (max-width: 768px) {
  .header-container {
    height: 64px;
  }

  .content-wrapper {
    padding: 0 16px;
  }

  .action-text {
    display: none;
  }

  .action-item {
    padding: 8px;
  }
}
</style>
