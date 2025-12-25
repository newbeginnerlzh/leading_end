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
            placeholder="搜索 ThinkBook 14+ ..."
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
          <div class="action-item cart-item" @click="goCart">
            <el-badge :value="cartStore.totalCount" class="cart-badge" :max="99">
              <div class="icon-wrapper">
                <el-icon :size="22"><ShoppingCart /></el-icon>
              </div>
            </el-badge>
            <span class="action-text">购物车</span>
          </div>

          <el-dropdown trigger="hover" @command="handleUserCommand" popper-class="custom-dropdown">
            <div class="action-item user-profile">
              <div class="avatar-mini">
                <el-icon :size="18"><User /></el-icon>
              </div>
              <span class="action-text username">{{ username }}</span>
              <el-icon class="arrow-icon"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu class="modern-dropdown">
                <el-dropdown-item command="center">
                  <el-icon><User /></el-icon>
                  个人中心
                </el-dropdown-item>
                <el-dropdown-item command="address">
                  <el-icon><Location /></el-icon>
                  地址管理
                </el-dropdown-item>
                <el-dropdown-item command="orders">
                  <el-icon><List /></el-icon>
                  我的订单
                </el-dropdown-item>
                <el-dropdown-item divided command="logout" class="logout-item">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
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
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Search,
  ShoppingCart,
  User,
  ArrowDown,
  Headset,
  Location,
  List,
  SwitchButton,
} from '@element-plus/icons-vue'
import { useCartStore } from '@/stores/cart'

const router = useRouter()
const cartStore = useCartStore()

const keyword = ref('')
const isLogin = ref(false)
const username = ref('')

// 悬浮按钮拖拽逻辑
const pos = ref({ x: 0, y: 0 })
const startPos = ref({ x: 0, y: 0 })
let isMoved = false

const handleMouseDown = (e: MouseEvent) => {
  isMoved = false
  startPos.value = { x: e.clientX, y: e.clientY }
  const initialX = pos.value.x
  const initialY = pos.value.y

  const onMouseMove = (moveEvent: MouseEvent) => {
    const dx = moveEvent.clientX - startPos.value.x
    const dy = moveEvent.clientY - startPos.value.y

    // 如果移动距离超过 3 像素，则认为是拖拽而非点击
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      isMoved = true
    }

    let newX = initialX + dx
    let newY = initialY + dy

    // 边界检查（按钮宽高为 60px）
    const maxX = window.innerWidth - 60
    const maxY = window.innerHeight - 60
    newX = Math.max(0, Math.min(newX, maxX))
    newY = Math.max(0, Math.min(newY, maxY))

    pos.value = { x: newX, y: newY }
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
  // 初始位置：右下角留出 50px 边距
  pos.value = {
    x: window.innerWidth - 110,
    y: window.innerHeight - 110,
  }
}

const clampPosition = () => {
  // 窗口缩放时，确保按钮仍在可视区域内
  const maxX = window.innerWidth - 60
  const maxY = window.innerHeight - 60
  pos.value.x = Math.max(0, Math.min(pos.value.x, maxX))
  pos.value.y = Math.max(0, Math.min(pos.value.y, maxY))
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

const handleUserCommand = (command: string) => {
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
      return
    }
    const info = JSON.parse(raw) as Record<string, unknown>
    username.value = (info.nickname as string) || (info.username as string) || ''
    if (username.value) isLogin.value = true
  } catch {
    username.value = ''
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
  height: 72px;
  background: var(--bg-color);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 999;
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.95);
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

.logo:hover {
  transform: scale(1.02);
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
  height: 42px;
}

:deep(.round-input .el-input__wrapper:hover) {
  background-color: #f1f5f9;
}

:deep(.round-input .el-input__wrapper.is-focus) {
  background-color: #fff;
  border-color: var(--accent-color);
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
  background: var(--hover-bg);
}

.icon-wrapper {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--hover-bg);
  border-radius: 10px;
  transition: all 0.2s ease;
}

.action-item:hover .icon-wrapper {
  background: #eef2ff;
}

.action-text {
  font-weight: 600;
  font-size: 14px;
}

.cart-badge :deep(.el-badge__content) {
  height: 18px;
  line-height: 18px;
  padding: 0 6px;
  font-size: 11px;
  font-weight: 600;
  border: none;
  background: var(--accent-color);
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

/* --- Dropdown Styles --- */
:deep(.el-dropdown-menu) {
  padding: 8px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

:deep(.el-dropdown-menu__item) {
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.2s ease;
}

:deep(.el-dropdown-menu__item:hover) {
  background: var(--hover-bg);
  color: var(--accent-color);
}

:deep(.el-dropdown-menu__item .el-icon) {
  font-size: 16px;
}

:deep(.el-dropdown-menu__item.logout-item) {
  color: var(--danger-color);
}

:deep(.el-dropdown-menu__item.logout-item:hover) {
  background: #fef2f2;
  color: var(--danger-color);
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
  background: var(--accent-gradient);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(79, 70, 229, 0.35);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  cursor: move;
  z-index: 9999;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  user-select: none;
}

.floating-service-btn:hover {
  transform: scale(1.08) translateY(-3px);
  box-shadow: 0 8px 30px rgba(79, 70, 229, 0.5);
  border-radius: 20px;
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
