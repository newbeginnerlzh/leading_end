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
const activeImageIndex = ref(0)
const carouselRef = ref()

// 选中的规格
const selectedSpecs = ref<Record<string, string>>({})

// 初始化数据
const loadData = async () => {
  loading.value = true
  try {
    const id = Number(route.params.id) || 1001
    const data = await getProductDetail(id)
    product.value = data
    document.title = `${data.name} - 联想商城`

    // 自动选中只有一个选项的规格
    data.specs.forEach((spec) => {
      if (spec.values.length === 1 && spec.values[0]) {
        selectedSpecs.value[spec.name] = spec.values[0]
      }
    })
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

// --- 图片画廊逻辑 ---
const setActiveImage = (index: number) => {
  activeImageIndex.value = index
  carouselRef.value?.setActiveItem(index)
}

const handleCarouselChange = (index: number) => {
  activeImageIndex.value = index
}

// 规格参数分组
const paramGroups = [
  { title: '基本参数', keys: ['model', 'os', 'positioning'] },
  { title: '处理器', keys: ['cpuModel', 'cpuSeries', 'maxTurboFreq', 'cpuChip'] },
  {
    title: '显示屏',
    keys: ['screenSize', 'screenRatio', 'resolution', 'colorGamut', 'refreshRate'],
  },
  { title: '存储设备', keys: ['ramCapacity', 'ramType', 'ssdCapacity', 'ssdType'] },
  { title: '显卡', keys: ['gpuType', 'gpuChip', 'vramCapacity', 'vramType'] },
  { title: '多媒体', keys: ['camera'] },
  { title: '网络通信', keys: ['wifi', 'bluetooth'] },
  { title: 'I/O 接口', keys: ['dataInterfaces', 'videoInterfaces', 'audioInterfaces'] },
  { title: '输入设备', keys: ['keyboard', 'faceId'] },
  { title: '外观', keys: ['weight', 'thickness'] },
  { title: '其他', keys: ['software'] },
]

// 规格参数中文映射
const paramLabels: Record<string, string> = {
  model: '产品型号',
  os: '操作系统',
  positioning: '产品定位',
  cpuModel: 'CPU型号',
  cpuSeries: 'CPU系列',
  maxTurboFreq: '最高睿频',
  cpuChip: 'CPU芯片',
  screenSize: '屏幕尺寸',
  screenRatio: '显示比例',
  resolution: '屏幕分辨率',
  colorGamut: '色域',
  refreshRate: '屏幕刷新率',
  ramCapacity: '内存容量',
  ramType: '内存类型',
  ssdCapacity: '硬盘容量',
  ssdType: '硬盘类型',
  gpuType: '显卡类型',
  gpuChip: '显卡芯片',
  vramCapacity: '显存容量',
  vramType: '显存类型',
  camera: '摄像头',
  wifi: '无线网卡',
  bluetooth: '蓝牙',
  dataInterfaces: '数据接口',
  videoInterfaces: '视频接口',
  audioInterfaces: '音频接口',
  keyboard: '键盘描述',
  faceId: '人脸识别',
  weight: '重量',
  thickness: '厚度',
  software: '附带软件',
}

// 合并公共参数和当前 SKU 的差异参数
const mergedParams = computed(() => {
  if (!product.value) return {}

  // 基础参数：从 product.params 获取（公共参数）
  const baseParams = { ...product.value.params }

  // 如果有选中的 SKU 且该 SKU 有差异参数，则用差异参数覆盖公共参数
  if (currentSku.value?.diffParams) {
    Object.assign(baseParams, currentSku.value.diffParams)
  }

  return baseParams
})
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
        <el-carousel
          ref="carouselRef"
          trigger="click"
          height="400px"
          class="product-carousel"
          @change="handleCarouselChange"
        >
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
            :class="{ active: activeImageIndex === index }"
            @click="setActiveImage(index)"
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
          <span class="label">购买数量</span>
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
          <div class="params-container">
            <div v-for="group in paramGroups" :key="group.title" class="param-group">
              <h3 class="group-title">{{ group.title }}</h3>
              <div class="group-items">
                <div v-for="key in group.keys" :key="key" class="param-row">
                  <span class="param-key">{{ paramLabels[key] || key }}</span>
                  <span class="param-value">{{ (mergedParams as any)[key] || '—' }}</span>
                </div>
              </div>
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
  position: sticky;
  top: 200px;
  align-self: flex-start;
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
  border: 2px solid #ddd; /* 加粗一点边框以便高亮更明显 */
  cursor: pointer;
  object-fit: cover;
  transition: all 0.2s;
}

.thumbnail:hover {
  border-color: #999;
}

.thumbnail.active {
  border-color: #e4393c;
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

.specs-container {
  padding-left: 20px;
}

.spec-row {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.spec-name {
  font-size: 14px;
  color: #333;
  min-width: 80px;
  flex-shrink: 0;
}

.spec-values {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  flex: 1;
}

.spec-item {
  padding: 6px 15px;
  border: 1px solid #ddd;
  border-radius: 2px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  /* 强制一行两个：(100% - gap) / 2 */
  width: calc(50% - 5px);
  text-align: center;
  box-sizing: border-box;
}

.spec-item:hover {
  border-color: #e4393c;
  color: #e4393c;
}

.spec-item.active {
  border-color: #e4393c;
  color: #e4393c;
  background-color: transparent;
}

.spec-item.disabled {
  border-color: #eee;
  color: #ccc;
  cursor: not-allowed;
  background-color: #f9f9f9;
}

.quantity-row {
  margin: 20px 0;
  padding-left: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.quantity-row .label {
  font-size: 14px;
  color: #333;
  min-width: 80px;
  flex-shrink: 0;
}

/* 让数量选择器与上面的规格选项对齐 */
.quantity-row :deep(.el-input-number) {
  margin-left: 0;
}

.stock-info {
  font-size: 12px;
  color: #999;
}

.action-buttons {
  margin-top: 30px;
  display: flex;
  gap: 20px;
  justify-content: flex-start;
  padding-left: 20px;
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
  padding: 0;
  border: 1px solid #eee;
}

/* 增大 tabs 字体 */
.details-tabs :deep(.el-tabs__item) {
  font-size: 16px;
  padding: 0 24px;
}

/* 让 Tabs 头部吸顶 */
.details-tabs :deep(.el-tabs__header) {
  position: sticky;
  top: 64px; /* 顶部导航栏高度 */
  z-index: 100;
  background-color: #fff;
  padding: 0px 15px;
}

/* 规格参数新样式 */
.params-container {
  padding: 10px 0;
}

.param-group {
  margin-bottom: 30px;
}

.group-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
  padding-left: 10px;
  border-left: 4px solid #e4393c;
  background-color: #f9f9f9;
  padding: 10px;
}

.group-items {
  border-top: 1px solid #eee;
}

.param-row {
  display: flex;
  border-bottom: 1px solid #eee;
  padding: 12px 20px;
  align-items: center;
}

.param-key {
  width: 150px;
  color: #666;
  font-weight: 500;
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
