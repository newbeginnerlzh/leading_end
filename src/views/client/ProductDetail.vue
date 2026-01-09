<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
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
const thumbnailListRef = ref<HTMLElement | null>(null)

// 选中的规格
const selectedSpecs = ref<Record<string, string>>({})

// 初始化数据
const loadData = async () => {
  loading.value = true
  try {
    const id = Number(route.params.id) || 1001
    const data = (await getProductDetail(id)).data
    product.value = data
    document.title = `${data.name} - 联想商城`

    // 从 URL 查询参数中读取 skuId（从购物车跳转时会带上）
    const urlSkuId = route.query.skuId ? Number(route.query.skuId) : null

    if (urlSkuId) {
      // 查找对应的 SKU
      const targetSku = data.skus.find((sku) => sku.id === urlSkuId)
      if (targetSku) {
        // 自动填充该 SKU 的规格选择
        selectedSpecs.value = { ...targetSku.specs }
        return // 已完成预选，无需后续自动选择逻辑
      }
    }

    // 自动选中只有一个选项的规格（原有逻辑）
    data.specs.forEach((spec) => {
      if (spec.values.length === 1 && spec.values[0]) {
        selectedSpecs.value[spec.name] = spec.values[0]
      }
    })
  } catch (error) {
    void error
    // console.error('Failed to load product:', error)
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
const isSpecDisabled = (specName: string, specValue: string): boolean => {
  // 如果该规格已经被选中且值相同，则不禁用（允许点击取消，但通常不取消）
  if (selectedSpecs.value[specName] === specValue) {
    return false
  }

  // 构造“假设选中该值”后的新规格组合
  const hypotheticalSelection = {
    ...selectedSpecs.value,
    [specName]: specValue,
  }

  // 检查是否存在至少一个 SKU 能匹配这个假设组合
  const hasMatchingSku = product.value?.skus.some((sku) => {
    // 遍历所有已选规格（包括刚假设的）
    for (const key in hypotheticalSelection) {
      const selectedValue = hypotheticalSelection[key]
      if (selectedValue === undefined) continue // 跳过未选规格
      if (sku.specs[key] !== selectedValue) {
        return false // 任一不匹配即排除
      }
    }
    return true // 所有已选规格都匹配
  })

  // 如果没有匹配的 SKU，则禁用该选项
  return !hasMatchingSku
}

// 选择规格
const selectSpec = (specName: string, specValue: string) => {
  if (selectedSpecs.value[specName] === specValue) {
    // 取消选中
    delete selectedSpecs.value[specName] // 视需求而定，通常不允许取消必选项
  } else {
    selectedSpecs.value[specName] = specValue
  }
}

const redirectToLogin = () => {
  router.push({ path: '/login', query: { redirect: route.fullPath } })
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
  if (!cartStore.userId) {
    ElMessage.warning('请先登录')
    redirectToLogin()
    return
  }
  if (!product.value) return
  if (!isSkuSelected.value || !currentSku.value) {
    ElMessage.warning('请选择完整的商品规格')
    return
  }

  cartStore.addToCart(product.value, currentSku.value.id, count.value)

  ElMessage.success(`已加入购物车`)
  console.log('Cart Store Updated:', cartStore.items)
}

const handleBuyNow = () => {
  if (!cartStore.userId) {
    ElMessage.warning('请先登录')
    redirectToLogin()
    return
  }
  if (!isSkuSelected.value || !currentSku.value) {
    ElMessage.warning('请选择完整的商品规格')
    return
  }
  // 先加购，再跳转（或者直接带参数跳转，这里简化为先加购）
  // 为了实现“立即购买”不影响购物车的行为：
  // 不将商品加入购物车，而是将临时的购买数据写入 localStorage（key: direct_purchase），
  // 结算页会优先读取该数据进行结算。
  if (product.value) {
    const direct = [
      {
        skuId: currentSku.value.id,
        productId: product.value.id,
        name: product.value.name,
        imgUrl: product.value.mainImages?.[0] || '',
        specs: selectedSpecs.value,
        price: currentSku.value.price,
        count: count.value,
      },
    ]
    try {
      localStorage.setItem('direct_purchase', JSON.stringify(direct))
    } catch (error) {
      console.error('Failed to purchase:', error)
      // ignore
    }
    router.push('/checkout')
  }
}

// --- 数量控制逻辑 ---
const decreaseCount = () => {
  if (count.value > 1) {
    count.value--
  }
}

const increaseCount = () => {
  const maxStock = currentSku.value?.stock || 5
  if (count.value < maxStock) {
    count.value++
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

// 监听活动图片索引，自动滚动缩略图
watch(activeImageIndex, async (newIndex) => {
  await nextTick()
  const container = thumbnailListRef.value
  if (!container) return

  const thumbnails = container.querySelectorAll('.thumbnail')
  const target = thumbnails[newIndex] as HTMLElement
  if (!target) return

  // 计算目标位置，使选中的缩略图居中
  const containerWidth = container.clientWidth
  const targetLeft = target.offsetLeft
  const targetWidth = target.offsetWidth

  const scrollLeft = targetLeft - containerWidth / 2 + targetWidth / 2

  container.scrollTo({
    left: scrollLeft,
    behavior: 'smooth',
  })
})

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
        <div class="thumbnail-list-wrapper">
          <div class="thumbnail-list" ref="thumbnailListRef">
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
          <div class="qty-control">
            <button class="qty-btn" @click="decreaseCount">−</button>
            <span class="qty-val">{{ count }}</span>
            <button class="qty-btn" @click="increaseCount">+</button>
          </div>
          <span class="stock-info" v-if="currentSku">(库存: {{ currentSku.stock }})</span>
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
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.product-detail-page {
  max-width: 1240px;
  margin: 0 auto;
  padding: 30px 20px;
  background-color: #f7f9fa;
  min-height: 100vh;
}

.breadcrumb-container {
  margin-bottom: 0;
  padding: 20px 30px 0;
  background: #fff;
  border-radius: 16px 16px 0 0;
  border: 1px solid #f0f0f0;
  border-bottom: none;
}

.main-container {
  display: flex;
  gap: 40px;
  margin-bottom: 30px;
  background: #fff;
  border-radius: 0 0 16px 16px;
  padding: 20px 30px 30px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
  border: 1px solid #f0f0f0;
  border-top: none;
}

.gallery-section {
  width: 500px;
  flex-shrink: 0;
  position: sticky;
  top: 100px;
  align-self: flex-start;
}

.product-carousel {
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  margin-top: 60px;
}

.carousel-image {
  width: 100%;
  height: 100%;
  object-fit: contain; /* 保持图片比例 */
  background-color: #fff;
}

.thumbnail-list-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 15px;
}

.thumbnail-list {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  overflow-y: hidden;
  max-width: 100%;
  padding: 2px 24px; /* 增加左右内边距，配合渐变遮罩 */
  /* 隐藏滚动条 (Firefox) */
  scrollbar-width: none;
  /* 隐藏滚动条 (IE 10+) */
  -ms-overflow-style: none;
  /* 边缘渐变遮罩效果 */
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0,
    #000 24px,
    #000 calc(100% - 24px),
    transparent 100%
  );
  mask-image: linear-gradient(
    to right,
    transparent 0,
    #000 24px,
    #000 calc(100% - 24px),
    transparent 100%
  );
}

/* 隐藏滚动条 (Chrome/Safari/Webkit) */
.thumbnail-list::-webkit-scrollbar {
  display: none;
}

.thumbnail {
  width: 60px;
  height: 60px;
  border: 2px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  object-fit: cover;
  transition: all 0.2s;
}

.thumbnail:hover {
  border-color: #999;
}

.thumbnail.active {
  border-color: #4f46e5;
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
  background: linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%);
  padding: 20px;
  margin-bottom: 24px;
  border-radius: 12px;
  border: 1px solid #e0e7ff;
}

.price-symbol {
  font-size: 14px;
  color: #999;
  margin-right: 10px;
}

.price-value {
  font-size: 32px;
  color: #4f46e5;
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
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  flex: 1;
}

.spec-item {
  padding: 8px 15px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  text-align: center;
  box-sizing: border-box;
  background: #fafafa;
  width: 100%;
}

.spec-item:hover {
  border-color: #4f46e5;
  color: #4f46e5;
  background: #fff;
}

.spec-item.active {
  border-color: #4f46e5;
  color: #4f46e5;
  background-color: #eef2ff;
  font-weight: 500;
}

.spec-item.disabled {
  border-color: #f0f0f0;
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

/* 自定义数量控制器 - 与购物车统一 */
.qty-control {
  display: inline-flex;
  align-items: center;
  background: #f8f9fc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 4px;
}

.qty-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: #fff;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
}

.qty-btn:hover {
  background: #4f46e5;
  color: #fff;
}

.qty-btn:active {
  transform: scale(0.95);
}

.qty-val {
  width: 48px;
  text-align: center;
  font-size: 15px;
  font-weight: 600;
  color: #333;
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
  border-color: #4f46e5;
  color: #4f46e5;
  border-radius: 12px;
  transition: all 0.2s;
}

.btn-cart:hover {
  background-color: #eef2ff;
  border-color: #4338ca;
  color: #4338ca;
}

.btn-buy {
  width: 160px;
  background: linear-gradient(135deg, #4f46e5, #4338ca);
  border-color: transparent;
  border-radius: 12px;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

.btn-buy:hover {
  background: linear-gradient(135deg, #4338ca, #3730a3);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(79, 70, 229, 0.4);
}

.details-tabs {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
  border: 1px solid #f0f0f0;
}

/* 增大 tabs 字体并设置选中颜色 */
.details-tabs :deep(.el-tabs__item) {
  font-size: 16px;
  padding: 0 28px;
  height: 56px;
  line-height: 56px;
}

.details-tabs :deep(.el-tabs__item:hover) {
  color: #4f46e5;
}

.details-tabs :deep(.el-tabs__item.is-active) {
  color: #4f46e5;
}

.details-tabs :deep(.el-tabs__active-bar) {
  background-color: #4f46e5;
}

/* 让 Tabs 头部吸顶 */
.details-tabs :deep(.el-tabs__header) {
  position: sticky;
  top: 64px; /* 顶部导航栏高度 */
  z-index: 100;
  background-color: #fff;
  padding: 0px 20px;
  margin: 0;
  border-bottom: 1px solid #f0f0f0;
  border-radius: 16px;
}

/* 规格参数新样式 */
.params-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  padding: 30px;
  align-items: start;
}

.param-group {
  margin-bottom: 0;
}

.group-title {
  font-size: 16px;
  font-weight: bold;
  color: #4f46e5;
  margin-bottom: 15px;
  padding: 14px 20px;
  background-color: #f5f3ff;
  border-radius: 6px;
}

.group-items {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #f0f0f0;
}

.param-row {
  display: flex;
  border-bottom: 1px solid #f5f5f5;
  padding: 18px 20px;
  align-items: center;
  transition: background 0.2s;
}

.param-row:hover {
  background: #fafafa;
}

.param-row:last-child {
  border-bottom: none;
}

.param-key {
  width: 130px;
  color: #666;
  font-weight: 500;
  font-size: 14px;
  flex-shrink: 0;
}

.param-value {
  flex: 1;
  color: #333;
  font-size: 14px;
  word-break: break-all;
}

.loading-container {
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f9fa;
  min-height: 100vh;
}

/* 富文本内容区域 */
.rich-text-content {
  padding: 20px;
}

/* 富文本图片基础样式 */
.rich-text-content :deep(img) {
  display: block;
  max-width: 100%;
}

/* 第一张图片顶部圆角 */
.rich-text-content :deep(img:first-of-type) {
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}

/* 最后一张图片底部圆角 */
.rich-text-content :deep(img:last-of-type) {
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}

/* 评价占位区域 */
.reviews-placeholder {
  padding: 40px 20px;
}
</style>
