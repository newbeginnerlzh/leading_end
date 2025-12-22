<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { Filter, Sort, ArrowDown, ArrowUp, Search, Goods } from '@element-plus/icons-vue'
import type { ProductSimple } from '@/api/model/productModel'

// --- 1. 分类配置 ---
interface Category {
  id: number
  name: string
  themeColor: string
  subTitle: string
}

const categories = ref<Category[]>([
  { id: 0, name: '全部商品', themeColor: 'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)', subTitle: '探索联想全系科技产品' },
  { id: 25, name: '拯救者系列', themeColor: 'linear-gradient(120deg, #4facfe 0%, #00f2fe 100%)', subTitle: '为战而生 极致性能' },
  { id: 26, name: '小新系列', themeColor: 'linear-gradient(120deg, #43e97b 0%, #38f9d7 100%)', subTitle: '年轻 就要出色' },
  { id: 27, name: 'YOGA系列', themeColor: 'linear-gradient(120deg, #fccb90 0%, #d57eeb 100%)', subTitle: '品质 匠心 优雅随行' },
  { id: 28, name: 'ThinkBook系列', themeColor: 'linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%)', subTitle: '新青年 创造力' },
  { id: 29, name: 'ThinkPad系列', themeColor: 'linear-gradient(120deg, #202020 0%, #434343 100%)', subTitle: '思考 进化 商务旗舰' }
])

const route = useRoute()
const router = useRouter()

// --- 状态定义 ---
const currentCategoryId = ref<number>(0)
const sortType = ref('default') 
const allProducts = ref<ProductSimple[]>([]) 
const searchKeyword = ref('') 
const loading = ref(false)

// --- 计算属性 ---
const currentCategoryInfo = computed<Category>(() => {
  if (searchKeyword.value) {
    return {
      id: -1,
      name: `搜索结果：${searchKeyword.value}`,
      themeColor: 'linear-gradient(120deg, #89f7fe 0%, #66a6ff 100%)',
      subTitle: '全站搜索匹配商品'
    }
  }
  const found = categories.value.find(c => c.id === currentCategoryId.value)
  return found || categories.value[0]! 
})

// --- 2. 获取分类 (模拟/真实) ---
const fetchCategories = async () => {
  try {
    const res = await axios.get('/api/products/categories')
    const rawCats = Array.isArray(res.data) ? res.data : (res.data.data || [])
    if (rawCats.length > 0) {
      const dbCategories = rawCats.map((item: any) => ({
        id: item.id,
        name: item.name,
        themeColor: item.themeColor || item.theme_color || 'linear-gradient(120deg, #a18cd1 0%, #fbc2eb 100%)',
        subTitle: item.subTitle || item.sub_title || '联想精选'
      }))
      categories.value = [categories.value[0], ...dbCategories]
    }
  } catch (err) {
    console.warn('使用默认分类配置')
  }
}

// --- 3. 获取商品列表 ---
const fetchProductList = async () => {
  loading.value = true
  const token = localStorage.getItem('token') || ''
  
  try {
    const params: any = {
      keyword: searchKeyword.value.trim() || ' ', 
      page: 1,
      pageSize: 50, 
      sort: sortType.value === 'default' ? '' : sortType.value
    }

    if (currentCategoryId.value !== 0) {
      params.categoryId = currentCategoryId.value
    }

    const res = await axios.get('/api/products', {
      headers: { 'Authorization': `Bearer ${token}` },
      params: params
    })

    const resData = res.data
    let rawList = []
    
    if (resData?.data?.ProductSimple) rawList = resData.data.ProductSimple
    else if (resData?.data?.productSimple) rawList = resData.data.productSimple
    else if (Array.isArray(resData?.data)) rawList = resData.data

    allProducts.value = rawList.map((item: any) => {
      let finalImg = ''
      if (item.imgUrl) finalImg = item.imgUrl
      else if (item.image) finalImg = item.image
      else if (item.main_images) {
          try { finalImg = JSON.parse(item.main_images)[0] } catch(e) {}
      }

      return {
        id: item.id,
        name: item.name,
        price: Number(item.price || item.minPrice || 0),
        imgUrl: finalImg || 'https://p1.lefile.cn/product/adminweb/2024/01/17/1705477889901.jpg',
        tags: item.tag ? [item.tag] : []
      }
    })

  } catch (err) {
    console.error('获取商品列表失败:', err)
  } finally {
    loading.value = false
  }
}

// --- 事件处理 ---
const handleCategoryChange = (id: number) => {
  currentCategoryId.value = id
  searchKeyword.value = '' 
  router.push({ query: { category: id === 0 ? undefined : id } })
  fetchProductList()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleSortChange = (type: string) => {
  if (type === 'price') {
    sortType.value = sortType.value === 'price_asc' ? 'price_desc' : 'price_asc'
  } else {
    sortType.value = type
  }
  fetchProductList()
}

const handleSidebarSearch = () => {
  currentCategoryId.value = 0
  router.push({ query: { keyword: searchKeyword.value } })
  fetchProductList()
}

watch(() => route.query, (query) => {
  let needsFetch = false
  if (query.keyword) {
    searchKeyword.value = query.keyword as string
    currentCategoryId.value = 0 
    needsFetch = true
  } else if (!query.keyword && searchKeyword.value) {
    searchKeyword.value = ''
    needsFetch = true
  }

  if (query.category) {
    const catId = Number(query.category)
    if (!isNaN(catId) && catId !== currentCategoryId.value) {
      currentCategoryId.value = catId
      needsFetch = true
    }
  } else if (!query.keyword && currentCategoryId.value !== 0) {
    currentCategoryId.value = 0
    needsFetch = true
  }

  if (needsFetch || allProducts.value.length === 0) {
    fetchProductList()
  }
}, { immediate: true })

onMounted(async () => {
  await fetchCategories()
  if (allProducts.value.length === 0) {
    fetchProductList()
  }
})
</script>

<template>
  <div class="product-list-page">
    <div class="container">
      
      <!-- 1. 左侧侧边导航 (美化卡片) -->
      <aside class="sidebar">
        <!-- 搜索框区域 -->
        <div class="sidebar-search">
          <el-input
            v-model="searchKeyword"
            placeholder="搜全站..."
            class="custom-input"
            clearable
            @keyup.enter="handleSidebarSearch"
            @clear="handleSidebarSearch"
          >
            <template #prefix>
              <el-icon class="search-icon"><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <div class="sidebar-header">
          <el-icon><Goods /></el-icon>
          <span>商品分类</span>
        </div>

        <ul class="nav-menu">
          <li 
            v-for="cat in categories" 
            :key="cat.id"
            class="nav-item"
            :class="{ active: currentCategoryId === cat.id }"
            @click="handleCategoryChange(cat.id)"
          >
            <span class="nav-text">{{ cat.name }}</span>
            <el-icon class="arrow-icon"><ArrowRight /></el-icon>
          </li>
        </ul>
      </aside>

      <!-- 2. 右侧主要内容区 -->
      <main class="main-content">
        
        <!-- A. 顶部主题横幅 (卡片式) -->
        <div class="category-header" :style="{ background: currentCategoryInfo?.themeColor }">
          <div class="header-content">
            <h1 class="fade-in-up">{{ currentCategoryInfo?.name }}</h1>
            <p class="fade-in-up delay-1">{{ currentCategoryInfo?.subTitle }}</p>
          </div>
          <!-- 巨大的装饰性背景字 -->
          <div class="bg-watermark">{{ currentCategoryInfo?.name === '全部商品' ? 'ALL' : currentCategoryInfo?.name.substring(0,4).toUpperCase() }}</div>
        </div>

        <!-- B. 排序筛选工具栏 (悬浮感) -->
        <div class="toolbar">
          <div class="sort-group">
            <span class="sort-label">排序方式：</span>
            <div 
              class="sort-item" 
              :class="{ active: sortType === 'default' }"
              @click="handleSortChange('default')"
            >
              综合
            </div>
            <div 
              class="sort-item" 
              :class="{ active: sortType === 'sales' }"
              @click="handleSortChange('sales')"
            >
              销量
            </div>
            <div 
              class="sort-item price-item" 
              :class="{ active: sortType.includes('price') }"
              @click="handleSortChange('price')"
            >
              价格
              <div class="sort-icons">
                <el-icon :class="{ on: sortType === 'price_asc' }"><ArrowUp /></el-icon>
                <el-icon :class="{ on: sortType === 'price_desc' }"><ArrowDown /></el-icon>
              </div>
            </div>
          </div>
          
          <div class="total-count">
            共 <span class="count-num">{{ allProducts.length }}</span> 件商品
          </div>
        </div>

        <!-- C. 商品列表网格 -->
        <div v-loading="loading" class="product-grid-wrapper">
          <div class="product-grid" v-if="allProducts.length > 0">
            <ProductCard 
              v-for="item in allProducts" 
              :key="item.id" 
              :product="item" 
            />
          </div>
          
          <el-empty v-else description="暂无相关商品" :image-size="200" />
        </div>

      </main>
    </div>
  </div>
</template>

<style scoped>
/* 页面背景 */
.product-list-page {
  background-color: #f7f9fa; /* 更柔和的灰 */
  min-height: 100vh;
  padding-top: 30px;
  padding-bottom: 60px;
}

.container {
  max-width: 1240px;
  margin: 0 auto;
  display: flex;
  gap: 24px;
  padding: 0 20px;
  align-items: flex-start;
}

/* --- 左侧侧边栏美化 --- */
.sidebar {
  width: 260px;
  background: #fff;
  border-radius: 16px; /* 更大的圆角 */
  position: sticky;
  top: 84px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.04); /* 更柔和的阴影 */
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid #f0f0f0;
}

.sidebar-search {
  padding: 20px;
  background: #fff;
  border-bottom: 1px solid #f5f5f5;
}

/* 搜索框美化 */
:deep(.custom-input .el-input__wrapper) {
  border-radius: 20px;
  background-color: #f5f7fa;
  box-shadow: none !important; /* 去掉默认边框 */
  padding-left: 15px;
}
:deep(.custom-input .el-input__wrapper.is-focus) {
  background-color: #fff;
  box-shadow: 0 0 0 1px var(--el-color-primary) !important;
}

.sidebar-header {
  padding: 15px 24px;
  font-size: 16px;
  font-weight: 800;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-menu {
  list-style: none;
  padding: 0 10px 20px 10px;
  margin: 0;
}

.nav-item {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
  margin-bottom: 4px;
  border-radius: 8px; /* 菜单项也是圆角 */
  cursor: pointer;
  color: #666;
  font-size: 14px;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background-color: #f5f7fa;
  color: #333;
}

.nav-item.active {
  background-color: #ecf5ff; /* 激活态浅蓝背景 */
  color: var(--el-color-primary);
  font-weight: 700;
}

.nav-item.active .arrow-icon {
  color: var(--el-color-primary);
  opacity: 1;
}

.arrow-icon {
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.2s;
}

/* --- 右侧主要内容 --- */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 顶部横幅美化 */
.category-header {
  height: 140px;
  border-radius: 16px;
  color: #fff;
  padding: 0 50px;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.header-content {
  position: relative;
  z-index: 2;
}

.header-content h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: 1px;
}

.header-content p {
  margin: 8px 0 0;
  opacity: 0.9;
  font-size: 15px;
  font-weight: 300;
}

/* 装饰性大水印 */
.bg-watermark {
  position: absolute;
  right: -10px;
  bottom: -40px;
  font-size: 120px;
  font-weight: 900;
  color: #fff;
  opacity: 0.15;
  font-family: Arial, sans-serif;
  pointer-events: none;
  font-style: italic;
}

/* 动画效果 */
.fade-in-up { animation: fadeInUp 0.6s ease forwards; opacity: 0; transform: translateY(10px); }
.delay-1 { animation-delay: 0.1s; }
@keyframes fadeInUp { to { opacity: 1; transform: translateY(0); } }

/* 筛选工具栏美化 */
.toolbar {
  background: #fff;
  padding: 12px 24px;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  border: 1px solid #f0f0f0;
}

.sort-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sort-label {
  font-size: 14px;
  color: #999;
  margin-right: 5px;
}

.sort-item {
  padding: 6px 16px;
  font-size: 14px;
  color: #555;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
  background-color: #f5f7fa;
}

.sort-item:hover {
  color: #333;
  background-color: #eef0f3;
}

.sort-item.active {
  background-color: #333; /* 选中变成黑色块 */
  color: #fff;
  font-weight: 500;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
}

.price-item {
  display: flex;
  align-items: center;
  gap: 4px;
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
  color: #999;
}

.sort-item.active .sort-icons .el-icon {
  color: rgba(255,255,255,0.5);
}
.sort-item.active .sort-icons .el-icon.on {
  color: #fff;
}

.total-count {
  font-size: 13px;
  color: #666;
}
.count-num {
  font-weight: 800;
  color: #333;
  font-size: 16px;
}

/* 商品网格 */
.product-grid-wrapper { min-height: 300px; }
.product-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px; /* 间距加大 */
}

/* 响应式 */
@media (max-width: 1200px) { .product-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 900px) { 
  .container { flex-direction: column; } 
  .sidebar { width: 100%; position: static; margin-bottom: 20px;} 
  .product-grid { grid-template-columns: repeat(2, 1fr); } 
}
</style>