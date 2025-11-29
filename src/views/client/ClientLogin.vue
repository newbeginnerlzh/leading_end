<!-- Login.vue -->
<template>
  <div class="login-container">
    <div class="login-box">
      <!-- v-model 绑定当前激活的 tab -->
      <el-tabs v-model="activeTab" stretch>
        <el-tab-pane label="用户登录" name="login">
          <!-- 登录表单 -->
        </el-tab-pane>
        <el-tab-pane label="账号注册" name="register">
          <!-- 注册表单 -->
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router' // 引入 useRoute 获取参数

const route = useRoute()
const activeTab = ref('login') // 默认是登录

onMounted(() => {
  // 检查 URL 里有没有 type 参数
  const type = route.query.type as string
  if (type === 'register') {
    activeTab.value = 'register' // 如果是注册，自动切过去
  }
})
</script>
