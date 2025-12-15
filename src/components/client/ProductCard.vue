<script setup lang="ts">
// 显式引入 Vue API，防止 TS 报错
import { computed } from 'vue'
import { useRouter } from 'vue-router'
// 引入您的类型定义
import type { ProductSimple } from '@/api/model/productModel'

const props = defineProps<{
  product: ProductSimple
}>()

const router = useRouter()

const navigateToDetail = () => {
  router.push(`/product/${props.product.id}`)
}

// 格式化价格
const formattedPrice = computed(() => {
  return props.product.price.toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
})
</script>

<template>
  <el-card 
    class="product-card" 
    shadow="hover" 
    :body-style="{ padding: '0px' }"
    @click="navigateToDetail"
  >
    <!-- 图片容器 -->
    <div class="image-wrapper">
      <el-image 
        :src="product.imgUrl" 
        loading="lazy"
        fit="cover"
        class="product-img"
      >
        <!-- 加载失败占位 -->
        <template #error>
          <div class="image-slot">
            <span>暂无图片</span>
          </div>
        </template>
        <!-- 加载中占位 -->
        <template #placeholder>
          <div class="image-slot loading">Loading...</div>
        </template>
      </el-image>

      <!-- 标签浮层 -->
      <div v-if="product.tags && product.tags.length" class="tags-container">
        <el-tag 
          v-for="tag in product.tags" 
          :key="tag" 
          effect="dark" 
          size="small" 
          type="danger"
          class="tag-item"
        >
          {{ tag }}
        </el-tag>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="card-content">
      <h3 class="product-name" :title="product.name">
        {{ product.name }}
      </h3>
      
      <div class="bottom-info">
        <span class="currency">¥</span>
        <span class="price">{{ formattedPrice }}</span>
      </div>
    </div>
  </el-card>
</template>

<style scoped>
/* 这里已改为标准 CSS，无需安装 Sass */

.product-card {
  cursor: pointer;
  transition: transform 0.3s;
  border: none;
}

/* 悬停卡片上浮 */
.product-card:hover {
  transform: translateY(-5px);
}

/* 悬停时标题变色 */
.product-card:hover .product-name {
  color: var(--el-color-primary);
}

.image-wrapper {
  position: relative;
  width: 100%;
  padding-top: 100%; /* 1:1 正方形 */
  overflow: hidden;
  background-color: #f5f7fa;
}

.product-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transition: transform 0.3s;
}

/* 悬停图片放大 */
.image-wrapper:hover .product-img {
  transform: scale(1.05);
}

.tags-container {
  position: absolute;
  bottom: 8px;
  left: 8px;
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  z-index: 1;
}

.tag-item {
  font-size: 10px;
  height: 20px;
  padding: 0 4px;
}

.card-content {
  padding: 12px;
}

.product-name {
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
  height: 40px; /* 限制两行高度 */
  color: var(--el-text-color-primary);
  /* 多行省略 */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  margin-bottom: 8px;
}

.bottom-info {
  display: flex;
  align-items: baseline;
  color: var(--el-color-danger);
}

.currency {
  font-size: 12px;
  margin-right: 2px;
}

.price {
  font-size: 18px;
  font-weight: bold;
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 14px;
}
</style>