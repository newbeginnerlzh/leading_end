<template>
  <!-- 1. 全局顶部导航栏 -->
  <!-- 只有当路由 meta 没有 hideHeader 时才显示（比如 404 页面可能不想要导航） -->
  <Header v-if="!$route.meta.hideHeader" />
  <!-- 页面组件会显示在这里 -->
  <router-view></router-view>
  <!-- 2. 全局页脚 -->
  <!-- 只有当路由 meta 没有 hideFooter 时才显示（登录、注册、客服页面不显示页脚） -->
  <Footer v-if="!$route.meta.hideFooter" />
</template>
<script setup lang="ts">
import Header from './components/client/ClientHeader.vue'
import Footer from './components/client/ClientFooter.vue'
</script>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

/* 全局样式重置 */
body {
  margin: 0;
  padding: 0;
  font-family:
    'Inter', 'Noto Sans SC', 'Helvetica Neue', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei';
  background-color: #f7f9fa;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
