<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { ArrowRight } from '@element-plus/icons-vue'
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
      name: '联想秒杀',
      subTitle: '限时特惠 手慢无',
      themeColor: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)'
    }

    categoryList.value = [seckillCat, ...dbCats]

    // 初始化楼层结构
    const floors = [seckillCat, ...dbCats].map(cat => ({
      ...cat,
      products: [] as ProductSimple[]
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

    <!-- 2. 商品楼层区 -->
    <div class="floor-container">
      <div v-for="floor in floorList" :key="floor.id" :id="`floor-${floor.id}`" class="floor-section">
        <!-- 楼层左侧边栏 -->
        <div class="floor-aside" :style="{ background: floor.themeColor }" @click="goToCategory(floor.id)">
          <div class="aside-content">
            <h2 class="floor-title">{{ floor.name }}</h2>
            <p class="floor-subtitle">{{ floor.subTitle }}</p>
            <div class="view-more-btn">
              查看全部 <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
          <div class="brand-tag">LENOVO</div>
        </div>

        <!-- 楼层商品网格 -->
        <div class="floor-grid">
          <!-- 假设你已经定义并引入了 ProductCard 组件 -->
          <ProductCard
            v-for="product in floor.products"
            :key="product.id"
            :product="product"
            class="floor-product-card"
          />
          <!-- 空状态 -->
          <el-empty
            v-if="floor.products.length === 0"
            description="暂无商品"
            style="grid-column: span 4; width: 100%;"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-view { width: 100%; padding: 0; background-color: #f7f9fa; padding-bottom: 40px; }

/* --- 1. 全屏轮播容器 --- */
.banner-container {
  position: relative;
  width: 100%;
  height: v-bind(bannerHeight); /* 使用 JS 定义的高度 */
  background-color: #000;
  margin-bottom: 30px;
  overflow: hidden;
}

.full-width-carousel {
  width: 100%;
  height: 100%;
}

.banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  display: block;
}

/* --- 2. 居中内容包装层 --- */
.banner-content-wrapper {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 1240px;
  height: 100%; /* 始终与 banner-container 等高 */
  z-index: 10;
  pointer-events: none; /* 允许点击穿透到轮播图 */
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
}

.category-item:last-child { border-bottom: none; }

.category-item:hover {
  background-color: #fff;
  color: #4f46e5;
  padding-left: 40px;
  font-weight: bold;
}

.cat-name { letter-spacing: 1px; }
.arrow-icon { font-size: 14px; opacity: 0.5; transition: transform 0.3s; }
.category-item:hover .arrow-icon { transform: translateX(5px); opacity: 1; }

/* --- 3. 楼层样式 --- */
.floor-container { max-width: 1240px; margin: 0 auto; padding: 0 20px; display: flex; flex-direction: column; gap: 30px; }
.floor-section { display: flex; height: 360px; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04); scroll-margin-top: 20px; border: 1px solid #f0f0f0; }
.floor-section:hover { box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08); transform: translateY(-2px); transition: all 0.3s; }

.floor-aside { width: 240px; flex-shrink: 0; position: relative; display: flex; flex-direction: column; justify-content: center; align-items: center; color: #fff; padding: 20px; text-align: center; cursor: pointer; }

.floor-title { font-size: 26px; margin: 0 0 8px; font-weight: 800; }
.floor-subtitle { font-size: 14px; margin: 0 0 25px; opacity: 0.9; }
.view-more-btn { display: inline-flex; align-items: center; gap: 5px; padding: 6px 18px; border: 1px solid rgba(255,255,255,0.7); border-radius: 20px; font-size: 13px; }

.brand-tag { position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); font-size: 40px; font-weight: 900; color: rgba(255, 255, 255, 0.15); font-family: 'Arial Black'; }

.floor-grid { flex: 1; display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; padding: 15px; }

/* 覆盖 Element Plus 默认样式 */
:deep(.el-carousel__indicators--horizontal) { bottom: 20px; }
:deep(.el-carousel__button) { width: 30px; height: 4px; border-radius: 2px; }
</style>
