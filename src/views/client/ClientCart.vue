<script setup lang="ts">
import { useCartStore, type CartItem } from '@/stores/cart'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Minus, Plus } from '@element-plus/icons-vue'

const cartStore = useCartStore()
const router = useRouter()

// 跳转到商品详情
const goToDetail = (productId: number, skuId: number) => {
  router.push({
    path: `/product/${productId}`,
    query: { skuId: String(skuId) },
  })
}

// 删除商品
const handleDelete = async (skuId: number) => {
  try {
    await cartStore.removeFromCart(skuId)
    ElMessage.success('商品已删除')
  } catch {
    ElMessage.error('删除失败，请重试')
  }
}

// 删除所选项
const handleClear = async () => {
  try {
    if (cartStore.isAllSelected == true) {
      await ElMessageBox.confirm('清空后无法恢复', '确定要清空购物车吗', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
      await cartStore.clearCart()
      ElMessage.success('购物车已清空')
    } else {
      await ElMessageBox.confirm('清空后无法恢复', '确定要删除这几项吗', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
      await cartStore.batchRemoveFromCart()
      ElMessage.success('已删除所选项')
    }
  } catch (error: unknown) {
    // 如果 error.message 存在，说明是 API 错误，而非用户取消
    if (error && typeof error === 'object' && 'message' in error) {
      ElMessage.error('删除失败，请重试')
    }
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
const decreaseQuantity = async (item: CartItem) => {
  if (item.count <= 1) {
    ElMessage.warning('最低限购一件！')
    return
  }
  try {
    await cartStore.updateQuantity(item.skuId, item.count - 1)
  } catch {
    ElMessage.error('更新数量失败，请重试')
  }
}

const increaseQuantity = async (item: CartItem) => {
  try {
    await cartStore.updateQuantity(item.skuId, item.count + 1)
  } catch {
    ElMessage.error('更新数量失败，请重试')
  }
}

// 单个商品选中状态变更
const handleSelectionChange = async (skuId: number, val: boolean) => {
  try {
    await cartStore.updateSelection(skuId, val)
  } catch {
    ElMessage.error('更新选中状态失败，请重试')
  }
}

// 全选/取消全选
const handleSelectAllChange = async (val: boolean | string | number) => {
  try {
    await cartStore.toggleSelectAll(val as boolean)
  } catch {
    ElMessage.error('操作失败，请重试')
  }
}
// 格式化价格：整数时不显示小数
const formatPrice = (price: number) => {
  return Number.isInteger(price) ? price.toString() : price.toFixed(2)
}
</script>

<template>
  <div class="cart-page">
    <div class="page-header">
      <h2>购物车</h2>
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
              <el-checkbox
                :model-value="row.selected"
                @change="(val: boolean) => handleSelectionChange(row.skuId, val as boolean)"
              />
            </template>
          </el-table-column>

          <el-table-column label="商品信息" min-width="400" align="center">
            <template #default="{ row }">
              <div class="product-info" @click="goToDetail(row.productId, row.skuId)">
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
              <span class="subtotal">¥{{ formatPrice(row.price * row.count) }}</span>
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
            <el-button
              link
              type="danger"
              @click="handleClear"
              style="margin-left: 20px"
              :disabled="cartStore.selectedTotalCount === 0"
            >
              删除所选项
            </el-button>
          </div>
          <div class="footer-right">
            <div class="price-info">
              <div class="total-price-row">
                总计：<span class="total-price"
                  >￥{{ formatPrice(cartStore.selectedTotalPrice) }}</span
                >
              </div>
              <div class="selected-count-row">
                已选择<span class="count-highlight">{{ cartStore.selectedTotalCount }}</span
                >件商品
              </div>
            </div>
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
  text-align: left; /* product-name靠左显示 */
  align-items: center; /* 图片垂直居中 */
}

.product-info:hover {
  opacity: 0.8;
}

.product-img {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #eee;
  flex-shrink: 0; /* 防止图片被压缩 */
}

.product-detail {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.product-name {
  font-size: 16px; /* 已经是16px */
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
  font-size: 12px; /* 调大 2px */
}

.price {
  font-size: 16px; /* 调大 2px */
  color: #333;
  font-weight: 500;
}

.subtotal {
  font-size: 16px; /* 调大 2px */
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

.footer-left {
  display: flex;
  align-items: center;
  padding-left: 20px; /* 与表格选择框列左侧padding对齐 */
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.price-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end; /* 右对齐 */
}

.total-price-row {
  font-size: 16px;
  color: #333;
  font-weight: 500;
}

.selected-count-row {
  font-size: 14px;
  color: #666;
}

.count-highlight {
  color: #e4393c; /* 数字着色为红色 */
  font-weight: bold;
  margin: 0 2px;
}

.total-label {
  font-size: 14px;
  color: #666;
}

.total-price {
  font-size: 20px; /* 调大 */
  color: #e4393c;
  font-weight: bold;
}

.checkout-btn {
  width: 150px; /* 增大宽度 */
  height: 48px; /* 增加高度 */
  background-color: #e4393c;
  border-color: #e4393c;
  font-size: 18px; /* 去结算按钮字体调大 */
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
