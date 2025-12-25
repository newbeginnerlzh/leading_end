<template>
  <div class="user-layout-container">
    <el-container class="main-container">
      <!-- 左侧：固定侧边栏 -->
      <el-aside width="200px" class="user-sidebar">
        <div class="sidebar-header">
          <h2 class="sidebar-title">个人中心</h2>
          <p class="sidebar-subtitle">User Center</p>
        </div>
        <el-menu :default-active="$route.path" router class="user-menu">
          <!-- index 写路由路径，开启 router 模式后点击会自动跳转 -->
          <el-menu-item index="/user/profile">
            <el-icon><User /></el-icon>
            <span>个人信息</span>
          </el-menu-item>

          <el-menu-item index="/user/address">
            <el-icon><Location /></el-icon>
            <span>收货地址</span>
          </el-menu-item>

          <el-menu-item index="/user/orders">
            <el-icon><List /></el-icon>
            <span>我的订单</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 右侧：可变内容区 -->
      <el-main class="user-content">
        <!-- 子页面的内容会渲染在这里 -->
        <router-view v-slot="{ Component }">
          <transition :name="transitionName" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { User, Location, List } from '@element-plus/icons-vue'

// 定义路由顺序（索引越小越靠上）
const routeOrder: Record<string, number> = {
  '/user/profile': 0,
  '/user/address': 1,
  '/user/orders': 2,
  '/user/order': 3, // 订单详情页
}

const route = useRoute()
const transitionName = ref('fade-slide-down')

// 获取路由的顺序索引
function getRouteIndex(path: string): number {
  // 精确匹配
  if (routeOrder[path] !== undefined) {
    return routeOrder[path]
  }
  // 前缀匹配（如 /user/order/123）
  for (const key in routeOrder) {
    if (path.startsWith(key) && routeOrder[key] !== undefined) {
      return routeOrder[key]!
    }
  }
  return 0
}

// 监听路由变化，根据导航方向设置动画
watch(
  () => route.path,
  (newPath, oldPath) => {
    if (!oldPath) return

    const newIndex = getRouteIndex(newPath)
    const oldIndex = getRouteIndex(oldPath)

    // 从上往下导航：离开页面向下滑出，新页面从下方滑入
    // 从下往上导航：离开页面向上滑出，新页面从上方滑入
    transitionName.value = newIndex > oldIndex ? 'fade-slide-down' : 'fade-slide-up'
  },
)
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.user-layout-container {
  --bg-color: #f8f9fc;
  --card-bg: #ffffff;
  --text-primary: #1a1b25;
  --text-secondary: #5e6c84;
  --text-tertiary: #94a3b8;
  --accent-color: #4f46e5;
  --accent-gradient: linear-gradient(135deg, #4f46e5, #9333ea);
  --border-color: #e2e8f0;
  --card-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
  --card-hover-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025);

  font-family: 'Inter', sans-serif;
  background-color: var(--bg-color);
  min-height: calc(100vh - 80px);
  padding: 40px 0;
  overflow-x: hidden; /* 防止水平抖动 */
}

.main-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  align-items: flex-start;
  gap: 30px;
}

/* --- Sidebar --- */
.user-sidebar {
  flex-shrink: 0;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  box-shadow: var(--card-shadow);
  padding: 24px 0;
  position: sticky;
  top: 100px;
  height: auto;
  transition: all 0.3s ease;
  animation: slideFadeBlurIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  z-index: 10;
}

.user-sidebar:hover {
  box-shadow: var(--card-hover-shadow);
}

.sidebar-header {
  padding: 0 24px 20px;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 16px;
}

.sidebar-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.5px;
}

.sidebar-subtitle {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  margin: 4px 0 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* --- Menu --- */
.user-menu {
  border-right: none !important;
  background: transparent !important;
}

.user-menu :deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
  margin: 4px 16px;
  border-radius: 12px;
  color: var(--text-secondary);
  font-weight: 500;
  transition: all 0.2s ease;
}

.user-menu :deep(.el-menu-item:hover) {
  background-color: #f1f5f9 !important;
  color: var(--accent-color);
}

.user-menu :deep(.el-menu-item.is-active) {
  background: #eef2ff !important;
  color: var(--accent-color) !important;
  font-weight: 700;
}

.user-menu :deep(.el-menu-item .el-icon) {
  font-size: 18px;
  margin-right: 12px;
  transition: transform 0.3s ease;
}

.user-menu :deep(.el-menu-item.is-active .el-icon) {
  transform: scale(1.1);
}

/* --- Content --- */
.user-content {
  flex: 1;
  min-width: 0; /* 重要：防止 flex 子项被内容撑开 */
  padding: 0;
  background-color: transparent;
  overflow: visible;
  min-height: 600px;
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

.fade-slide-down-enter-active,
.fade-slide-down-leave-active,
.fade-slide-up-enter-active,
.fade-slide-up-leave-active {
  transition: all 0.3s ease;
  overflow: hidden; /* 动画期间隐藏溢出，防止滚动条闪烁 */
}

/* 向下导航：离开页面向下滑出，新页面从下方滑入 */
.fade-slide-down-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 向上导航：离开页面向上滑出，新页面从上方滑入 */
.fade-slide-up-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-slide-up-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Responsive */
@media (max-width: 992px) {
  .main-container {
    flex-direction: column;
    padding: 0 15px;
  }

  .user-sidebar {
    width: 100% !important;
    position: static;
    margin-bottom: 20px;
    padding: 16px 0;
  }

  .sidebar-header {
    padding: 0 20px 12px;
    margin-bottom: 8px;
  }

  .user-menu {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
  }

  .user-menu :deep(.el-menu-item) {
    margin: 4px;
    padding: 0 15px;
  }
}
</style>
