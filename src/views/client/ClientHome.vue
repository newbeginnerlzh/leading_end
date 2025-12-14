<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { ArrowRight } from '@element-plus/icons-vue' 
import type { ProductSimple } from '@/api/model/productModel'

// --- 1. 顶部轮播图 (纯图片模式) ---
const bannerList = [
  'https://p3.lefile.cn/fes/cms/2025/11/26/q9wa3g5jnkik6rl6gxjykhc0xvphbd164310.jpg',
  'https://p1.lefile.cn/fes/cms/2025/11/25/whw61hnappz3x3k2n9rqbq8giucyd9076100.jpg',
  'https://p4.lefile.cn/fes/cms/2025/12/04/pqvp2a8gia2eu549qaljn49e9hn0pt791216.jpg'
]

// 侧边栏菜单 (ID 与数据库保持一致)
const categoryList = [
  { id: 1, name: '联想秒杀' },
  { id: 29, name: 'ThinkPad系列' },
  { id: 27, name: 'YOGA系列' },
  { id: 25, name: '拯救者系列' },
  { id: 26, name: '小新系列' },
  { id: 28, name: 'ThinkBook系列' }
]

// --- 2. 楼层定义 ---
interface FloorSection {
  id: number 
  title: string
  subTitle: string
  themeColor: string 
  products: ProductSimple[]
}

const floorList = ref<FloorSection[]>([
  {
    id: 1, 
    title: '联想秒杀',
    subTitle: '限时特惠 手慢无',
    themeColor: 'linear-gradient(135deg, #ff4e50 0%, #f9d423 100%)',
    products: []
  },
  {
    id: 29, 
    title: 'ThinkPad系列',
    subTitle: '思考 进化',
    themeColor: 'linear-gradient(135deg, #000000 0%, #434343 100%)',
    products: []
  },
  {
    id: 27, 
    title: 'YOGA系列',
    subTitle: '品质 匠心',
    themeColor: 'linear-gradient(135deg, #cc95c0 0%, #dbd4b4 100%)',
    products: []
  },
  {
    id: 25, 
    title: '拯救者系列',
    subTitle: '为战而生',
    themeColor: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    products: []
  },
  {
    id: 26, 
    title: '小新系列',
    subTitle: '年轻 就要出色',
    themeColor: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    products: []
  },
  {
    id: 28, 
    title: 'ThinkBook系列',
    subTitle: '新青年 创造力',
    themeColor: 'linear-gradient(135deg, #bdc2e8 0%, #e6dee9 100%)',
    products: []
  }
])

// --- 3. 获取数据 (保持之前的正确逻辑) ---
const fetchHomeData = async () => {
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
      let productList: any[] = [];

      if (resData?.data?.ProductSimple) productList = resData.data.ProductSimple;
      else if (resData?.data?.productSimple) productList = resData.data.productSimple;

      floor.products = productList.map((item: any) => {
        return {
          id: item.id,
          name: item.name,
          price: Number(item.price),
          imgUrl: item.image || '', 
          tags: item.tag ? [item.tag] : [] 
        }
      });
    } catch (err) {
      console.error(`❌ 楼层 [${floor.title}] 请求失败:`, err);
    }
  })
  await Promise.all(requests);
}

onMounted(() => {
  fetchHomeData()
})

const handleCategoryClick = (name: string) => {
  console.log('点击分类:', name)
}
</script>

<template>
  <div class="main-view">
    
    <!-- 1. 顶部轮播图区域 -->
    <div class="banner-wrapper">
      
      <!-- 侧边栏菜单 (悬浮) -->
      <div class="category-sidebar">
        <ul class="category-list">
          <li v-for="cat in categoryList" :key="cat.id" class="category-item" @click="handleCategoryClick(cat.name)">
            <span class="cat-name">{{ cat.name }}</span>
            <el-icon class="arrow-icon"><ArrowRight /></el-icon>
          </li>
        </ul>
      </div>

      <!-- 轮播组件 -->
      <el-carousel trigger="click" height="500px" :interval="5000" arrow="hover" class="custom-carousel">
        <el-carousel-item v-for="(img, index) in bannerList" :key="index">
          <div class="carousel-item-content">
            <!-- 背景模糊层 (解决宽屏留白) -->
            <div class="blur-background" :style="{ backgroundImage: `url(${img})` }"></div>
            <!-- 主图片 (完整显示) -->
            <img :src="img" alt="banner" class="banner-img" />
          </div>
        </el-carousel-item>
      </el-carousel>
    </div>

    <!-- 2. 商品楼层 -->
    <div class="floor-container">
      <div v-for="floor in floorList" :key="floor.id" class="floor-section">
        <div class="floor-aside" :style="{ background: floor.themeColor }">
          <div class="aside-content">
            <h2 class="floor-title">{{ floor.title }}</h2>
            <p class="floor-subtitle">{{ floor.subTitle }}</p>
            <div class="view-more-btn">
              查看全部 <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
          <div class="bg-text">{{ floor.id }}</div>
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

/* --- 轮播图区域 (保持圆角和阴影，但去掉了文字) --- */
.banner-wrapper {
  position: relative;
  max-width: 1240px; 
  margin: 20px auto; 
  border-radius: 12px; 
  overflow: hidden; 
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1); 
  display: flex;
  background-color: #000; /* 防止图片加载前闪白 */
}

/* 侧边栏 */
.category-sidebar {
  position: absolute; 
  top: 0;
  left: 0;
  width: 240px;
  height: 100%;
  background: rgba(40, 44, 52, 0.85); /* 深色半透明 */
  backdrop-filter: blur(10px);
  z-index: 10;
  padding-top: 10px;
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
  color: #fff; 
  border-left: 4px solid transparent; 
}

.category-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-left-color: var(--el-color-primary); 
  padding-left: 35px; 
}

.cat-name { font-size: 15px; font-weight: 500; letter-spacing: 1px; }
.arrow-icon { font-size: 14px; opacity: 0.6; }

/* 轮播内容 */
.custom-carousel {
  flex: 1; 
  width: 100%;
}

.carousel-item-content {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 高斯模糊背景 */
.blur-background {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background-size: cover;
  background-position: center;
  filter: blur(30px) brightness(0.6); /* 模糊并压暗背景 */
  transform: scale(1.1); /* 放大防止白边 */
  z-index: 0;
}

/* 前景图片 */
.banner-img {
  position: relative;
  z-index: 1;
  height: 100%;
  width: 100%;
  max-width: 1920px;
  object-fit: contain; /* 保证图片完整显示 */
  transition: transform 0.5s ease;
}

/* 简单的悬停效果 */
.carousel-item-content:hover .banner-img {
  transform: scale(1.02);
}

/* 覆盖 Element 指示器 */
:deep(.el-carousel__indicators--horizontal) { bottom: 20px; left: 60%; }
:deep(.el-carousel__indicator--horizontal .el-carousel__button) { width: 30px; height: 4px; border-radius: 2px; background-color: rgba(255, 255, 255, 0.4); }
:deep(.el-carousel__indicator--horizontal.is-active .el-carousel__button) { width: 40px; background-color: #fff; }

/* --- 楼层样式 (保持不变) --- */
.floor-container { max-width: 1240px; margin: 0 auto; padding: 0 20px; display: flex; flex-direction: column; gap: 30px; }
.floor-section { display: flex; height: 360px; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03); transition: transform 0.3s; }
.floor-section:hover { box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); }
.floor-aside { width: 240px; flex-shrink: 0; position: relative; display: flex; flex-direction: column; justify-content: center; align-items: center; color: #fff; padding: 20px; text-align: center; }
.aside-content { position: relative; z-index: 2; }
.floor-title { font-size: 28px; margin: 0 0 10px; font-weight: 800; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
.floor-subtitle { font-size: 16px; margin: 0 0 25px; opacity: 0.9; }
.view-more-btn { display: inline-flex; align-items: center; gap: 5px; padding: 8px 20px; border: 1px solid rgba(255,255,255,0.6); border-radius: 20px; cursor: pointer; font-size: 14px; transition: all 0.3s; }
.view-more-btn:hover { background: #fff; color: #333; }
.bg-text { position: absolute; bottom: -20px; right: -20px; font-size: 80px; font-weight: 900; color: rgba(255,255,255,0.1); text-transform: uppercase; z-index: 1; pointer-events: none; }
.floor-grid { flex: 1; display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; padding: 15px; background-color: #fff; }
.floor-product-card { height: 100%; box-shadow: none !important; border: 1px solid #f0f0f0; }
.floor-product-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important; transform: translateY(-3px); border-color: transparent; z-index: 2; }
</style>