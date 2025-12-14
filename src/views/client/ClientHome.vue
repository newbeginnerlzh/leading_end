<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { ArrowRight } from '@element-plus/icons-vue' 
import type { ProductSimple } from '@/api/model/productModel'

const router = useRouter()

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
    // 🔴 修改点：颜色加深，改为 vibrant blue/cyan，解决之前太浅看不清字的问题
    themeColor: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
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

// --- 3. 获取数据 ---
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

// 4. 新增：点击跳转到分类列表页 (给楼层左侧使用)
const goToCategory = (id: number) => {
  router.push({
    path: '/products',
    query: { category: id }
  })
}

// 5. 新增：页面内平滑滚动 (给轮播图左侧菜单使用)
const scrollToFloor = (id: number) => {
  const element = document.getElementById(`floor-${id}`)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
</script>

<template>
  <div class="main-view">
    
    <!-- 1. 顶部轮播图区域 -->
    <div class="banner-wrapper">
      
      <!-- 侧边栏菜单 (悬浮) -->
      <div class="category-sidebar">
        <ul class="category-list">
          <!-- 🔴 修改点：点击触发 scrollToFloor (滚动到本页对应楼层) -->
          <li v-for="cat in categoryList" :key="cat.id" class="category-item" @click="scrollToFloor(cat.id)">
            <span class="cat-name">{{ cat.name }}</span>
            <el-icon class="arrow-icon"><ArrowRight /></el-icon>
          </li>
        </ul>
      </div>

      <!-- 轮播组件 -->
      <el-carousel trigger="click" height="500px" :interval="5000" arrow="hover" class="custom-carousel">
        <el-carousel-item v-for="(img, index) in bannerList" :key="index">
          <div class="carousel-item-content">
            <!-- 背景模糊层 -->
            <div class="blur-background" :style="{ backgroundImage: `url(${img})` }"></div>
            <!-- 主图片 -->
            <img :src="img" alt="banner" class="banner-img" />
          </div>
        </el-carousel-item>
      </el-carousel>
    </div>

    <!-- 2. 商品楼层 -->
    <div class="floor-container">
      <!-- 🔴 修改点：添加 id 属性，用于锚点定位 -->
      <div 
        v-for="floor in floorList" 
        :key="floor.id" 
        :id="`floor-${floor.id}`" 
        class="floor-section"
      >
        <!-- 🔴 修改点：楼层左侧点击跳转到商品列表页 (goToCategory) -->
        <div 
          class="floor-aside" 
          :style="{ background: floor.themeColor }"
          @click="goToCategory(floor.id)"
        >
          <div class="aside-content">
            <h2 class="floor-title">{{ floor.title }}</h2>
            <p class="floor-subtitle">{{ floor.subTitle }}</p>
            <div class="view-more-btn">
              查看全部 <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
          <!-- 🔴 修改点：已删除 bg-text (背景ID数字)，改为品牌水印 -->
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
  /* 🔴 关键：强制设置高度，保证侧边栏有明确的参考高度 */
  height: 500px; 
  border-radius: 12px; 
  overflow: hidden; 
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1); 
  display: flex;
  background-color: #000; 
}

/* 侧边栏 */
.category-sidebar {
  position: absolute; 
  top: 0;
  left: 0;
  width: 240px;
  height: 100%;
  background: rgba(40, 44, 52, 0.9); 
  backdrop-filter: blur(10px);
  z-index: 10;
  padding: 0; 
}

.category-list { 
  list-style: none; 
  padding: 0; 
  margin: 0; 
  display: flex; 
  flex-direction: column; 
  height: 100%; /* 确保填满高度 */
}

/* 
  🔴 关键修改：flex: 1 强制所有菜单项平分高度 
*/
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
  border-bottom: 1px solid rgba(255,255,255,0.05);
  box-sizing: border-box;
}

.category-item:last-child {
  border-bottom: none;
}

.category-item:hover {
  background-color: rgba(255, 255, 255, 0.15);
  border-left-color: var(--el-color-primary); 
  padding-left: 38px; /* 悬停时轻微移动 */
}

.cat-name { font-size: 16px; font-weight: 500; letter-spacing: 1px; }
.arrow-icon { font-size: 14px; opacity: 0.6; }

/* 轮播内容 */
.custom-carousel { flex: 1; width: 100%; height: 100%; }
.carousel-item-content { position: relative; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
.blur-background { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-size: cover; background-position: center; filter: blur(30px) brightness(0.6); transform: scale(1.1); z-index: 0; }
.banner-img { position: relative; z-index: 1; height: 100%; width: 100%; max-width: 1920px; object-fit: contain; transition: transform 0.5s ease; }
.carousel-item-content:hover .banner-img { transform: scale(1.02); }
:deep(.el-carousel__indicators--horizontal) { bottom: 20px; left: 60%; }
:deep(.el-carousel__indicator--horizontal .el-carousel__button) { width: 30px; height: 4px; border-radius: 2px; background-color: rgba(255, 255, 255, 0.4); }
:deep(.el-carousel__indicator--horizontal.is-active .el-carousel__button) { width: 40px; background-color: #fff; }

/* --- 楼层样式 --- */
.floor-container { max-width: 1240px; margin: 0 auto; padding: 0 20px; display: flex; flex-direction: column; gap: 30px; }

/* 🔴 关键修改：增加 scroll-margin-top 防止楼层被吸顶 Header 遮挡 */
.floor-section { 
  display: flex; 
  height: 360px; 
  background: #fff; 
  border-radius: 12px; 
  overflow: hidden; 
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03); 
  transition: transform 0.3s; 
  scroll-margin-top: 80px; 
}

.floor-section:hover { box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); }

/* 🔴 关键修改：楼层左侧样式增加 cursor: pointer */
.floor-aside { 
  width: 240px; 
  flex-shrink: 0; 
  position: relative; 
  display: flex; 
  flex-direction: column; 
  justify-content: center; 
  align-items: center; 
  color: #fff; 
  padding: 20px; 
  text-align: center; 
  overflow: hidden; 
  cursor: pointer; /* 鼠标手型 */
  transition: opacity 0.3s;
}
.floor-aside:hover { opacity: 0.95; }

.aside-content { position: relative; z-index: 2; }
.floor-title { font-size: 28px; margin: 0 0 10px; font-weight: 800; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
.floor-subtitle { font-size: 16px; margin: 0 0 25px; opacity: 0.9; }
.view-more-btn { display: inline-flex; align-items: center; gap: 5px; padding: 8px 20px; border: 1px solid rgba(255,255,255,0.6); border-radius: 20px; cursor: pointer; font-size: 14px; transition: all 0.3s; }
.view-more-btn:hover { background: #fff; color: #333; }

/* 品牌水印 */
.brand-tag { position: absolute; bottom: -15px; left: 50%; transform: translateX(-50%); font-size: 48px; font-weight: 900; color: rgba(255, 255, 255, 0.15); letter-spacing: 2px; font-family: 'Arial Black', sans-serif; pointer-events: none; z-index: 1; }

.floor-grid { flex: 1; display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; padding: 15px; background-color: #fff; }
.floor-product-card { height: 100%; box-shadow: none !important; border: 1px solid #f0f0f0; }
.floor-product-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important; transform: translateY(-3px); border-color: transparent; z-index: 2; }
</style>