<template>
  <!-- 1. 全局顶部导航栏 -->
  <!-- 只有当路由 meta 没有 hideHeader 时才显示（比如 404 页面可能不想要导航） -->
  <Header v-if="!$route.meta.hideHeader" />
  <!-- 页面组件会显示在这里 -->
  <router-view></router-view>
</template>
<script setup lang="ts">
import Header from './components/client/ClientHeader.vue'
</script>
<style>
/* 全局样式重置 */
body {
  margin: 0;
  padding: 0;
  font-family:
    'Noto Sans SC', 'Helvetica Neue', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei';
  background-color: #f7f9fa; /* 稍微带点灰的背景，让白色卡片更明显 */

  /* 让字体渲染更清晰（防锯齿） */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 针对我们自定义的 custom-dropdown 修改样式 */
.custom-dropdown .el-dropdown-menu__item {
  /* 增加一点上下间距，让菜单不那么挤 */
  margin: 4px 0;
  /* 稍微圆角一点 */
  border-radius: 4px;
  /* 字体颜色 */
  color: #606266;
}

/* 修改鼠标悬停（Hover）时的样式 */
.custom-dropdown .el-dropdown-menu__item:not(.is-disabled):hover {
  /* 1. 核心：把背景色去掉（设为透明） */
  background-color: transparent !important;

  /* 2. 替代方案：改成文字变色 */
  color: #409eff !important;

  /* 3. (可选) 稍微加个非常淡的背景，或者干脆只变色 */
  /* background-color: #ecf5ff !important; */

  /* 4. (可选) 字体微微加粗 */
  font-weight: 700;
}

/* 针对“退出登录”那个红色的选项单独处理 */
.custom-dropdown .el-dropdown-menu__item--divided {
  border-top-color: #eee;
}
</style>
