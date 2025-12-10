<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Filter, Sort, ArrowDown, ArrowUp } from '@element-plus/icons-vue'
import type { ProductSimple } from '@/api/model/productModel'

// --- 1. 定义分类的类型接口 (关键：解决TS报错) ---
interface Category {
  id: number
  name: string
  themeColor: string
  subTitle: string
}

// --- 2. 分类配置 (显式指定类型) ---
const categories: Category[] = [
  { id: 0, name: '全部商品', themeColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', subTitle: '探索联想全系科技产品' },
  { id: 1, name: '联想秒杀', themeColor: 'linear-gradient(135deg, #ff4e50 0%, #f9d423 100%)', subTitle: '限时特惠 手慢无' },
  { id: 2, name: 'ThinkPad系列', themeColor: 'linear-gradient(135deg, #000000 0%, #434343 100%)', subTitle: '思考 进化 商务旗舰' },
  { id: 3, name: 'YOGA系列', themeColor: 'linear-gradient(135deg, #cc95c0 0%, #dbd4b4 100%)', subTitle: '品质 匠心 优雅随行' },
  { id: 4, name: '拯救者系列', themeColor: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', subTitle: '为战而生 极致性能' },
  { id: 5, name: '小新系列', themeColor: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', subTitle: '年轻 就要出色' },
  { id: 6, name: 'ThinkBook系列', themeColor: 'linear-gradient(135deg, #bdc2e8 0%, #e6dee9 100%)', subTitle: '新青年 创造力' }
]

const route = useRoute()
const router = useRouter()

const currentCategoryId = ref<number>(0)
const sortType = ref('default') // 排序方式
const allProducts = ref<ProductSimple[]>([])

// --- 3. 修复 computed 报错 ---
// 显式声明返回类型为 Category
const currentCategoryInfo = computed<Category>(() => {
  const found = categories.find(c => c.id === currentCategoryId.value)
  // 如果找不到，返回第一个作为兜底，并使用 ! 断言第一个一定存在
  return found || categories[0]! 
})

// --- 4. 模拟数据生成 ---
const generateMockData = (catId: number) => {
  const mockImages = [
    'https://p1.lefile.cn/product/adminweb/2025/07/31/CcEZSHRcpAOosO45VjSvYXCBY-0478.jpg',
    'https://p1.lefile.cn/product/adminweb/2023/12/15/23456789-1234-5678-9012-345678901234.jpg',
    'https://p1.lefile.cn/product/adminweb/2023/08/15/1692088765432.jpg',
    'https://p1.lefile.cn/product/adminweb/2024/01/17/1705477889901.jpg',
    'https://p1.lefile.cn/product/adminweb/2024/01/28/1706433445566.jpg'
  ]
  
  const list: ProductSimple[] = []
  // 生成 12 个模拟商品
  for (let i = 1; i <= 12; i++) {
    // 这里的 ?. 防止找不到分类名
    const categoryName = categories.find(c => c.id === catId)?.name || '热门商品'
    list.push({
      id: Date.now() + i,
      name: `${categoryName} - 模拟商品 ${i}号 (高性能版)`,
      price: Math.floor(Math.random() * 10000) + 3000,
      imgUrl: mockImages[i % mockImages.length]!,
      tags: i % 3 === 0 ? ['热销', '新品'] : i % 2 === 0 ? ['限时优惠'] : []
    })
  }
  allProducts.value = list
}

// --- 5. 排序逻辑 ---
const displayProducts = computed(() => {
  let list = [...allProducts.value]
  if (sortType.value === 'price-asc') {
    list.sort((a, b) => a.price - b.price)
  } else if (sortType.value === 'price-desc') {
    list.sort((a, b) => b.price - a.price)
  }
  // 如果是销量排序，这里可以加对应的逻辑
  return list
})

// --- 6. 事件处理 ---
const handleCategoryChange = (id: number) => {
  currentCategoryId.value = id
  generateMockData(id)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleSortChange = (type: string) => {
  if (type === 'price') {
    if (sortType.value === 'price-asc') sortType.value = 'price-desc'
    else sortType.value = 'price-asc'
  } else {
    sortType.value = type
  }
}

// 监听路由参数，支持从主页跳转过来自动选中分类
watch(() => route.query.category, (newVal) => {
  if (newVal) {
    // 根据名称反查ID
    const target = categories.find(c => c.name === newVal)
    if (target) handleCategoryChange(target.id)
    else handleCategoryChange(0)
  } else {
    handleCategoryChange(0) // 默认全部
  }
}, { immediate: true })

</script>

<template>
  <div class="product-list-page">
    <div class="container">
      
      <!-- 1. 左侧侧边导航 (Sticky 粘性定位) -->
      <aside class="sidebar">
        <div class="sidebar-title">
          <el-icon><Filter /></el-icon> 商品分类
        </div>
        <ul class="nav-menu">
          <li 
            v-for="cat in categories" 
            :key="cat.id"
            class="nav-item"
            :class="{ active: currentCategoryId === cat.id }"
            @click="handleCategoryChange(cat.id)"
          >
            <!-- 选中时左侧的小色条，颜色动态变化 -->
            <div 
              class="active-bar" 
              :style="{ background: currentCategoryId === cat.id ? cat.themeColor : 'transparent' }"
            ></div>
            <span class="nav-text">{{ cat.name }}</span>
          </li>
        </ul>
      </aside>

      <!-- 2. 右侧主要内容区 -->
      <main class="main-content">
        
        <!-- A. 顶部主题横幅 -->
        <!-- 使用可选链 ?. 避免初始化时 currentCategoryInfo 可能未准备好的报错 -->
        <div class="category-header" :style="{ background: currentCategoryInfo?.themeColor }">
          <div class="header-text">
            <h1>{{ currentCategoryInfo?.name }}</h1>
            <p>{{ currentCategoryInfo?.subTitle }}</p>
          </div>
          <!-- 装饰背景字 -->
          <div class="bg-decoration">LENOVO</div>
        </div>

        <!-- B. 排序筛选工具栏 -->
        <div class="toolbar">
          <div class="sort-group">
            <span 
              class="sort-item" 
              :class="{ active: sortType === 'default' }"
              @click="handleSortChange('default')"
            >
              综合排序
            </span>
            <span 
              class="sort-item" 
              :class="{ active: sortType === 'sales' }"
              @click="handleSortChange('sales')"
            >
              销量优先
            </span>
            <span 
              class="sort-item" 
              :class="{ active: sortType.includes('price') }"
              @click="handleSortChange('price')"
            >
              价格 
              <div class="sort-icons">
                <!-- 价格箭头的动态高亮 -->
                <el-icon :class="{ on: sortType === 'price-asc' }"><ArrowUp /></el-icon>
                <el-icon :class="{ on: sortType === 'price-desc' }"><ArrowDown /></el-icon>
              </div>
            </span>
          </div>
          
          <div class="total-count">共 {{ displayProducts.length }} 件商品</div>
        </div>

        <!-- C. 商品列表网格 -->
        <div class="product-grid">
          <!-- 这里的 ProductCard 组件会自动导入 -->
          <ProductCard 
            v-for="item in displayProducts" 
            :key="item.id" 
            :product="item" 
          />
        </div>
        
        <!-- D. 空状态 -->
        <el-empty v-if="displayProducts.length === 0" description="暂无该分类商品" />

      </main>
    </div>
  </div>
</template>

<style scoped>
.product-list-page {
  background-color: #f4f4f4;
  min-height: 100vh;
  padding-top: 20px;
  padding-bottom: 40px;
}

.container {
  max-width: 1240px;
  margin: 0 auto;
  display: flex;
  gap: 20px;
  padding: 0 20px;
  align-items: flex-start; /* 关键：防止侧边栏被拉伸 */
}

/* --- 左侧侧边栏 --- */
.sidebar {
  width: 240px;
  background: #fff;
  border-radius: 12px;
  position: sticky; /* 粘性定位 */
  top: 84px; /* 距离顶部 Header 的距离 (64px + 20px gap) */
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  overflow: hidden;
  flex-shrink: 0;
}

.sidebar-title {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 700;
  font-size: 16px;
  border-bottom: 1px solid #f0f0f0;
  color: #333;
}

.nav-menu {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item {
  height: 50px;
  display: flex;
  align-items: center;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  color: #666;
}

.nav-item:hover {
  background-color: #f9f9f9;
  color: #333;
}

/* 选中状态 */
.nav-item.active {
  background-color: #f0f7ff;
  color: #333;
  font-weight: 700;
}

.active-bar {
  width: 4px;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  transition: background 0.3s;
}

.nav-text {
  padding-left: 20px;
  font-size: 14px;
}

/* --- 右侧主要内容 --- */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 顶部横幅 */
.category-header {
  height: 120px;
  border-radius: 12px;
  color: #fff;
  padding: 0 40px;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  transition: background 0.5s ease;
}

.header-text h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
}

.header-text p {
  margin: 5px 0 0;
  opacity: 0.8;
  font-size: 14px;
}

.bg-decoration {
  position: absolute;
  right: -20px;
  bottom: -30px;
  font-size: 80px;
  font-weight: 900;
  opacity: 0.1;
  font-style: italic;
  pointer-events: none;
}

/* 筛选工具栏 */
.toolbar {
  background: #fff;
  padding: 15px 20px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sort-group {
  display: flex;
  gap: 30px;
}

.sort-item {
  cursor: pointer;
  font-size: 14px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.2s;
}

.sort-item:hover, .sort-item.active {
  color: var(--el-color-primary);
  font-weight: 600;
}

.sort-icons {
  display: flex;
  flex-direction: column;
  height: 14px;
  justify-content: center;
}

.sort-icons .el-icon {
  font-size: 10px;
  height: 5px;
  line-height: 5px;
  color: #ccc;
}

.sort-icons .el-icon.on {
  color: var(--el-color-primary);
}

.total-count {
  font-size: 12px;
  color: #999;
}

/* 商品网格 */
.product-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* 一行4个 */
  gap: 15px;
}

/* 响应式适配 */
@media (max-width: 1200px) {
  .product-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 900px) {
  .container { flex-direction: column; }
  .sidebar { width: 100%; position: static; margin-bottom: 20px;}
  .product-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>