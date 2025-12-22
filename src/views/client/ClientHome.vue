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

// --- 3. 获取商品数据 ---
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

onMounted(() => { initData() })

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
    
    <!-- 
      1. 全屏通栏轮播区 
      banner-container 宽度 100%，高度固定，图片 cover 铺满
    -->
    <div class="banner-container">
      
      <!-- 底层：轮播图 (占满全屏) -->
      <el-carousel trigger="click" height="480px" :interval="5000" arrow="hover" class="full-width-carousel">
        <el-carousel-item v-for="(item, index) in bannerList" :key="index">
          <!-- 
            object-fit: cover -> 保证图片铺满全屏，多余部分裁切，不留白
            object-position: center top -> 保证图片顶部（通常是人脸）不被裁切
           -->
          <img :src="item.imgUrl" alt="banner" class="banner-img" />
        </el-carousel-item>
      </el-carousel>

      <!-- 
        顶层：居中内容限制层 
        宽度限制为 1240px，绝对定位覆盖在轮播图上方，用于定位菜单
      -->
      <div class="banner-content-wrapper">
        <div class="category-sidebar">
          <ul class="category-list">
            <li v-for="cat in categoryList" :key="cat.id" class="category-item" @click="scrollToFloor(cat.id)">
              <span class="cat-name">{{ cat.name }}</span>
              <el-icon class="arrow-icon"><ArrowRight /></el-icon>
            </li>
          </ul>
        </div>
      </div>

    </div>

    <!-- 2. 商品楼层 (宽度也是 1240px，与上方菜单左对齐) -->
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

/* --- 1. 全屏轮播容器 --- */
.banner-container {
  position: relative;
  width: 100%; /* 关键：占满浏览器宽度 */
  height: 480px; /* 固定高度，根据图片比例调整 */
  background-color: #000;
  margin-bottom: 30px;
}

.full-width-carousel {
  width: 100%;
  height: 100%;
}

.banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover; /* 铺满不留白 */
  object-position: center top; /* 重点显示中上方内容 */
  display: block;
}

/* --- 2. 居中限制层 (为了定位菜单) --- */
.banner-content-wrapper {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%); /* 绝对居中 */
  width: 100%;
  max-width: 1240px; /* 限制宽度，与下方楼层对齐 */
  height: 100%;
  z-index: 10;
  pointer-events: none; /* 让点击穿透空白区域，否则点不到轮播图 */
}

/* --- 侧边栏菜单 --- */
.category-sidebar {
  width: 240px;
  height: 100%;
  /* 模仿截图的透明白色背景 */
  background: rgba(255, 255, 255, 0.85); 
  backdrop-filter: blur(10px);
  pointer-events: auto; /* 恢复菜单点击 */
  padding: 15px 0;
}

.category-list { 
  list-style: none; 
  padding: 0; 
  margin: 0; 
  display: flex; 
  flex-direction: column; 
  height: 100%; 
}

.category-item { 
  flex: 1; /* 平分高度 */
  display: flex; 
  align-items: center; 
  justify-content: space-between; 
  padding: 0 30px; 
  cursor: pointer; 
  transition: all 0.2s;
  color: #333; 
  font-size: 15px;
  font-weight: 500;
}

.category-item:hover { 
  background-color: #fff;
  color: var(--el-color-primary); 
  padding-left: 38px; 
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05); /* 悬停时加点阴影 */
}

.cat-name { letter-spacing: 1px; }
.arrow-icon { font-size: 14px; opacity: 0.5; }

/* 轮播指示器 (居中显示) */
:deep(.el-carousel__indicators--horizontal) { bottom: 20px; left: 50%; transform: translateX(-50%); }
:deep(.el-carousel__indicator--horizontal .el-carousel__button) { width: 10px; height: 10px; border-radius: 50%; background-color: rgba(0, 0, 0, 0.2); }
:deep(.el-carousel__indicator--horizontal.is-active .el-carousel__button) { background-color: var(--el-color-primary); width: 25px; border-radius: 5px; opacity: 1;}

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