<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { ArrowRight } from '@element-plus/icons-vue' 
import type { ProductSimple } from '@/api/model/productModel'
// 引入 Mock 接口
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
    
    <!-- 顶部轮播图区域 -->
    <div class="banner-wrapper">
      
      <!-- 侧边栏菜单 -->
      <div class="category-sidebar">
        <ul class="category-list">
          <li v-for="cat in categoryList" :key="cat.id" class="category-item" @click="scrollToFloor(cat.id)">
            <span class="cat-name">{{ cat.name }}</span>
            <el-icon class="arrow-icon"><ArrowRight /></el-icon>
          </li>
        </ul>
      </div>

      <!-- 轮播组件 -->
      <el-carousel trigger="click" height="500px" :interval="5000" arrow="hover" class="custom-carousel">
        <el-carousel-item v-for="(item, index) in bannerList" :key="index">
          <div class="carousel-item-content">
            <img :src="item.imgUrl" alt="banner" class="banner-img" />
          </div>
        </el-carousel-item>
      </el-carousel>
    </div>

    <!-- 商品楼层 -->
    <div class="floor-container">
      <div 
        v-for="floor in floorList" 
        :key="floor.id" 
        :id="`floor-${floor.id}`" 
        class="floor-section"
      >
        <div 
          class="floor-aside" 
          :style="{ background: floor.themeColor }"
          @click="goToCategory(floor.id)"
        >
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
          <ProductCard 
            v-for="product in floor.products" 
            :key="product.id" 
            :product="product" 
            class="floor-product-card"
          />
          <el-empty v-if="floor.products.length === 0" description="暂无商品" style="grid-column: span 4; width: 100%;" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-view { width: 100%; padding: 0; background-color: #f4f4f4; padding-bottom: 40px; }

/* --- 轮播图区域 --- */
.banner-wrapper {
  position: relative;
  max-width: 1240px; 
  margin: 20px auto; 
  height: 500px; 
  border-radius: 12px; 
  overflow: hidden; 
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1); 
  display: flex;
  background-color: #000; 
}

/* 侧边栏 (透明白色风格 + 右移) */
.category-sidebar {
  position: absolute; 
  top: 20px; 
  bottom: 20px; 
  height: auto; 
  
  /* 🔴 关键修改 1：设置左边距为 60px，刚好让出轮播图左侧箭头的位置 */
  /* 如果觉得还不够，可以改为 80px 或 100px */
  left: 60px; 
  
  width: 240px;
  
  /* 🔴 关键修改 2：透明白色背景 (0.4) + 模糊 */
  background: rgba(255, 255, 255, 0.4); 
  backdrop-filter: blur(20px); 
  
  z-index: 10;
  padding: 0; 
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1); 
}

.category-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; height: 100%; }

.category-item { 
  flex: 1; 
  display: flex; 
  align-items: center; 
  justify-content: space-between; 
  padding: 0 30px; 
  cursor: pointer; 
  transition: all 0.3s;
  
  /* 🔴 关键修改 3：黑色字体 */
  color: #333; 
  
  border-left: 4px solid transparent; 
  border-bottom: 1px solid rgba(0,0,0,0.05); /* 浅色分割线 */
  box-sizing: border-box;
}
.category-item:last-child { border-bottom: none; }

.category-item:hover { 
  /* 悬停时背景稍微变白，增加对比 */
  background-color: rgba(255, 255, 255, 0.8); 
  border-left-color: var(--el-color-primary); 
  padding-left: 38px; 
  color: var(--el-color-primary); 
}

.cat-name { font-size: 16px; font-weight: 600; letter-spacing: 1px; }
.arrow-icon { font-size: 14px; opacity: 0.6; }

/* 轮播内容 */
.custom-carousel { flex: 1; width: 100%; height: 100%; }
.carousel-item-content { position: relative; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
.banner-img { position: relative; z-index: 1; height: 100%; width: 100%; max-width: 1920px; object-fit: cover; transition: transform 0.5s ease; }
.carousel-item-content:hover .banner-img { transform: scale(1.02); }

/* 指示器 */
:deep(.el-carousel__indicators--horizontal) { bottom: 20px; left: 60%; }
:deep(.el-carousel__indicator--horizontal .el-carousel__button) { width: 30px; height: 4px; border-radius: 2px; background-color: rgba(255, 255, 255, 0.4); }
:deep(.el-carousel__indicator--horizontal.is-active .el-carousel__button) { width: 40px; background-color: #fff; }

/* --- 楼层样式 --- */
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