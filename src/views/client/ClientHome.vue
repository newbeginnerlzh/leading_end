<script setup lang="ts">
// 显式引入，解决 TS 报错
import { ref, onMounted } from 'vue'
import type { ProductSimple } from '@/api/model/productModel'

// 注意：由于您配置了 unplugin-vue-components
// ProductCard 组件会自动引入，不需要 import ProductCard from ...

const searchText = ref('')
const products = ref<ProductSimple[]>([])

// 模拟获取数据
const fetchProducts = () => {
  const mockData: ProductSimple[] = [
    {
      id: 1001,
      name: '联想拯救者 Y9000P 2025款 16英寸游戏笔记本电脑 (i9-14900HX 32G 1T RTX4060)',
      price: 9999,
      imgUrl: 'https://img14.360buyimg.com/n0/jfs/t1/236166/39/12739/57454/65ed6b72F85f750c8/3a6e3d2943260c6d.jpg',
      tags: ['热销', '新品', 'RTX4060']
    },
    {
      id: 1002,
      name: 'ThinkPad X1 Carbon Gen12 商务旗舰轻薄本',
      price: 14999,
      imgUrl: 'https://img14.360buyimg.com/n0/jfs/t1/231145/26/18659/66205/65c34707F47f9676e/a75d554a9900889f.jpg',
      tags: ['商务办公', '超轻薄']
    },
    {
      id: 1003,
      name: 'MacBook Pro 14英寸 M3芯片 (8G+512G 深空灰)',
      price: 12999,
      imgUrl: 'https://img14.360buyimg.com/n0/jfs/t1/227546/15/8026/49257/655b1eb2F671c6999/874b2164d50c1844.jpg',
      tags: ['Apple', 'M3']
    },
    {
      id: 1004,
      name: '联想小新Pro16 2024 AI超能本 (R7-8845H 32G 1T)',
      price: 5999,
      imgUrl: 'https://img14.360buyimg.com/n0/jfs/t1/231580/40/15720/57134/65d6c29bF99839446/745a308c1488c946.jpg',
      tags: ['高性价比', '学生推荐']
    }
  ]
  products.value = mockData
}

onMounted(() => {
  fetchProducts()
})

const handleSearch = () => {
  console.log('搜索内容:', searchText.value)
}
</script>

<template>
  <div class="home-page">
    <h1 class="title">💻 热门电脑推荐</h1>

    <!-- 搜索框 -->
    <div class="search-box">
      <el-input
        v-model="searchText"
        placeholder="搜索商品..."
        class="search-input"
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
      <!-- 循环渲染 ProductCard 组件 -->
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
</template>

<style scoped>
.home-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.title {
  text-align: center;
  margin-bottom: 30px;
  color: #303133;
}

.search-box {
  max-width: 600px;
  margin: 0 auto 40px;
}

.mb-20 {
  margin-bottom: 20px;
}
</style>