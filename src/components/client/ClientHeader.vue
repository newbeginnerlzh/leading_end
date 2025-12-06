<template>
  <div class="header-container">
    <div class="content-wrapper">
      <!-- 1. 左侧：Logo + 导航菜单 -->
      <div class="left-section">
        <div class="logo" @click="goHome">联想商城</div>
        <nav class="nav-links">
          <!-- 这里的 active-class 可以让当前页面的链接高亮，Vue Router 自带功能 -->
          <router-link to="/" class="nav-item">商城首页</router-link>
          <router-link to="/list" class="nav-item">商品列表</router-link>
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
            <!-- 搜索图标按钮 -->
            <template #suffix>
              <el-icon :size="20" class="search-icon" @click="handleSearch"><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </div>

      <!-- 3. 右侧：用户操作区 -->
      <div class="right-section">
        <!-- 状态 A：已登录 -->
        <template v-if="isLogin">
          <!-- 购物车 (带小红点角标) -->
          <div class="action-item" @click="goCart" style="gap: 4px">
            <el-badge :value="cartStore.totalCount" class="cart-badge" :max="99">
              <el-icon :size="25"><ShoppingCart /></el-icon>
            </el-badge>
            <span class="text">购物车</span>
          </div>

          <!-- 个人中心 (下拉菜单) -->
          <el-dropdown trigger="hover" @command="handleUserCommand" popper-class="custom-dropdown">
            <div class="action-item user-profile">
              <el-icon :size="25"><User /></el-icon>
              <span class="text username">GeekUser</span>
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

        <!-- 状态 B：未登录 -->
        <template v-else>
          <div class="login-auth">
            <span class="auth-btn" @click="goLogin('login')">登录</span>
            <span class="divider">|</span>
            <span class="auth-btn" @click="goLogin('register')">注册</span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
// 引入图标
import { Search, ShoppingCart, User, ArrowDown } from '@element-plus/icons-vue'
import { useCartStore } from '@/stores/cart'

const router = useRouter()
const cartStore = useCartStore()

// --- 模拟状态 ---
const keyword = ref('')
const isLogin = ref(true) // 🔴 修改这里：true 显示已登录，false 显示未登录，用于测试

// --- 事件处理 ---
const goHome = () => router.push('/')
const goLogin = (type: 'login' | 'register') => router.push({ path: '/login', query: { type } })
const goCart = () => router.push('/cart')

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
      isLogin.value = false // 模拟退出
      break
  }
}
</script>

<style scoped>
/* 整个导航栏容器 */
.header-container {
  width: 100%;
  height: 64px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); /* 底部淡淡的阴影 */
  position: sticky; /* 吸顶效果 (可选) */
  top: 0;
  z-index: 999;
}

/* 内容居中限制最大宽度 */
.content-wrapper {
  max-width: 1240px; /* 和主流电商一致的宽度 */
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

/* --- 左侧区域 --- */
.left-section {
  display: flex;
  align-items: center;
  gap: 40px; /* Logo和导航的间距 */
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
  margin-right: 40px; /* 商品列表右侧加上空白占位 */
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
  color: #409eff; /* 鼠标移入或当前页高亮 */
}

/* --- 中间区域 --- */
.center-section {
  flex: 1; /* 占据剩余空间 */
  display: flex;
  justify-content: center;
}

.search-box {
  width: 100%;
  max-width: 500px;
}

/* 深度选择器：修改 Element Plus 输入框样式为圆角 */
:deep(.round-input .el-input__wrapper) {
  border-radius: 100px; /* 圆角胶囊形状 */
  padding-left: 20px;
  background-color: #f5f5f5; /* 浅灰背景 */
  box-shadow: none !important; /* 去掉默认边框 */
  transition: all 0.3s;
}

/* 鼠标点进去变白并加阴影 */
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

/* --- 右侧区域 --- */
.right-section {
  display: flex;
  align-items: center;
  min-width: 180px; /* 保证右侧不挤 */
  justify-content: flex-end;
  gap: 20px;
}

/* 登录/注册文字 */
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

/* 购物车和用户 */
.action-item {
  display: flex;
  align-items: center;
  height: 40px;
  line-height: 1;
  cursor: pointer;
  color: #666;
  transition: color 0.2s;
  margin-left: 20px; /* 购物车图标的左侧加上空白占位 */
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
  height: 16px; /* 默认是18px */
  line-height: 16px;
  padding: 0 5px;
  font-size: 10px; /* 字体改小 */
  border: none; /* 去掉白边，看起来更精致 */
}

/* --- 修复 Element Plus 下拉菜单的黑框问题 --- */

:deep(.el-dropdown :focus-visible) {
  outline: none !important;
}

:deep(.el-tooltip__trigger:focus-visible) {
  outline: none !important;
}
</style>
