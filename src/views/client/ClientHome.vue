<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { ArrowRight, Hot, Star } from '@element-plus/icons-vue' 
import type { ProductSimple } from '@/api/model/productModel'
import { getHomeBanners, getHomeCategories } from '@/api/home'

// --- 0. 类型定义 ---
interface ApiProduct {
  id: number
  name: string
  price: string | number
  image?: string
  imgUrl?: string
  tag?: string
}

interface Banner {
  imgUrl: string
}

interface Category {
  id: number
  name: string
  subTitle?: string
  themeColor?: string
}

interface Floor extends Category {
  products: ProductSimple[]
}

// --- 1. 响应式数据 ---
const router = useRouter()
const bannerHeight = ref('480px') // 统一管理高度
const bannerList = ref<Banner[]>([])
const categoryList = ref<Category[]>([])
const floorList = ref<Floor[]>([])

// --- 2. 初始化数据 ---
const initData = async () => {
  try {
    const [resBanners, resCats] = await Promise.all([
      getHomeBanners(),
      getHomeCategories()
    ])

    bannerList.value = resBanners.data

    const dbCats = resCats.data
    const seckillCat = { 
      id: 1, 
      name: '热卖秒杀',
      subTitle: '每日特惠 限时抢购',
      themeColor: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
      badge: 'HOT'
    }

    categoryList.value = [seckillCat, ...dbCats]

    // 初始化楼层结构
    const floors = [seckillCat, ...dbCats].map((cat, index) => ({
      ...cat,
      products: [] as ProductSimple[],
      backgroundColor: getFloorBgColor(index)
    }))

    floorList.value = floors

    // 随后异步加载商品
    await fetchProductDataForFloors()

  } catch (error) {
    console.error('初始化数据失败:', error)
  }
}

// --- 3. 获取各楼层商品数据 ---
const fetchProductDataForFloors = async () => {
  const token = localStorage.getItem('token') || '';
  const requests = floorList.value.map(async (floor) => {
    try {
      const res = await axios.get('/api/products', {
        headers: { 'Authorization': `Bearer ${token}` },
        params: {
          keyword: ' ',
          categoryId: floor.id,
          page: 1,
          pageSize: 4,
          sort: 'price_asc'
        }
      });

      const resData = res.data;
      let productList: ApiProduct[] = [];

      // 兼容不同的后端返回结构
      if (resData?.data?.ProductSimple) productList = resData.data.ProductSimple;
      else if (resData?.data?.productSimple) productList = resData.data.productSimple;
      else if (Array.isArray(resData?.data)) productList = resData.data;

      // 映射为统一的 ProductSimple 类型
      floor.products = productList.map((item: ApiProduct) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        imgUrl: item.image || item.imgUrl || '',
        tags: item.tag ? [item.tag] : []
      }));
    } catch (err) {
      console.error(`❌ 楼层 [${floor.name}] 商品加载失败`, err);
    }
  });
  await Promise.all(requests);
}

onMounted(() => {
  initData()
})

// --- 4. 交互方法 ---
const goToCategory = (id: number) => {
  router.push({ path: '/products', query: { category: id } })
}

const scrollToFloor = (id: number) => {
  const element = document.getElementById(`floor-${id}`)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// 获取楼层背景色（参考华为商城风格）
const getFloorBgColor = (index: number) => {
  const colors = [
    'linear-gradient(135deg, #f5f7fa 0%, #f9fafc 100%)',
    'linear-gradient(135deg, #fafbfc 0%, #f5f7fa 100%)',
  ]
  return colors[index % colors.length]
}
</script>

<template>
  <div class="main-view">

    <!-- 1. 全屏通栏轮播区 -->
    <div class="banner-container">

      <!-- 底层：轮播图 -->
      <el-carousel
        trigger="click"
        :height="bannerHeight"
        :interval="5000"
        arrow="hover"
        class="full-width-carousel"
      >
        <el-carousel-item v-for="(item, index) in bannerList" :key="index">
          <img :src="item.imgUrl" alt="banner" class="banner-img" />
        </el-carousel-item>
      </el-carousel>

      <!-- 顶层：居中内容限制层 (高度始终 100%) -->
      <div class="banner-content-wrapper">
        <div class="category-sidebar">
          <ul class="category-list">
            <li
              v-for="cat in categoryList"
              :key="cat.id"
              class="category-item"
              @click="scrollToFloor(cat.id)"
            >
              <span class="cat-name">{{ cat.name }}</span>
              <el-icon class="arrow-icon"><ArrowRight /></el-icon>
            </li>
          </ul>
        </div>
      </div>

    </div>

    <!-- 3. 商品楼层区 - 参考华为商城楼层设计 -->
    <div class="floor-container">
      <div v-for="floor in floorList" :key="floor.id" :id="`floor-${floor.id}`" class="floor-section" :style="{ background: floor.backgroundColor }">
        <!-- 楼层标题栏 -->
        <div class="floor-header" :style="{ backgroundImage: floor.themeColor }">
          <div class="floor-header-left">
            <div class="floor-badge" v-if="floor.badge">{{ floor.badge }}</div>
            <h2 class="floor-header-title">{{ floor.name }}</h2>
            <p class="floor-header-subtitle">{{ floor.subTitle }}</p>
          </div>
          <div class="floor-header-right">
            <el-button type="primary" @click="goToCategory(floor.id)" class="view-all-btn">
              查看全部 <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
        </div>

        <!-- 楼层商品网格 -->
        <div class="floor-products-wrapper">
          <div class="floor-grid">
            <ProductCard 
              v-for="product in floor.products" 
              :key="product.id" 
              :product="product" 
              class="floor-product-card" 
            />
          </div>
          <el-empty 
            v-if="floor.products.length === 0" 
            description="暂无商品" 
            class="floor-empty" 
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-view { 
  width: 100%; 
  padding: 0; 
  background-color: #ffffff; 
  padding-bottom: 60px;
}

/* --- 1. 顶部导航栏 - 参考华为商城风格 --- */
.top-nav-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #ffffff;
  border-bottom: 1px solid #f0f0f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.nav-container {
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 20px;
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0;
}

.nav-item {
  flex: 0 0 auto;
  padding: 12px 18px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 3px solid transparent;
  font-size: 14px;
  color: #333;
  font-weight: 500;
  position: relative;
}

.nav-item:hover {
  color: #ff6b6b;
  border-bottom-color: #ff6b6b;
}

.nav-text {
  white-space: nowrap;
}

/* --- 2. 轮播容器 --- */
.banner-container {
  position: relative;
  width: 100%;
  height: v-bind(bannerHeight);
  background-color: #000;
  margin-bottom: 0;
  overflow: hidden;
  border-radius: 0;
}

.full-width-carousel {
  width: 100%;
  height: 100%;
}

.banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
}

/* --- 3. 楼层容器和全局样式 --- */
.floor-container {
  max-width: 1240px;
  margin: 0 auto;
  padding: 30px 20px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* --- 侧边栏菜单 --- */
.category-sidebar {
  width: 240px;
  height: 100%; /* 关键：继承 wrapper 的 100% 高度 */
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  pointer-events: auto; /* 恢复点击 */
  box-shadow: 4px 0 12px rgba(0, 0, 0, 0.08);
}

.category-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column; /* 纵向排列 */
  height: 100%; /* 填充整个 sidebar */
}

.category-item {
  flex: 1; /* 核心：平分高度，确保菜单底边始终对齐轮播图底边 */
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: #333;
  font-size: 15px;
  border-bottom: 1px solid rgba(0,0,0,0.03);
.floor-section {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 24px;
  border: 1px solid #f0f0f0;
  transition: all 0.3s ease;
  scroll-margin-top: 80px;
}

.floor-section:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  border-color: #e8e8e8;
}

.floor-section:last-child {
  margin-bottom: 0;
}

/* --- 楼层头部 - 参考华为商城设计 --- */
.floor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28px 30px;
  color: #ffffff;
  background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
  position: relative;
  overflow: hidden;
}

.floor-header::before {
  content: '';
  position: absolute;
  right: -50px;
  top: -50px;
  width: 200px;
  height: 200px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.floor-header::after {
  content: '';
  position: absolute;
  left: -30px;
  bottom: -30px;
  width: 150px;
  height: 150px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 50%;
}

.floor-header-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
  z-index: 2;
}

.floor-badge {
  display: inline-block;
  width: fit-content;
  padding: 2px 10px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  margin-bottom: 4px;
}

.floor-header-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  letter-spacing: 0.5px;
}

.floor-header-subtitle {
  font-size: 13px;
  margin: 0;
  opacity: 0.9;
}

.floor-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 2;
}

:deep(.view-all-btn) {
  background: rgba(255, 255, 255, 0.2) !important;
  border: 1px solid rgba(255, 255, 255, 0.4) !important;
  color: #fff !important;
  padding: 8px 20px !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  transition: all 0.3s ease !important;
}

:deep(.view-all-btn:hover) {
  background: rgba(255, 255, 255, 0.3) !important;
  border-color: rgba(255, 255, 255, 0.6) !important;
}

/* --- 楼层商品区 --- */
.floor-products-wrapper {
  padding: 24px;
  background: linear-gradient(135deg, #fafbfc 0%, #f5f7fa 100%);
}

.floor-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  min-height: 300px;
}

.floor-product-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #fff;
  border-radius: 8px;
  border: 1px solid transparent;
}

.floor-product-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
  border-color: #ff6b6b;
}

.category-item:hover {
  background-color: #fff;
  color: #4f46e5;
  padding-left: 40px;
  font-weight: bold;
.floor-empty {
  grid-column: 1 / -1;
  padding: 80px 20px;
}

/* --- 响应式设计 --- */
@media (max-width: 1200px) {
  .floor-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 992px) {
  .floor-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .floor-header {
    padding: 20px 24px;
  }

  .floor-header-title {
    font-size: 24px;
  }

  .floor-products-wrapper {
    padding: 16px;
  }
}

@media (max-width: 768px) {
  .nav-list {
    gap: 0;
  }

  .nav-item {
    padding: 10px 14px;
    font-size: 13px;
  }

  .floor-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .floor-header {
    flex-direction: column;
    align-items: flex-start;
    padding: 16px 20px;
  }

  .floor-header-title {
    font-size: 20px;
  }

  .floor-header-right {
    align-self: flex-end;
    margin-top: 12px;
  }

  .floor-container {
    padding: 16px 12px;
  }

  .floor-section {
    margin-bottom: 16px;
  }
}

@media (max-width: 480px) {
  .floor-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .floor-header-title {
    font-size: 18px;
  }

  .nav-item {
    padding: 8px 10px;
    font-size: 12px;
  }

  .top-nav-bar {
    font-size: 12px;
  }
}

/* --- Element Plus 样式覆盖 --- */
:deep(.el-carousel__indicators--horizontal) {
  bottom: 16px;
}

:deep(.el-carousel__button) {
  width: 32px;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.4);
}

:deep(.el-carousel__button.active) {
  background: #fff;
}
</style>
