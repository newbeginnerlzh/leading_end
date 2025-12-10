<template>
  <div class="user-layout-container">
    <el-container>
      <!-- 左侧：固定侧边栏 -->
      <el-aside width="200px" class="user-sidebar">
        <el-menu
          :default-active="$route.path"
          router
          class="el-menu-vertical-demo"
        >
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
        <router-view></router-view>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { User, Location, List } from '@element-plus/icons-vue';
</script>

<style scoped>
.user-layout-container {
  max-width: 1200px;
  margin: 20px auto;
  background-color: #fff;
  min-height: 600px; /* 保证高度 */
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}
.user-sidebar {
  border-right: 1px solid #eee;
  background-color: #fff;
  height: calc(100vh - 104px);
  position: sticky;
  top: 84px;
}
.user-content {
  padding: 20px;
  background-color: #fff;
}
</style>
