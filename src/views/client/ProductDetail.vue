<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProductDetail } from '@/api/product'
import type { ProductDetail, SkuItem } from '@/api/model/productModel'
import { useCartStore } from '@/stores/cart'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()

const product = ref<ProductDetail | null>(null)
const loading = ref(false)
const count = ref(1)
const activeTab = ref('intro')

// 选中的规格：{ "硬盘容量": "1T", "显卡": "RTX 5060" }
const selectedSpecs = ref<Record<string, string>>({})

// 初始化数据
const loadData = async () => {
  loading.value = true
  try {
    const id = Number(route.params.id) || 1001
    const data = await getProductDetail(id)
    product.value = data
    document.title = `${data.name} - 联想商城`

    // 默认选中第一个 SKU 的规格（可选）
    // if (data.skus.length > 0) {
    //   selectedSpecs.value = { ...data.skus[0].specs }
    // }
  } catch (error) {
    console.error('Failed to load product:', error)
    ElMessage.error('商品加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

// --- SKU 核心逻辑 ---

// 计算当前选中的规格是否匹配到了一个唯一的 SKU
const currentSku = computed<SkuItem | undefined>(() => {
  if (!product.value) return undefined
  return product.value.skus.find((sku) => {
    // 检查每一个规格是否都匹配
    for (const key in sku.specs) {
      if (sku.specs[key] !== selectedSpecs.value[key]) {
        return false
      }
    }
    // 确保选中的规格数量和 SKU 定义的规格数量一致
    return Object.keys(sku.specs).length === Object.keys(selectedSpecs.value).length
  })
})

// 检查某个规格值是否可选（简单处理：假设所有组合都存在，或者根据 SKU 列表反推）
// 在复杂场景下，这里需要用邻接矩阵或图算法。这里简化为：只要该规格值存在于 SKU 列表中即可。
const isSpecDisabled = (specName: string, specValue: string) => {
  void specName
  void specValue
  // 暂时不禁用，因为 Mock 数据是完全组合。
  // 如果需要严格校验，可以检查：在当前已选其他规格的基础上，选这个值是否有对应的 SKU。
  return false
}

// 选择规格
const selectSpec = (specName: string, specValue: string) => {
  if (selectedSpecs.value[specName] === specValue) {
    // 取消选中
    // delete selectedSpecs.value[specName] // 视需求而定，通常不允许取消必选项
  } else {
    selectedSpecs.value[specName] = specValue
  }
}

// 价格显示
const displayPrice = computed(() => {
  if (currentSku.value) {
    return `¥${currentSku.value.price}`
  }
  return product.value?.priceRange || '暂无报价'
})

// 是否完成所有规格选择
const isSkuSelected = computed(() => {
  if (!product.value) return false
  return product.value.specs.every((spec) => selectedSpecs.value[spec.name])
})

// --- 交互逻辑 ---

const handleAddToCart = () => {
  if (!product.value) return
  if (!isSkuSelected.value || !currentSku.value) {
    ElMessage.warning('请选择完整的商品规格')
    return
  }

  cartStore.addToCart(product.value, currentSku.value.id, count.value)

  ElMessage.success(`已加入购物车，当前购物车共 ${cartStore.totalCount} 件商品`)
  console.log('Cart Store Updated:', cartStore.items)
}

const handleBuyNow = () => {
  if (!isSkuSelected.value || !currentSku.value) {
    ElMessage.warning('请选择完整的商品规格')
    return
  }
  // 先加购，再跳转（或者直接带参数跳转，这里简化为先加购）
  if (product.value) {
    cartStore.addToCart(product.value, currentSku.value.id, count.value)
    router.push('/checkout')
  }
}
</script>

<template>
  <div class="product-detail-page" v-if="product">
    <!-- 面包屑 -->
    <div class="breadcrumb-container">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>笔记本</el-breadcrumb-item>
        <el-breadcrumb-item>{{ product.name }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- 主体区域 -->
    <div class="main-container">
      <!-- 左侧图片 -->
      <div class="gallery-section">
        <el-carousel trigger="click" height="400px" class="product-carousel">
          <el-carousel-item v-for="item in product.mainImages" :key="item">
            <img :src="item" class="carousel-image" alt="Product Image" />
          </el-carousel-item>
        </el-carousel>
        <div class="thumbnail-list">
          <!-- 缩略图占位 -->
          <img
            v-for="(img, index) in product.mainImages"
            :key="index"
            :src="img"
            class="thumbnail"
          />
        </div>
      </div>

      <!-- 右侧信息 -->
      <div class="info-section">
        <h1 class="product-title">{{ product.name }}</h1>
        <p class="product-desc">{{ product.desc }}</p>

        <div class="price-box">
          <span class="price-symbol">价格</span>
          <span class="price-value">{{ displayPrice }}</span>
        </div>

        <!-- 规格选择 -->
        <div class="specs-container">
          <div v-for="spec in product.specs" :key="spec.name" class="spec-row">
            <div class="spec-name">{{ spec.name }}</div>
            <div class="spec-values">
              <div
                v-for="val in spec.values"
                :key="val"
                class="spec-item"
                :class="{
                  active: selectedSpecs[spec.name] === val,
                  disabled: isSpecDisabled(spec.name, val),
                }"
                @click="!isSpecDisabled(spec.name, val) && selectSpec(spec.name, val)"
              >
                {{ val }}
              </div>
            </div>
          </div>
        </div>

        <!-- 数量选择 -->
        <div class="quantity-row">
          <span class="label">数量</span>
          <el-input-number v-model="count" :min="1" :max="currentSku?.stock || 5" />
          <span class="stock-info" v-if="currentSku"> (库存: {{ currentSku.stock }})</span>
        </div>

        <!-- 按钮组 -->
        <div class="action-buttons">
          <el-button size="large" class="btn-cart" @click="handleAddToCart">加入购物车</el-button>
          <el-button type="primary" size="large" class="btn-buy" @click="handleBuyNow"
            >立即购买</el-button
          >
        </div>
      </div>
    </div>

    <!-- 底部 Tabs -->
    <div class="details-tabs">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="商品介绍" name="intro">
          <div class="rich-text-content" v-html="product.detailHtml"></div>
        </el-tab-pane>

        <el-tab-pane label="规格参数" name="params">
          <div class="params-table">
            <div class="param-row" v-for="(value, key) in product.params" :key="key">
              <span class="param-key">{{ key }}</span>
              <span class="param-value">{{ value }}</span>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="商品评价" name="reviews">
          <div class="reviews-placeholder">
            <el-empty description="暂无评价" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>

  <div v-else class="loading-container" v-loading="loading">
    <!-- Loading state -->
  </div>
</template>

<style scoped>
.product-detail-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.breadcrumb-container {
  margin-bottom: 20px;
}

.main-container {
  display: flex;
  gap: 40px;
  margin-bottom: 40px;
}

.gallery-section {
  width: 500px;
  flex-shrink: 0;
}

.product-carousel {
  border: 1px solid #eee;
  border-radius: 4px;
  overflow: hidden;
}

.carousel-image {
  width: 100%;
  height: 100%;
  object-fit: contain; /* 保持图片比例 */
  background-color: #fff;
}

.thumbnail-list {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.thumbnail {
  width: 60px;
  height: 60px;
  border: 1px solid #ddd;
  cursor: pointer;
  object-fit: cover;
}

.info-section {
  flex: 1;
}

.product-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #333;
}

.product-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
}

.price-box {
  background: #f5f5f5;
  padding: 15px;
  margin-bottom: 20px;
  border-radius: 4px;
}

.price-symbol {
  font-size: 14px;
  color: #999;
  margin-right: 10px;
}

.price-value {
  font-size: 24px;
  color: #e4393c;
  font-weight: bold;
}

.spec-row {
  margin-bottom: 15px;
}

.spec-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
}

.spec-values {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.spec-item {
  padding: 6px 15px;
  border: 1px solid #ddd;
  border-radius: 2px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.spec-item:hover {
  border-color: #e4393c;
  color: #e4393c;
}

.spec-item.active {
  border-color: #e4393c;
  background-color: #e4393c;
  color: #fff;
}

.spec-item.disabled {
  border-color: #eee;
  color: #ccc;
  cursor: not-allowed;
  background-color: #f9f9f9;
}

.quantity-row {
  margin: 20px 0;
  display: flex;
  align-items: center;
  gap: 15px;
}

.stock-info {
  font-size: 12px;
  color: #999;
}

.action-buttons {
  margin-top: 30px;
  display: flex;
  gap: 20px;
}

.btn-cart {
  width: 160px;
  border-color: #e4393c;
  color: #e4393c;
}

.btn-buy {
  width: 160px;
  background-color: #e4393c;
  border-color: #e4393c;
}

.details-tabs {
  margin-top: 40px;
  background: #fff;
  padding: 20px;
  border: 1px solid #eee;
}

.rich-text-content {
  padding: 20px;
}

.params-table {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.param-row {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
  padding: 8px 0;
}

.param-key {
  width: 120px;
  color: #666;
}

.param-value {
  flex: 1;
  color: #333;
}

.loading-container {
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
