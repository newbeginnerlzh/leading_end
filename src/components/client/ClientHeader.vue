<template>
  <div class="header-container">
    <div class="content-wrapper">
      <!-- 1. 左侧：Logo + 导航菜单 -->
      <div class="left-section">
        <div class="logo" @click="goHome">联想商城</div>
        <nav class="nav-links">
          <router-link to="/" class="nav-item">商城首页</router-link>
          <router-link to="/products" class="nav-item">商品列表</router-link>
        </nav>
      </div>

      <!-- 2. 中间：圆角搜索框 -->
      <div class="center-section">
        <div class="search-box">
          <el-input
            v-model="keyword"
            placeholder="搜索 ThinkBook 14+ ..."
            class="round-input"
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
          <!-- 购物车 -->
          <div class="action-item" @click="goCart" style="gap: 4px">
            <el-badge :value="cartStore.totalCount" class="cart-badge" :max="99">
              <el-icon :size="25"><ShoppingCart /></el-icon>
            </el-badge>
            <span class="text">购物车</span>
          </div>

          <!-- 个人中心 -->
          <el-dropdown trigger="hover" @command="handleUserCommand" popper-class="custom-dropdown">
            <div class="action-item user-profile">
              <el-icon :size="25"><User /></el-icon>
              <span class="text username">{{ username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="center">个人中心</el-dropdown-item>
                <el-dropdown-item command="orders">我的订单</el-dropdown-item>
                <el-dropdown-item command="address">地址管理</el-dropdown-item>
                <el-dropdown-item divided command="logout" style="color: red"
                  >退出登录</el-dropdown-item
                >
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>

        <template v-else>
          <div class="login-auth">
            <span class="auth-btn" @click="goLogin('login')">登录</span>
            <span class="divider">|</span>
            <span class="auth-btn" @click="goLogin('register')">注册</span>
          </div>
        </template>
      </div>
    </div>

    <!-- ✨ 新增：全局悬浮客服按钮 ✨ -->
    <div class="floating-service-btn" @click="goService" title="联系客服">
      <el-icon size="24"><Headset /></el-icon>
      <span class="btn-text">客服</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
// 引入图标，新增 Headset 图标
import { Search, ShoppingCart, User, ArrowDown, Headset } from '@element-plus/icons-vue'
import { useCartStore } from '@/stores/cart'

const router = useRouter()
const cartStore = useCartStore()

const keyword = ref('')
const isLogin = ref(false)
const username = ref('')

const goHome = () => router.push('/')
const goLogin = (type: 'login' | 'register') => router.push({ path: '/login', query: { type } })
const goCart = () => router.push('/cart')

// ✨ 新增：跳转客服页面
const goService = () => router.push('/service')

const handleSearch = () => {
  if (keyword.value) {
    router.push(`/list?keyword=${keyword.value}`)
  }
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
      // 清理本地用户信息和 Token，重置购物车用户，并跳回首页
      try {
        localStorage.removeItem('cart')
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
      } catch {
        console.warn('Failed to clear localStorage on logout')
      }
      // reset cart store userId
      try {
        cartStore.userId = null
        console.log('Cart Store Updated:', cartStore.userId)
      } catch {
        // ignore
      }
      isLogin.value = false
      username.value = ''
      router.push('/')
      break
  }
}

// 从 localStorage 初始化用户名，并监听 storage 事件以响应其他标签页的变动
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
  updateUsernameFromStorage()
  window.addEventListener('storage', updateUsernameFromStorage)
  // 监听同一标签页内的用户信息更新事件
  window.addEventListener('userInfoUpdated', updateUsernameFromStorage)
})

onUnmounted(() => {
  window.removeEventListener('storage', updateUsernameFromStorage)
  window.removeEventListener('userInfoUpdated', updateUsernameFromStorage)
})
</script>

<style scoped>
/* 原有样式保持不变... */
.header-container {
  width: 100%;
  height: 64px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 999;
}
.content-wrapper {
  max-width: 1240px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}
.left-section {
  display: flex;
  align-items: center;
  gap: 40px;
}
.logo {
  font-size: 24px;
  font-weight: 900;
  color: #333;
  cursor: pointer;
  letter-spacing: 1px;
}
.nav-links {
  display: flex;
  gap: 25px;
  margin-right: 40px;
}
.nav-item {
  text-decoration: none;
  font-size: 16px;
  color: #666;
  font-weight: 500;
  transition: color 0.3s;
}
.nav-item:hover,
.nav-item.router-link-active {
  color: #409eff;
}
.center-section {
  flex: 1;
  display: flex;
  justify-content: center;
}
.search-box {
  width: 100%;
  max-width: 500px;
}
:deep(.round-input .el-input__wrapper) {
  border-radius: 100px;
  padding-left: 20px;
  background-color: #f5f5f5;
  box-shadow: none !important;
  transition: all 0.3s;
}
:deep(.round-input .el-input__wrapper.is-focus) {
  background-color: #fff;
  box-shadow: 0 0 0 1px #409eff !important;
}
.search-icon {
  cursor: pointer;
  color: #666;
}
.search-icon:hover {
  color: #409eff;
}
.right-section {
  display: flex;
  align-items: center;
  min-width: 180px;
  justify-content: flex-end;
  gap: 20px;
}
.login-auth {
  font-weight: 900;
  font-size: 14px;
  color: #666;
}
.auth-btn {
  cursor: pointer;
  padding: 0 5px;
  transition: color 0.2s;
}
.auth-btn:hover {
  color: #409eff;
}
.divider {
  color: #ddd;
  margin: 0 5px;
}
.action-item {
  display: flex;
  align-items: center;
  height: 40px;
  line-height: 1;
  cursor: pointer;
  color: #666;
  transition: color 0.2s;
  margin-left: 20px;
}
.action-item:hover {
  color: #409eff;
}
.action-item .text {
  font-weight: 700;
  font-size: 14px;
}
.el-icon {
  vertical-align: middle;
}
.cart-badge {
  display: flex;
  align-items: center;
}
.user-profile {
  display: flex;
  align-items: center;
  gap: 4px;
}
.username {
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
:deep(.el-badge__content) {
  height: 16px;
  line-height: 16px;
  padding: 0 5px;
  font-size: 10px;
  border: none;
}
:deep(.el-dropdown :focus-visible) {
  outline: none !important;
}
:deep(.el-tooltip__trigger:focus-visible) {
  outline: none !important;
}

/* ✨ 新增：悬浮按钮样式 ✨ */
.floating-service-btn {
  position: fixed;
  bottom: 50px;
  right: 50px;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #409eff, #337ecc);
  border-radius: 50%;
  box-shadow: 0 4px 15px rgba(64, 158, 255, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  cursor: pointer;
  z-index: 9999; /* 确保在最顶层 */
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.floating-service-btn:hover {
  transform: scale(1.1) translateY(-5px);
  box-shadow: 0 8px 25px rgba(64, 158, 255, 0.6);
}

.btn-text {
  font-size: 10px;
  margin-top: 2px;
  font-weight: bold;
}
</style>
