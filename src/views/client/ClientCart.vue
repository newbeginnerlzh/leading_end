<script setup lang="ts">
import { useCartStore, type CartItem } from '@/stores/cart'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Minus, Plus } from '@element-plus/icons-vue'

const cartStore = useCartStore()
const router = useRouter()

// 跳转到商品详情
const goToDetail = (productId: number) => {
  router.push(`/product/${productId}`)
}

// 删除商品
const handleDelete = (skuId: number) => {
  cartStore.removeFromCart(skuId)
  ElMessage.success('商品已删除')
}

// 清空购物车
const handleClear = async () => {
  try {
    await ElMessageBox.confirm('确定要清空购物车吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    cartStore.clearCart()
    ElMessage.success('购物车已清空')
  } catch {
    // 取消操作
  }
}

// 结算
const handleCheckout = () => {
  if (cartStore.selectedTotalCount === 0) {
    ElMessage.warning('请至少选择一件商品')
    return
  }
  router.push('/checkout')
}

// 数量变更逻辑
const decreaseQuantity = (item: CartItem) => {
  if (item.count <= 1) {
    ElMessage.warning('最低限购一件！')
    return
  }
  cartStore.updateQuantity(item.skuId, item.count - 1)
}

const increaseQuantity = (item: CartItem) => {
  cartStore.updateQuantity(item.skuId, item.count + 1)
}

// 全选/取消全选
const handleSelectAllChange = (val: boolean | string | number) => {
  cartStore.toggleSelectAll(val as boolean)
}
</script>

<template>
  <div class="cart-page">
    <div class="page-header">
      <h2>我的购物车</h2>
      <span class="item-count">共 {{ cartStore.totalCount }} 件商品</span>
    </div>

    <!-- 空状态 -->
    <div v-if="cartStore.items.length === 0" class="empty-cart">
      <el-empty description="购物车空空如也">
        <el-button type="primary" @click="router.push('/')">去购物</el-button>
      </el-empty>
    </div>

    <!-- 购物车列表 -->
    <div v-else class="cart-content">
      <el-card shadow="never" class="cart-card">
        <el-table :data="cartStore.items" style="width: 100%">
          <!-- 选择框 -->
          <el-table-column width="55" align="center">
            <template #default="{ row }">
              <el-checkbox v-model="row.selected" />
            </template>
          </el-table-column>

          <el-table-column label="商品信息" min-width="400">
            <template #default="{ row }">
              <div class="product-info" @click="goToDetail(row.productId)">
                <img :src="row.imgUrl" class="product-img" alt="Product" />
                <div class="product-detail">
                  <div class="product-name">{{ row.name }}</div>
                  <div class="product-specs">
                    <el-tag
                      v-for="(val, key) in row.specs"
                      :key="key"
                      size="small"
                      type="info"
                      class="spec-tag"
                    >
                      {{ key }}: {{ val }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="单价" width="150" align="center">
            <template #default="{ row }">
              <span class="price">¥{{ row.price }}</span>
            </template>
          </el-table-column>

          <el-table-column label="数量" width="200" align="center">
            <template #default="{ row }">
              <div class="quantity-control">
                <el-button size="small" :icon="Minus" @click="decreaseQuantity(row)" />
                <span class="quantity-text">{{ row.count }}</span>
                <el-button size="small" :icon="Plus" @click="increaseQuantity(row)" />
              </div>
            </template>
          </el-table-column>

          <el-table-column label="小计" width="150" align="center">
            <template #default="{ row }">
              <span class="subtotal">¥{{ (row.price * row.count).toFixed(2) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="100" align="center">
            <template #default="{ row }">
              <el-popconfirm
                title="确定删除该商品吗？"
                confirm-button-text="删除"
                cancel-button-text="取消"
                confirm-button-type="danger"
                placement="left"
                width="200"
                hide-icon
                @confirm="handleDelete(row.skuId)"
              >
                <template #reference>
                  <el-button type="danger" link>删除</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>

        <div class="cart-footer">
          <div class="footer-left">
            <el-checkbox :model-value="cartStore.isAllSelected" @change="handleSelectAllChange">
              全选
            </el-checkbox>
            <el-button link type="danger" @click="handleClear" style="margin-left: 20px">
              清空购物车
            </el-button>
          </div>
          <div class="footer-right">
            <span class="total-label">已选 {{ cartStore.selectedTotalCount }} 件，总价：</span>
            <span class="total-price">¥{{ cartStore.selectedTotalPrice.toFixed(2) }}</span>
            <el-button
              type="primary"
              size="large"
              class="checkout-btn"
              :disabled="cartStore.selectedTotalCount === 0"
              @click="handleCheckout"
            >
              去结算
            </el-button>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.cart-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: baseline;
  margin-bottom: 20px;
  gap: 10px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.item-count {
  color: #999;
  font-size: 14px;
}

.cart-card {
  border-radius: 8px;
}

.product-info {
  display: flex;
  gap: 15px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.product-info:hover {
  opacity: 0.8;
}

.product-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #eee;
}

.product-detail {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.product-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  line-height: 1.4;
}

.product-specs {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.spec-tag {
  font-size: 12px;
}

.price {
  color: #333;
  font-weight: 500;
}

.subtotal {
  color: #e4393c;
  font-weight: bold;
}

.cart-footer {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.total-label {
  font-size: 14px;
  color: #666;
}

.total-price {
  font-size: 24px;
  color: #e4393c;
  font-weight: bold;
}

.checkout-btn {
  width: 120px;
  background-color: #e4393c;
  border-color: #e4393c;
}

.quantity-control {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.quantity-text {
  width: 30px;
  text-align: center;
  font-size: 14px;
}

.empty-cart {
  padding: 40px 0;
}
</style>
