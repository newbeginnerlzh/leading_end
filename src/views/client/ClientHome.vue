<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { ArrowRight } from '@element-plus/icons-vue' 
import type { ProductSimple } from '@/api/model/productModel'
import { getHomeBanners, getHomeCategories } from '@/api/home'

interface ApiProduct {
  id: number
  name: string
  price: string | number
  image?: string
  imgUrl?: string
  tag?: string
}

const router = useRouter()

// --- 1. 数据定义 ---
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
      themeColor: 'linear-gradient(135deg, #ff4e50 0%, #f9d423 100%)'
    }

    categoryList.value = [seckillCat, ...dbCats]

    const floors = [seckillCat, ...dbCats].map(cat => ({
      ...cat,
      products: [] as ProductSimple[]
    }))
    
    floorList.value = floors

    await fetchProductDataForFloors()

  } catch (error) {
    console.error('初始化数据失败:', error)
  }
}

// --- 3. 获取真实商品数据 ---
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

      floor.products = productList.map((item: ApiProduct) => {
        return {
          id: item.id,
          name: item.name,
          price: Number(item.price),
          imgUrl: item.image || item.imgUrl || '', 
          tags: item.tag ? [item.tag] : [] 
        }
      });
    } catch (err) {
      console.error(`❌ 楼层 [${floor.name}] 商品加载失败`, err);
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
</script>

<template>
  <div class="main-view">
    
    <!-- 1. 顶部区域：盒式布局 -->
    <div class="banner-box">
      
      <!-- 左侧：固定菜单栏 -->
      <div class="category-sidebar">
        <div class="sidebar-header">全部分类</div>
        <ul class="category-list">
          <li v-for="cat in categoryList" :key="cat.id" class="category-item" @click="scrollToFloor(cat.id)">
            <span class="cat-name">{{ cat.name }}</span>
            <el-icon class="arrow-icon"><ArrowRight /></el-icon>
          </li>
        </ul>
      </div>

      <!-- 右侧：轮播图区域 -->
      <div class="carousel-area">
        <el-carousel trigger="click" height="480px" :interval="5000" arrow="hover">
          <el-carousel-item v-for="(item, index) in bannerList" :key="index">
            <!-- 使用 fill 强制填满，或者 cover -->
            <img :src="item.imgUrl" alt="banner" class="banner-img" />
          </el-carousel-item>
        </el-carousel>
      </div>

    </div>

    <!-- 2. 商品楼层 -->
    <div class="floor-container">
      <div v-for="floor in floorList" :key="floor.id" :id="`floor-${floor.id}`" class="floor-section">
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
        <div class="floor-grid">
          <ProductCard v-for="product in floor.products" :key="product.id" :product="product" class="floor-product-card" />
          <el-empty v-if="floor.products.length === 0" description="暂无商品" style="grid-column: span 4; width: 100%;" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-view { width: 100%; padding: 0; background-color: #f4f4f4; padding-bottom: 40px; }

/* --- 顶部盒式容器 --- */
.banner-box {
  width: 1240px; /* 固定宽度 */
  height: 480px;
  margin: 20px auto; /* 居中 */
  display: flex; /* 左右布局 */
  
  /* 🔴 核心美化：边框、圆角、阴影 */
  background-color: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  overflow: hidden; /* 保证子元素不溢出圆角 */
}

/* 1. 左侧菜单 */
.category-sidebar {
  width: 240px;
  height: 100%;
  background-color: #fff; /* 纯白背景 */
  border-right: 1px solid #f0f0f0; /* 右侧分割线 */
  display: flex;
  flex-direction: column;
  z-index: 2;
}

.sidebar-header {
  height: 50px;
  line-height: 50px;
  padding-left: 24px;
  font-size: 16px;
  font-weight: bold;
  color: #333;
  border-bottom: 1px solid #f5f5f5;
  background-color: #fafafa;
}

.category-list { 
  flex: 1;
  list-style: none; 
  padding: 0; 
  margin: 0; 
  display: flex; 
  flex-direction: column; 
}

.category-item { 
  flex: 1; /* 平分高度 */
  display: flex; 
  align-items: center; 
  justify-content: space-between; 
  padding: 0 24px; 
  cursor: pointer; 
  transition: all 0.2s;
  color: #555; 
  border-left: 3px solid transparent; 
}

.category-item:hover { 
  background-color: #f2f7fd; /* 浅蓝悬停色 */
  color: var(--el-color-primary); 
  border-left-color: var(--el-color-primary); /* 左侧亮条 */
  padding-left: 28px; /* 轻微位移 */
}

.cat-name { font-size: 15px; font-weight: 500; }
.arrow-icon { font-size: 14px; color: #ccc; }
.category-item:hover .arrow-icon { color: var(--el-color-primary); }

/* 2. 右侧轮播图 */
.carousel-area {
  flex: 1; /* 占满剩余空间 */
  height: 100%;
  background-color: #f9f9f9;
}

.banner-img { 
  width: 100%; 
  height: 100%; 
  /* 
    object-fit: fill; -> 强制拉伸填满，适合尺寸不一但需要对齐的情况
    object-fit: cover; -> 裁剪填满
  */
  object-fit: fill; 
  display: block;
}

/* 轮播指示器 */
:deep(.el-carousel__indicators--horizontal) { bottom: 15px; left: 50%; transform: translateX(-50%); }
:deep(.el-carousel__indicator--horizontal .el-carousel__button) { width: 8px; height: 8px; border-radius: 50%; background-color: rgba(255,255,255,0.6); margin: 0 4px; }
:deep(.el-carousel__indicator--horizontal.is-active .el-carousel__button) { background-color: #fff; width: 20px; border-radius: 4px; }

/* --- 楼层样式 (保持不变) --- */
.floor-container { max-width: 1240px; margin: 0 auto; padding: 0 20px; display: flex; flex-direction: column; gap: 30px; }
.floor-section { display: flex; height: 360px; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03); transition: transform 0.3s; scroll-margin-top: 80px; }
.floor-section:hover { box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); }
.floor-aside { width: 240px; flex-shrink: 0; position: relative; display: flex; flex-direction: column; justify-content: center; align-items: center; color: #fff; padding: 20px; text-align: center; overflow: hidden; cursor: pointer; transition: opacity 0.3s; }
.floor-aside:hover { opacity: 0.95; }
.aside-content { position: relative; z-index: 2; }
.floor-title { font-size: 28px; margin: 0 0 10px; font-weight: 800; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
.floor-subtitle { font-size: 16px; margin: 0 0 25px; opacity: 0.9; }
.view-more-btn { display: inline-flex; align-items: center; gap: 5px; padding: 8px 20px; border: 1px solid rgba(255,255,255,0.6); border-radius: 20px; cursor: pointer; font-size: 14px; transition: all 0.3s; }
.view-more-btn:hover { background: #fff; color: #333; }
.brand-tag { position: absolute; bottom: -15px; left: 50%; transform: translateX(-50%); font-size: 48px; font-weight: 900; color: rgba(255, 255, 255, 0.15); letter-spacing: 2px; font-family: 'Arial Black', sans-serif; pointer-events: none; z-index: 1; }
.floor-grid { flex: 1; display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; padding: 15px; background-color: #fff; }
.floor-product-card { height: 100%; box-shadow: none !important; border: 1px solid #f0f0f0; }
.floor-product-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important; transform: translateY(-3px); border-color: transparent; z-index: 2; }
</style>