<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { Filter, Sort, ArrowDown, ArrowUp, Search } from '@element-plus/icons-vue'
import type { ProductSimple } from '@/api/model/productModel'

// --- 1. 分类配置 (ID 必须对应数据库 product_category 表) ---
interface Category {
  id: number
  name: string
  themeColor: string
  subTitle: string
}

const categories: Category[] = [
  { id: 0, name: '全部商品', themeColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', subTitle: '探索联想全系科技产品' },
  { id: 25, name: '拯救者系列', themeColor: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', subTitle: '为战而生 极致性能' },
  { id: 26, name: '小新系列', themeColor: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', subTitle: '年轻 就要出色' },
  { id: 27, name: 'YOGA系列', themeColor: 'linear-gradient(135deg, #cc95c0 0%, #dbd4b4 100%)', subTitle: '品质 匠心 优雅随行' },
  { id: 28, name: 'ThinkBook系列', themeColor: 'linear-gradient(135deg, #bdc2e8 0%, #e6dee9 100%)', subTitle: '新青年 创造力' },
  { id: 29, name: 'ThinkPad系列', themeColor: 'linear-gradient(135deg, #000000 0%, #434343 100%)', subTitle: '思考 进化 商务旗舰' }
]

const route = useRoute()
const router = useRouter()

// --- 状态定义 ---
const currentCategoryId = ref<number>(0)
const sortType = ref('default') // default, price_asc, price_desc
const allProducts = ref<ProductSimple[]>([]) // 存储当前分类下的商品
const searchKeyword = ref('') // 侧边栏搜索框的值
const loading = ref(false)

// --- 计算属性: 当前分类展示信息 ---
const currentCategoryInfo = computed<Category>(() => {
  // 如果正在搜索，展示搜索主题
  if (searchKeyword.value) {
    return {
      id: -1,
      name: `搜索："${searchKeyword.value}"`,
      themeColor: 'linear-gradient(135deg, #606c88 0%, #3f4c6b 100%)',
      subTitle: '全站搜索结果'
    }
  }
  const found = categories.find(c => c.id === currentCategoryId.value)
  return found || categories[0]! 
})

// --- 2. 核心：从后端获取数据 ---
const fetchProductList = async () => {
  loading.value = true
  const token = localStorage.getItem('token') || ''
  
  try {
    // 构造参数
    const params: any = {
      // 如果有搜索词，传搜索词；如果没有，传空格(搜全部)
      keyword: searchKeyword.value.trim() || ' ', 
      page: 1,
      pageSize: 50, // 列表页一次拿多点
      sort: sortType.value === 'default' ? '' : sortType.value
    }

    // 如果选了特定分类(非全部)，传 categoryId
    // 注意：如果是搜索状态，通常建议把 categoryId 置空，以便全站搜索
    // 这里逻辑是：如果当前选中了分类，就在该分类下搜；如果是“全部商品”，就全站搜
    if (currentCategoryId.value !== 0) {
      params.categoryId = currentCategoryId.value
    }

    console.log('正在请求列表:', params)

    const res = await axios.get('/api/products', {
      headers: { 'Authorization': `Bearer ${token}` },
      params: params
    })

    // 解析数据 (适配后端可能的大小写问题)
    const resData = res.data
    let rawList = []
    
    if (resData?.data?.ProductSimple) rawList = resData.data.ProductSimple
    else if (resData?.data?.productSimple) rawList = resData.data.productSimple
    else if (Array.isArray(resData?.data)) rawList = resData.data

    // 映射数据
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

// --- 3. 事件处理 ---

// 切换左侧分类
const handleCategoryChange = (id: number) => {
  currentCategoryId.value = id
  // 切换分类时，通常清空搜索词，回归该分类下的全部商品
  // 如果你想保留搜索词在不同分类下搜，可以注释掉下面这行
  searchKeyword.value = '' 
  
  // 更新 URL 参数 (不刷新页面)
  router.push({ query: { category: id === 0 ? undefined : id } })
  
  fetchProductList()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 切换排序
const handleSortChange = (type: string) => {
  if (type === 'price') {
    sortType.value = sortType.value === 'price_asc' ? 'price_desc' : 'price_asc'
  } else {
    sortType.value = type
  }
  fetchProductList()
}

// 触发搜索 (侧边栏回车)
const handleSidebarSearch = () => {
  // 搜索时，把分类重置为“全部”，进行全站搜索
  currentCategoryId.value = 0
  router.push({ query: { keyword: searchKeyword.value } })
  fetchProductList()
}

// --- 4. 监听路由变化 (实现从首页跳转过来自动搜索) ---
watch(() => route.query, (query) => {
  let needsFetch = false

  // 处理 keyword 参数
  if (query.keyword) {
    searchKeyword.value = query.keyword as string
    currentCategoryId.value = 0 // 搜索模式默认查全部
    needsFetch = true
  } else {
    // 如果 URL 里没关键字，但输入框里有，说明是用户手动清空了 URL，需同步清空输入框
    if (searchKeyword.value) {
      searchKeyword.value = ''
      needsFetch = true
    }
  }

  // 处理 category 参数 (这里传的是 ID 数字)
  if (query.category) {
    const catId = Number(query.category)
    if (!isNaN(catId) && catId !== currentCategoryId.value) {
      currentCategoryId.value = catId
      needsFetch = true
    }
  } else if (!query.keyword && currentCategoryId.value !== 0) {
    // 既没搜也没选分类，重置为0
    currentCategoryId.value = 0
    needsFetch = true
  }

  // 如果参数变了，或者页面刚加载(且列表为空)，请求数据
  if (needsFetch || allProducts.value.length === 0) {
    fetchProductList()
  }
}, { immediate: true })

onMounted(() => {
  // 兜底：如果 watch 没触发，手动请求一次
  if (allProducts.value.length === 0) {
    fetchProductList()
  }
})
</script>

<template>
  <div class="product-list-page">
    <div class="container">
      
      <!-- 1. 左侧侧边导航 -->
      <aside class="sidebar">
        <!-- 侧边栏搜索框 -->
        <div class="sidebar-search">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索全站商品..."
            clearable
            @keyup.enter="handleSidebarSearch"
            @clear="handleSidebarSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

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
        
        <!-- 顶部主题横幅 -->
        <div class="category-header" :style="{ background: currentCategoryInfo?.themeColor }">
          <div class="header-text">
            <h1>{{ currentCategoryInfo?.name }}</h1>
            <p>{{ currentCategoryInfo?.subTitle }}</p>
          </div>
          <div class="bg-decoration">LENOVO</div>
        </div>

        <!-- 排序筛选工具栏 -->
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
                <el-icon :class="{ on: sortType === 'price_asc' }"><ArrowUp /></el-icon>
                <el-icon :class="{ on: sortType === 'price_desc' }"><ArrowDown /></el-icon>
              </div>
            </span>
          </div>
          
          <div class="total-count">
            共 <span style="color: var(--el-color-primary); font-weight: bold;">{{ allProducts.length }}</span> 件商品
          </div>
        </div>

        <!-- 商品列表网格 -->
        <div v-loading="loading" class="product-grid-wrapper">
          <div class="product-grid" v-if="allProducts.length > 0">
            <ProductCard 
              v-for="item in allProducts" 
              :key="item.id" 
              :product="item" 
            />
          </div>
          
          <!-- 空状态 -->
          <el-empty v-else description="没有找到相关商品，换个词试试？" />
        </div>

      </main>
    </div>
  </div>
</template>

<style scoped>
/* 样式保持不变 */
.product-list-page { background-color: #f4f4f4; min-height: 100vh; padding-top: 20px; padding-bottom: 40px; }
.container { max-width: 1240px; margin: 0 auto; display: flex; gap: 20px; padding: 0 20px; align-items: flex-start; }
.sidebar { width: 240px; background: #fff; border-radius: 12px; position: sticky; top: 84px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden; flex-shrink: 0; display: flex; flex-direction: column; }
.sidebar-search { padding: 15px; border-bottom: 1px solid #f5f5f5; }
.sidebar-title { height: 40px; display: flex; align-items: center; padding-left: 20px; gap: 8px; font-weight: 700; font-size: 14px; color: #999; margin-top: 10px; }
.nav-menu { list-style: none; padding: 0; margin: 0; padding-bottom: 10px; }
.nav-item { height: 50px; display: flex; align-items: center; cursor: pointer; position: relative; transition: all 0.2s; color: #666; }
.nav-item:hover { background-color: #f9f9f9; color: #333; }
.nav-item.active { background-color: #f0f7ff; color: #333; font-weight: 700; }
.active-bar { width: 4px; height: 100%; position: absolute; left: 0; top: 0; transition: background 0.3s; }
.nav-text { padding-left: 20px; font-size: 14px; }
.main-content { flex: 1; display: flex; flex-direction: column; gap: 20px; }
.category-header { height: 120px; border-radius: 12px; color: #fff; padding: 0 40px; display: flex; align-items: center; position: relative; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); transition: background 0.5s ease; }
.header-text h1 { margin: 0; font-size: 28px; font-weight: 800; }
.header-text p { margin: 5px 0 0; opacity: 0.8; font-size: 14px; }
.bg-decoration { position: absolute; right: -20px; bottom: -30px; font-size: 80px; font-weight: 900; opacity: 0.1; font-style: italic; pointer-events: none; }
.toolbar { background: #fff; padding: 15px 20px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
.sort-group { display: flex; gap: 30px; }
.sort-item { cursor: pointer; font-size: 14px; color: #666; display: flex; align-items: center; gap: 4px; transition: color 0.2s; }
.sort-item:hover, .sort-item.active { color: var(--el-color-primary); font-weight: 600; }
.sort-icons { display: flex; flex-direction: column; height: 14px; justify-content: center; }
.sort-icons .el-icon { font-size: 10px; height: 5px; line-height: 5px; color: #ccc; }
.sort-icons .el-icon.on { color: var(--el-color-primary); }
.total-count { font-size: 12px; color: #999; }
.product-grid-wrapper { min-height: 300px; }
.product-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
@media (max-width: 1200px) { .product-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 900px) { .container { flex-direction: column; } .sidebar { width: 100%; position: static; margin-bottom: 20px;} .product-grid { grid-template-columns: repeat(2, 1fr); } }
</style>