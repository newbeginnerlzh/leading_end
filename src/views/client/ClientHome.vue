<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ArrowRight } from '@element-plus/icons-vue'
import type { ProductSimple } from '@/api/model/productModel'

// --- 1. 顶部轮播图数据 ---
const bannerList = [
  'https://p3.lefile.cn/fes/cms/2025/11/26/q9wa3g5jnkik6rl6gxjykhc0xvphbd164310.jpg',
  'https://p1.lefile.cn/fes/cms/2025/11/25/whw61hnappz3x3k2n9rqbq8giucyd9076100.jpg',
  'https://p4.lefile.cn/fes/cms/2025/12/04/pqvp2a8gia2eu549qaljn49e9hn0pt791216.jpg',
]

// --- 修改：侧边栏菜单数据 (6项) ---
const categoryList = [
  { id: 1, name: '联想秒杀' },
  { id: 2, name: 'ThinkPad系列' },
  { id: 3, name: 'YOGA系列' },
  { id: 4, name: '拯救者系列' },
  { id: 5, name: '小新系列' },
  { id: 6, name: 'ThinkBook系列' },
]

// --- 2. 楼层数据定义 ---
interface FloorSection {
  id: string
  title: string
  subTitle: string
  themeColor: string
  products: ProductSimple[]
}

const floorList = ref<FloorSection[]>([])

// --- 3. 模拟数据生成 (更新为6个楼层) ---
const fetchHomeData = () => {
  const createProduct = (
    id: number,
    name: string,
    price: number,
    tag: string,
    img: string,
  ): ProductSimple => ({
    id,
    name,
    price,
    imgUrl: img,
    tags: [tag],
  })

  floorList.value = [
    {
      id: 'seckill',
      title: '联想秒杀',
      subTitle: '限时特惠 手慢无',
      themeColor: 'linear-gradient(135deg, #ff4e50 0%, #f9d423 100%)', // 激情红橙
      products: [
        createProduct(
          1001,
          '小新 Pro 14 2024 AI超能本',
          4999,
          '限时秒杀',
          'https://p2.lefile.cn/product/adminweb/2024/01/17/C07B6409-5C32-4299-8086-5384218C8B8F.jpg',
        ),
        createProduct(
          102,
          '联想拯救者 Y9000P i9顶配版',
          10999,
          '直降1000',
          'https://p1.lefile.cn/product/adminweb/2024/02/26/97960334-9273-4556-9128-567432585958.jpg',
        ),
        createProduct(
          103,
          'ThinkBook 14+ 2024款',
          5299,
          '爆款',
          'https://p2.lefile.cn/product/adminweb/2024/01/25/68783451-2475-4375-8656-547348325656.jpg',
        ),
        createProduct(
          104,
          '联想个人云存储 T2',
          999,
          '居家必备',
          'https://p3.lefile.cn/product/adminweb/2021/10/29/18a2283e-f32a-4467-93e1-700142385412.jpg',
        ),
      ],
    },
    {
      id: 'thinkpad',
      title: 'ThinkPad系列',
      subTitle: '思考 进化',
      themeColor: 'linear-gradient(135deg, #000000 0%, #434343 100%)', // 经典黑
      products: [
        createProduct(
          301,
          'ThinkPad X1 Carbon Gen 12',
          14999,
          '商务旗舰',
          'https://p1.lefile.cn/product/adminweb/2023/12/15/23456789-1234-5678-9012-345678901234.jpg',
        ),
        createProduct(
          302,
          'ThinkPad T14p',
          6999,
          '工程师首选',
          'https://p2.lefile.cn/product/adminweb/2023/05/18/1684399876543.jpg',
        ),
        createProduct(
          303,
          'ThinkPad neo 14',
          5999,
          '创意设计',
          'https://p3.lefile.cn/product/adminweb/2022/07/20/1658288765432.jpg',
        ),
        createProduct(
          304,
          'ThinkPad 口红电源 65W',
          199,
          '便携',
          'https://p4.lefile.cn/product/adminweb/2018/11/15/1542265432109.jpg',
        ),
      ],
    },
    {
      id: 'yoga',
      title: 'YOGA系列',
      subTitle: '品质 匠心',
      themeColor: 'linear-gradient(135deg, #cc95c0 0%, #dbd4b4 100%)', // 优雅金紫
      products: [
        createProduct(
          601,
          'YOGA Air 14s 2024',
          8999,
          '超轻薄',
          'https://p1.lefile.cn/product/adminweb/2023/08/15/1692088765432.jpg',
        ),
        createProduct(
          602,
          'YOGA Pro 14s',
          7999,
          '至尊版',
          'https://p2.lefile.cn/product/adminweb/2023/06/20/1687255667788.jpg',
        ),
        createProduct(
          603,
          'YOGA 27 一体机',
          9999,
          '4K全面屏',
          'https://p3.lefile.cn/product/adminweb/2023/10/10/1696922334455.jpg',
        ),
        createProduct(
          604,
          'YOGA 鼠标',
          199,
          '时尚',
          'https://p4.lefile.cn/product/adminweb/2022/03/15/1647333445566.jpg',
        ),
      ],
    },
    {
      id: 'legion',
      title: '拯救者系列',
      subTitle: '为战而生',
      themeColor: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', // 蓝紫电竞
      products: [
        createProduct(
          201,
          '拯救者 Y9000K 旗舰电竞本',
          24999,
          '旗舰',
          'https://p1.lefile.cn/product/adminweb/2025/07/31/CcEZSHRcpAOosO45VjSvYXCBY-0478.jpg',
        ),
        createProduct(
          202,
          '拯救者 R9000P 2024',
          8999,
          'AMD锐龙',
          'https://p3.lefile.cn/product/adminweb/2024/03/28/76583421-2345-4235-8235-235472354235.jpg',
        ),
        createProduct(
          203,
          '拯救者 M5 鼠标',
          129,
          '电竞外设',
          'https://p2.lefile.cn/product/adminweb/2023/04/18/1681788756086.jpg',
        ),
        createProduct(
          204,
          '拯救者 C170 氮化镓适配器',
          249,
          '便携',
          'https://p1.lefile.cn/product/adminweb/2024/04/08/1712543567890.jpg',
        ),
      ],
    },
    {
      id: 'xiaoxin',
      title: '小新系列',
      subTitle: '年轻 就要出色',
      themeColor: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', // 清新活力
      products: [
        createProduct(
          401,
          '小新 Pro 16 2024',
          5999,
          '大屏全能',
          'https://p1.lefile.cn/product/adminweb/2024/01/17/1705477889901.jpg',
        ),
        createProduct(
          402,
          '小新 Pad Pro 12.7',
          1699,
          '影音平板',
          'https://p2.lefile.cn/product/adminweb/2023/07/28/1690533445566.jpg',
        ),
        createProduct(
          403,
          '小新 Air 14 2023',
          3999,
          '轻薄本',
          'https://p3.lefile.cn/product/adminweb/2023/02/15/1676455667788.jpg',
        ),
        createProduct(
          404,
          '小新 K3 轻音键盘',
          99,
          '办公',
          'https://p4.lefile.cn/product/adminweb/2021/08/10/1628588990011.jpg',
        ),
      ],
    },
    {
      id: 'thinkbook',
      title: 'ThinkBook系列',
      subTitle: '新青年 创造力',
      themeColor: 'linear-gradient(135deg, #bdc2e8 0%, #e6dee9 100%)', // 银灰时尚
      products: [
        createProduct(
          501,
          'ThinkBook 14+ 2024',
          5499,
          '全能本',
          'https://p1.lefile.cn/product/adminweb/2024/01/28/1706433445566.jpg',
        ),
        createProduct(
          502,
          'ThinkBook 16+ 2024',
          5799,
          '大屏商务',
          'https://p2.lefile.cn/product/adminweb/2024/02/05/1707122334455.jpg',
        ),
        createProduct(
          503,
          'ThinkBook Plus Twist',
          8999,
          '旋转双屏',
          'https://p3.lefile.cn/product/adminweb/2023/06/15/1686811223344.jpg',
        ),
        createProduct(
          504,
          'ThinkBook 背包',
          199,
          '通勤',
          'https://p4.lefile.cn/product/adminweb/2022/09/20/1663655443322.jpg',
        ),
      ],
    },
  ]
}

onMounted(() => {
  fetchHomeData()
})

const handleCategoryClick = (name: string) => {
  console.log('点击分类:', name)
  // 实际开发中，这里可以使用 document.getElementById(id).scrollIntoView() 实现点击菜单跳转到对应楼层
}
</script>

<template>
  <div class="main-view">
    <!-- 1. 顶部轮播图区域 -->
    <div class="banner-container">
      <!-- 侧边栏菜单：直接贴左侧 -->
      <div class="category-sidebar">
        <ul class="category-list">
          <li
            v-for="cat in categoryList"
            :key="cat.id"
            class="category-item"
            @click="handleCategoryClick(cat.name)"
          >
            <span class="cat-name">{{ cat.name }}</span>
            <el-icon class="arrow-icon"><ArrowRight /></el-icon>
          </li>
        </ul>
      </div>

      <!-- 轮播组件：高度 600px -->
      <el-carousel trigger="click" height="600px" :interval="5000" arrow="hover">
        <el-carousel-item v-for="(img, index) in bannerList" :key="index">
          <img :src="img" alt="banner" class="banner-img" />
        </el-carousel-item>
      </el-carousel>
    </div>

    <!-- 2. 商品楼层区域 -->
    <div class="floor-container">
      <div v-for="floor in floorList" :key="floor.id" class="floor-section">
        <!-- 左侧：类型海报 -->
        <div class="floor-aside" :style="{ background: floor.themeColor }">
          <div class="aside-content">
            <h2 class="floor-title">{{ floor.title }}</h2>
            <p class="floor-subtitle">{{ floor.subTitle }}</p>
            <div class="view-more-btn">
              查看全部 <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
          <!-- 装饰ID背景 -->
          <div class="bg-text">{{ floor.id }}</div>
        </div>
        <!-- 右侧：商品网格 -->
        <div class="floor-grid">
          <ProductCard
            v-for="product in floor.products"
            :key="product.id"
            :product="product"
            class="floor-product-card"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-view {
  width: 100%;
  padding: 0;
  background-color: #f4f4f4;
  padding-bottom: 40px;
}

/* --- 轮播图容器 --- */
.banner-container {
  width: 100%;
  position: relative;
  margin-bottom: 20px;
}

/* 图片样式：cover 模式，全屏铺满 */
.banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  display: block;
}

/* --- 侧边栏布局 (保持贴左) --- */
.category-sidebar {
  position: absolute;
  top: 0;
  left: 0;
  width: 260px;
  height: 100%;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  box-shadow: 4px 0 10px rgba(0, 0, 0, 0.05);
  z-index: 10;
  pointer-events: auto;
}

.category-list {
  list-style: none;
  padding: 0;
  margin: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* flex: 1 让每个菜单项平分高度 */
.category-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  cursor: pointer;
  transition: all 0.3s;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
}
.category-item:last-child {
  border-bottom: none;
}
.category-item:hover {
  background-color: #fff;
  color: var(--el-color-primary);
  box-shadow: 4px 0 10px rgba(0, 0, 0, 0.1);
  z-index: 1;
}
.cat-name {
  font-size: 18px;
  font-weight: 700;
  color: #333;
  letter-spacing: 1px;
}
.category-item:hover .cat-name,
.category-item:hover .arrow-icon {
  color: var(--el-color-primary);
}
.arrow-icon {
  font-size: 18px;
  color: #bbb;
}

/* 轮播圆点 */
:deep(.el-carousel__indicators--horizontal) {
  bottom: 20px;
}
:deep(.el-carousel__indicator--horizontal .el-carousel__button) {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.5);
}
:deep(.el-carousel__indicator--horizontal.is-active .el-carousel__button) {
  width: 25px;
  height: 10px;
  border-radius: 5px;
  background-color: #ffffff;
  opacity: 1;
}

/* --- 楼层样式 --- */
.floor-container {
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  gap: 30px;
}
.floor-section {
  display: flex;
  height: 360px;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  transition: transform 0.3s;
}
.floor-section:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}
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
}
.aside-content {
  position: relative;
  z-index: 2;
}
.floor-title {
  font-size: 28px;
  margin: 0 0 10px;
  font-weight: 800;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
.floor-subtitle {
  font-size: 16px;
  margin: 0 0 25px;
  opacity: 0.9;
}
.view-more-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 20px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}
.view-more-btn:hover {
  background: #fff;
  color: #333;
}
.bg-text {
  position: absolute;
  bottom: -20px;
  right: -20px;
  font-size: 80px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.1);
  text-transform: uppercase;
  z-index: 1;
  pointer-events: none;
}
.floor-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  padding: 15px;
  background-color: #fff;
}
.floor-product-card {
  height: 100%;
  box-shadow: none !important;
  border: 1px solid #f0f0f0;
}
.floor-product-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
  transform: translateY(-3px);
  border-color: transparent;
  z-index: 2;
}
</style>
