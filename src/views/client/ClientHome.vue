<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { ArrowRight } from '@element-plus/icons-vue'
import type { ProductSimple } from '@/api/model/productModel'
import { getHomeBanners, getHomeCategories } from '@/api/home'
import ProductCard from '@/components/client/ProductCard.vue'

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

const router = useRouter()
const bannerHeight = ref('520px')
const bannerList = ref<Banner[]>([])
const categoryList = ref<Category[]>([])
const floorList = ref<Floor[]>([])
const isDataLoaded = ref(false)

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
      name: '限时秒杀',
      subTitle: '每日特惠 限时抢购',
      themeColor: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
      badge: 'HOT'
    }

    categoryList.value = [seckillCat, ...dbCats]

    const floors = [seckillCat, ...dbCats].map((cat, index) => ({
      ...cat,
      products: [] as ProductSimple[],
      backgroundColor: getFloorBgColor(index)
    }))

    floorList.value = floors

    await fetchProductDataForFloors()
    isDataLoaded.value = true
  } catch (error) {
    console.error('初始化数据失败:', error)
  }
}

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

      if (resData?.data?.ProductSimple) productList = resData.data.ProductSimple;
      else if (resData?.data?.productSimple) productList = resData.data.productSimple;
      else if (Array.isArray(resData?.data)) productList = resData.data;

      floor.products = productList.map((item: ApiProduct) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        imgUrl: item.image || item.imgUrl || '',
        tags: item.tag ? [item.tag] : []
      }));
    } catch (err) {
      console.error(`楼层 [${floor.name}] 商品加载失败`, err);
    }
  });
  await Promise.all(requests);
}

onMounted(() => {
  initData()
})

const goToCategory = (id: number) => {
  router.push({ path: '/products', query: { category: id } })
}

const scrollToFloor = (id: number) => {
  const element = document.getElementById(`floor-${id}`)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const getFloorBgColor = (index: number) => {
  const colors = [
    'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)',
    'linear-gradient(180deg, #fafbfc 0%, #ffffff 100%)',
  ]
  return colors[index % colors.length]
}
</script>

<template>
  <div class="home-page">
    <div class="hero-section">
      <div class="hero-container">
        <el-carousel
          trigger="click"
          :height="bannerHeight"
          :interval="5000"
          arrow="hover"
          class="hero-carousel"
        >
          <el-carousel-item v-for="(item, index) in bannerList" :key="index">
            <img :src="item.imgUrl" alt="banner" class="carousel-image" />
          </el-carousel-item>
        </el-carousel>

        <transition name="sidebar-fade" appear>
          <div class="category-sidebar" v-if="isDataLoaded">
            <div class="sidebar-header">
              <h3 class="sidebar-title">商品分类</h3>
            </div>
            <ul class="category-menu">
              <li
                v-for="cat in categoryList"
                :key="cat.id"
                class="category-item"
                @click="scrollToFloor(cat.id)"
              >
                <span class="category-name">{{ cat.name }}</span>
                <el-icon class="category-arrow"><ArrowRight /></el-icon>
              </li>
            </ul>
          </div>
        </transition>
      </div>
    </div>

    <div class="floor-section">
      <div class="floor-container">
        <div
          v-for="floor in floorList"
          :key="floor.id"
          :id="`floor-${floor.id}`"
          class="floor"
          :style="{ background: getFloorBgColor(floorList.indexOf(floor)) }"
        >
          <div class="floor-header" :style="{ background: floor.themeColor }">
            <div class="floor-header-content">
              <div class="floor-badge" v-if="'badge' in floor && floor.badge">{{ floor.badge }}</div>
              <h2 class="floor-title">{{ floor.name }}</h2>
              <p class="floor-subtitle">{{ floor.subTitle }}</p>
            </div>
            <el-button type="primary" @click="goToCategory(floor.id)" class="view-more-btn">
              查看更多 <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>

          <div class="floor-content">
            <div class="product-grid">
              <ProductCard
                v-for="product in floor.products"
                :key="product.id"
                :product="product"
                class="grid-item"
              />
            </div>
            <el-empty
              v-if="floor.products.length === 0"
              description="暂无商品"
              class="empty-state"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  width: 100%;
  background: #fff;
  padding-bottom: 60px;
}

.sidebar-fade-enter-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-fade-enter-from {
  opacity: 0;
  transform: translateY(-50%) translateX(-20px);
}

.sidebar-fade-enter-to {
  opacity: 1;
  transform: translateY(-50%) translateX(0);
}

.hero-section {
  width: 100%;
  position: relative;
  margin-bottom: 40px;
}

.hero-container {
  position: relative;
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  height: v-bind(bannerHeight);
}

.hero-carousel {
  width: 100%;
  height: 100%;
}

.carousel-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.category-sidebar {
  position: absolute;
  left: 100px;
  top: 50%;
  transform: translateY(-50%);
  width: 200px;
  background: rgba(255, 255, 255);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border-radius: 16px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08);
  overflow: visible;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 14px 18px;
  text-align: center;
}

.sidebar-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
}

.category-menu {
  list-style: none;
  padding: 8px 0;
  margin: 0;
  overflow-y: hidden;
}

.category-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
  border-radius: 12px;
  margin: 4px 12px;
  color: #333;
  font-size: 14px;
  font-weight: 700;
  background: transparent;
}

.category-item:hover {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.category-name {
  flex: 1;
}

.category-arrow {
  opacity: 0.5;
  transition: all 0.3s ease;
  font-size: 14px;
}

.category-item:hover .category-arrow {
  opacity: 1;
  transform: translateX(4px);
  color: #667eea;
}

.floor-section {
  width: 100%;
}

.floor-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.floor {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  scroll-margin-top: 80px;
}

.floor:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.floor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32px 40px;
  color: #fff;
  position: relative;
  overflow: hidden;
}

.floor-header::before {
  content: '';
  position: absolute;
  right: -60px;
  top: -60px;
  width: 240px;
  height: 240px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.floor-header::after {
  content: '';
  position: absolute;
  left: -40px;
  bottom: -40px;
  width: 180px;
  height: 180px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 50%;
}

.floor-header-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
  z-index: 2;
}

.floor-badge {
  display: inline-block;
  width: fit-content;
  padding: 4px 14px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

.floor-title {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.floor-subtitle {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
  font-weight: 400;
}

:deep(.view-more-btn) {
  background: rgba(255, 255, 255, 0.2) !important;
  border: 1px solid rgba(255, 255, 255, 0.4) !important;
  color: #fff !important;
  padding: 10px 24px !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  border-radius: 24px !important;
  transition: all 0.3s ease !important;
  position: relative;
  z-index: 2;
}

:deep(.view-more-btn:hover) {
  background: rgba(255, 255, 255, 0.35) !important;
  border-color: rgba(255, 255, 255, 0.6) !important;
  transform: translateY(-2px);
}

.floor-content {
  padding: 32px 40px;
  background: #fff;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  min-height: 320px;
}

.grid-item {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.empty-state {
  grid-column: 1 / -1;
  padding: 80px 20px;
}

:deep(.el-carousel__indicators--horizontal) {
  bottom: 20px;
}

:deep(.el-carousel__button) {
  width: 40px;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.4);
  transition: all 0.3s ease;
}

:deep(.el-carousel__button:hover) {
  background: rgba(255, 255, 255, 0.6);
}

:deep(.el-carousel__button.active) {
  background: #fff;
  width: 48px;
}

@media (max-width: 1400px) {
  .hero-container {
    max-width: 1240px;
  }

  .floor-container {
    max-width: 1240px;
  }
}

@media (max-width: 1200px) {
  .product-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  .category-sidebar {
    width: 220px;
  }
}

@media (max-width: 992px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .floor-header {
    padding: 24px 28px;
  }

  .floor-title {
    font-size: 26px;
  }

  .floor-content {
    padding: 24px 28px;
  }

  .category-sidebar {
    width: 200px;
  }

  .sidebar-title {
    font-size: 16px;
  }

  .category-item {
    padding: 14px 20px;
    font-size: 14px;
  }
}

@media (max-width: 768px) {
  .hero-container {
    height: 420px;
  }

  .category-sidebar {
    display: none;
  }

  .floor-header {
    flex-direction: column;
    align-items: flex-start;
    padding: 20px 24px;
  }

  .floor-title {
    font-size: 22px;
  }

  .floor-header :deep(.view-more-btn) {
    align-self: flex-end;
    margin-top: 12px;
  }

  .floor-content {
    padding: 20px 24px;
  }

  .floor-container {
    padding: 0 16px;
    gap: 24px;
  }
}

@media (max-width: 480px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .floor-title {
    font-size: 20px;
  }

  .floor-subtitle {
    font-size: 13px;
  }

  .floor-header {
    padding: 16px 20px;
  }

  .floor-content {
    padding: 16px 20px;
  }
}
</style>
