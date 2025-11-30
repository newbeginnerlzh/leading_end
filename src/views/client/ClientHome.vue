<template>
  <div class="home-page">
    <!-- 1. 顶部标题 -->
    <h1 class="title">💻 热门电脑推荐</h1>

    <!-- 2. 搜索框区域 (使用 Element Plus) -->
    <div class="search-box">
      <el-input
        v-model="searchText"
        placeholder="搜索 ThinkPad / 拯救者..."
        class="search-input"
        clearable
        @keyup.enter="handleSearch"
      >
        <template #append>
          <el-button @click="handleSearch">搜索</el-button>
        </template>
      </el-input>
    </div>

    <!-- 3. 商品列表区域 (使用 El-Card 和 Grid 布局) -->
    <!-- :gutter="20" 代表卡片之间的间距 -->
    <el-row :gutter="20">
      <!-- :span="6" 代表占24份中的6份，即一行放4个 (24/6=4) -->
      <!-- xs/sm/md/lg 是响应式配置，不同屏幕显示不同数量 -->
      <el-col
        v-for="item in products"
        :key="item.id"
        :xs="24"
        :sm="12"
        :md="8"
        :lg="6"
        class="mb-20"
      >
        <el-card shadow="hover" class="product-card" @click="goToDetail(item.id)">
          <!-- 图片区域 -->
          <el-image :src="item.image" fit="cover" class="product-img">
            <template #error>
              <div class="image-slot">暂无图片</div>
            </template>
          </el-image>

          <!-- 信息区域 -->
          <div class="card-body">
            <h3 class="product-name">{{ item.name }}</h3>
            <div class="specs-tag">
              <el-tag size="small" effect="plain">{{ item.cpu }}</el-tag>
              <el-tag size="small" effect="plain" type="success" style="margin-left: 5px">{{
                item.ram
              }}</el-tag>
            </div>
            <div class="price-row">
              <span class="price">¥ {{ item.price }}</span>
              <span class="sales">销量: 99+</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<!-- 注意这里多了 lang="ts" -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

// --- TS 核心差异点 1: 定义数据的“形状” (Interface) ---
// 这相当于给商品数据制定了一个“身份证规范”，不符合这个规范的数据会报错
interface Product {
  id: number
  name: string
  price: number
  cpu: string
  ram: string
  image: string
}

const router = useRouter()

// --- TS 核心差异点 2: 为变量指定类型 ---
const searchText = ref<string>('') // 明确告诉 TS，这个 ref 存的是 string
const products = ref<Product[]>([]) // 明确告诉 TS，这是一个由 Product 组成的数组

// 模拟获取数据
const fetchProducts = () => {
  // 模拟后端数据
  const mockData: Product[] = [
    {
      id: 101,
      name: '联想拯救者 Y9000P',
      price: 9999,
      cpu: 'i9-13900HX',
      ram: '32G',
      image: 'https://images.indianexpress.com/2025/08/Google-AI-Studio-Tutorial.jpg', // 找了个网图测试
    },
    {
      id: 102,
      name: 'ThinkPad X1 Carbon',
      price: 12999,
      cpu: 'i7-1360P',
      ram: '16G',
      image: '', // 测试无图片情况
    },
    {
      id: 103,
      name: '小新 Pro 16',
      price: 5999,
      cpu: 'R7-7840HS',
      ram: '32G',
      image: '',
    },
  ]
  products.value = mockData
}

onMounted(() => {
  fetchProducts()
})

const handleSearch = () => {
  console.log('正在搜索:', searchText.value)
}

const goToDetail = (id: number) => {
  // 这里也要指定 id 是 number 类型
  router.push(`/product/${id}`)
}
</script>

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
.product-card {
  cursor: pointer;
  transition: all 0.3s;
}
.product-card:hover {
  transform: translateY(-5px);
}
.product-img {
  width: 100%;
  height: 200px;
  display: block;
  background: #f5f7fa;
}
.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #909399;
}
.card-body {
  padding: 10px 0;
}
.product-name {
  font-size: 16px;
  margin: 10px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.specs-tag {
  margin-bottom: 10px;
}
.price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.price {
  color: #f56c6c;
  font-size: 18px;
  font-weight: bold;
}
.sales {
  font-size: 12px;
  color: #999;
}
</style>
