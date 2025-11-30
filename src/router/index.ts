import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', component: () => import('../views/client/ClientHome.vue') }, // 首页
  {
    path: '/login',
    component: () => import('../views/client/ClientLogin.vue'),
    meta: { title: '登录', hideHeader: true },
  }, // 登录
  {
    path: '/products',
    component: () => import('../views/client/ProductList.vue'),
    meta: { title: '商品列表' },
  }, // 商品列表
  {
    path: '/product/:id',
    component: () => import('../views/client/ProductDetail.vue'),
    meta: { title: '商品详情' },
  }, // 商品详情
  {
    path: '/cart',
    component: () => import('../views/client/ClientCart.vue'),
    meta: { title: '购物车' },
  }, // 购物车
  {
    path: '/checkout',
    component: () => import('../views/client/ClientOrderSettlement.vue'),
    meta: { title: '结算' },
  }, // 结算
  {
    path: '/payment',
    component: () => import('../views/client/ClientPayment.vue'),
    meta: { title: '支付' },
  }, // 支付
  {
    path: '/service',
    component: () => import('../views/client/ClientOnlineService.vue'),
    meta: { title: '在线客服' },
  }, // 在线客服
  {
    path: '/user',
    component: () => import('../views/client/user/UserLayout.vue'),
    redirect: '/user/profile',
    children: [
      {
        path: 'profile',
        component: () => import('../views/client/user/UserProfile.vue'),
        meta: { title: '个人中心' },
      }, // 用户信息
      {
        path: 'address',
        component: () => import('../views/client/user/UserAddress.vue'),
        meta: { title: '收货地址' },
      }, // 用户地址
      {
        path: 'orders',
        component: () => import('../views/client/user/UserOrderList.vue'),
        meta: { title: '订单列表' },
      }, // 用户订单列表
      {
        path: 'order/:id',
        component: () => import('../views/client/user/UserOrderDetail.vue'),
        meta: { title: '订单详情' },
      }, // 用户订单详情
    ],
  }, // 用户布局
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
  // 1. 获取目标页面的 title，如果没有就用默认的
  const pageTitle = to.meta.title as string
  const siteName = '联想商城'

  // 2. 修改 document.title
  if (pageTitle) {
    document.title = `${pageTitle} - ${siteName}`
  } else {
    document.title = siteName
  }

  next() // 放行，必须调用
})

export default router
