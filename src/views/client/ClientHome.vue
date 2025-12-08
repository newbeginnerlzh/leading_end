<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { ProductSimple } from '@/api/model/productModel'

// 轮播图数据
const bannerList = [
  'https://p3.lefile.cn/fes/cms/2025/11/26/q9wa3g5jnkik6rl6gxjykhc0xvphbd164310.jpg',
  'https://p1.lefile.cn/fes/cms/2025/11/25/whw61hnappz3x3k2n9rqbq8giucyd9076100.jpg',
  'https://p4.lefile.cn/fes/cms/2025/12/04/pqvp2a8gia2eu549qaljn49e9hn0pt791216.jpg'
]

const searchText = ref('')
const products = ref<ProductSimple[]>([])

// 模拟数据
const fetchProducts = () => {
  const mockData: ProductSimple[] = [
    {
      id: 1001,
      name: '联想拯救者 Y9000P 2025款 (i9-14900HX 32G 1T RTX4060)',
      price: 9999,
      imgUrl: 'https://p4.lefile.cn/fes/cms/2025/12/04/pqvp2a8gia2eu549qaljn49e9hn0pt791216.jpg',
      tags: ['热销', '新品']
    },
    {
      id: 1002,
      name: 'ThinkPad X1 Carbon Gen12 商务旗舰',
      price: 14999,
      imgUrl: 'https://p1.lefile.cn/fes/cms/2025/11/25/whw61hnappz3x3k2n9rqbq8giucyd9076100.jpg',
      tags: ['商务办公']
    },
    {
      id: 1003,
      name: 'MacBook Pro 14 (M3 Pro)',
      price: 12999,
      imgUrl: 'https://img14.360buyimg.com/n0/jfs/t1/227546/15/8026/49257/655b1eb2F671c6999/874b2164d50c1844.jpg',
      tags: ['Apple']
    },
    {
      id: 1004,
      name: '联想小新Pro16 2024 AI超能本',
      price: 5999,
      imgUrl: 'https://img14.360buyimg.com/n0/jfs/t1/231580/40/15720/57134/65d6c29bF99839446/745a308c1488c946.jpg',
      tags: ['高性价比']
    }
  ]
  products.value = mockData
}

onMounted(() => {
  fetchProducts()
})

const handleSearch = () => {
  console.log('搜索:', searchText.value)
}
</script>

<template>
  <!-- 外层容器：不需要 padding-top，因为 Header 是 sticky 的，会自动把内容挤下来 -->
  <div class="main-view">
    
    <!-- 1. 全宽轮播图区域 -->
    <div class="banner-container">
      <!-- 
        height: 设置为 550px 或 600px，确保大屏下视觉效果好
        arrow="hover": 鼠标悬停显示箭头
      -->
      <el-carousel trigger="click" height="550px" :interval="5000" arrow="hover">
        <el-carousel-item v-for="(img, index) in bannerList" :key="index">
          <img :src="img" alt="banner" class="banner-img" />
        </el-carousel-item>
      </el-carousel>
    </div>

    <!-- 2. 内容主体 -->
    <div class="content-body">
      <h1 class="section-title">💻 热门电脑推荐</h1>

      <!-- 首页辅助搜索框 -->
      <div class="search-box-home">
        <el-input
          v-model="searchText"
          placeholder="在此搜索更多商品..."
          size="large"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button @click="handleSearch">搜索</el-button>
          </template>
        </el-input>
      </div>

      <!-- 商品列表 -->
      <el-row :gutter="20">
        <el-col
          v-for="item in products"
          :key="item.id"
          :xs="24" :sm="12" :md="8" :lg="6"
          class="mb-20"
        >
          <ProductCard :product="item" />
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<style scoped>
/* 
  核心修改：
  1. 移除了 padding-top: 64px; 
  2. 因为您的 Header 是 sticky，它在文档流中占位，所以这里不需要留空，
     轮播图会自动接在 Header 下面。
*/
.main-view {
  width: 100%;
  padding: 0;
}

/* --- 轮播图样式 --- */
.banner-container {
  width: 100%;
  /* 防止图片溢出导致出现滚动条 */
  overflow: hidden; 
}

.banner-img {
  width: 100%;
  height: 100%;
  /* 
    object-fit: cover 
    保证图片铺满容器，不会变形，但可能会裁掉边缘。
    这是全屏轮播图最标准的做法。
  */
  object-fit: cover; 
  /* 
    object-position: center top
    优先展示图片的中心偏上部分（通常是产品主体所在位置）
  */
  object-position: center top; 
  display: block;
}

/* --- 下方圆点样式 (覆盖 Element Plus 默认样式) --- */
:deep(.el-carousel__indicators--horizontal) {
  bottom: 20px; 
}

:deep(.el-carousel__indicator--horizontal .el-carousel__button) {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.5);
  transition: all 0.3s;
}

:deep(.el-carousel__indicator--horizontal.is-active .el-carousel__button) {
  width: 20px; /* 选中变成长胶囊 */
  height: 10px;
  border-radius: 5px;
  background-color: #ffffff;
  opacity: 1;
}

/* --- 页面主体内容样式 --- */
.content-body {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.section-title {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-weight: 700;
}

.search-box-home {
  max-width: 600px;
  margin: 0 auto 40px;
}

.mb-20 {
  margin-bottom: 20px;
}
</style>