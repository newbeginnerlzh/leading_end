<!-- 结算页：展示购物车条目、收货地址选择、订单概要并创建订单（调用 mock API） -->
<template>
  <div class="order-settlement">
    <div style="margin-bottom:12px">
      <el-button type="text" :icon="ArrowLeft" @click="router.back()">返回</el-button>
    </div>
    <el-row :gutter="20">
      <el-col :span="16">
        <el-card>
          <h3>购物清单</h3>
          <div class="checkout-cart-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <div>我的购物车（已选 {{ selectedCount }} 件）</div>
            <div style="color:#999">共 {{ items.length }} 个条目</div>
          </div>
          <el-table :data="items" style="width:100%">
            <el-table-column label="商品信息" min-width="400">
              <template #default="{ row }">
                <div class="product-info">
                  <img :src="row.imgUrl" class="product-img" alt="Product" />
                  <div class="product-detail">
                    <div class="product-name">{{ row.name }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="单价" width="150" align="center">
              <template #default="{ row }">
                <span class="price">¥{{ (row.price || 0).toFixed(2) }}</span>
              </template>
            </el-table-column>

            <el-table-column label="数量" width="200" align="center">
              <template #default="{ row }">
                <div class="quantity-control">
                  <el-button size="small" @click="decreaseQuantity(row)">-</el-button>
                  <span class="quantity-text">{{ row.count }}</span>
                  <el-button size="small" @click="increaseQuantity(row)">+</el-button>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="小计" width="150" align="center">
              <template #default="{ row }">
                <span class="subtotal">¥{{ (row.price * row.count).toFixed(2) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card style="margin-top:16px">
          <h3>收货信息</h3>
          <div v-if="addresses.length === 0" style="color:#999">
            暂无收货地址，前往
            <router-link to="/user/address">地址管理</router-link>
          </div>
          <div v-else>
            <el-form :model="address" label-width="80px" size="small">
              <el-form-item label="选择地址">
                <el-select v-model="selectedAddressId" placeholder="请选择收货地址" style="width:100%" @change="onAddressChange">
                  <el-option v-for="a in addresses" :key="a.id" :label="a.name + ' - ' + a.phone + ' - ' + a.address" :value="a.id" />
                </el-select>
              </el-form-item>
              <el-form-item label="收件人">
                <el-input v-model="address.name" placeholder="姓名" />
              </el-form-item>
              <el-form-item label="手机号">
                <el-input v-model="address.phone" placeholder="手机号码" />
              </el-form-item>
              <el-form-item label="地址">
                <el-input v-model="address.address" placeholder="详细地址" />
              </el-form-item>
            </el-form>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card>
          <h3>订单概要</h3>
          <div style="margin-bottom:12px">商品总计： <strong>¥{{ total.toFixed(2) }}</strong></div>

          <el-form label-width="90px" size="small">
            <el-form-item label="运费">
              <el-select v-model="shipping" placeholder="请选择" style="width:100%">
                <el-option label="快递 10.00 元" :value="10" />
                <el-option label="包邮（满 199）" :value="0" />
              </el-select>
            </el-form-item>

            <el-form-item label="支付方式">
              <el-radio-group v-model="payment">
                <el-radio label="alipay">支付宝</el-radio>
                <el-radio label="wechat">微信</el-radio>
                <el-radio label="cod">货到付款</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="createOrder">生成订单并支付</el-button>
            </el-form-item>
          </el-form>

          <div style="margin-top:12px;color:#666">
            <div>运费：¥{{ shipping.toFixed(2) }}</div>
            <div style="margin-top:8px">应付总额：<strong>¥{{ (total + shipping).toFixed(2) }}</strong></div>
          </div>
        </el-card>

        <el-card style="margin-top:16px">
          <h4>示例操作</h4>
          <div style="font-size:13px;color:#666">点击“生成订单并支付”会把订单通过封装的 API（mock）创建，并跳转到支付页。</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 结算页不在此展示订单详情，创建订单后跳转到支付页 -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { createOrder as apiCreateOrder } from '@/api/order'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { ArrowLeft } from '@element-plus/icons-vue'

const cart = useCartStore()
// 支持两种结算模式：
// - 直接购买（direct_purchase 存在于 localStorage）：使用临时项，不影响购物车
// - 购物车结算：使用 cart.selectedItems
import { ref as _ref } from 'vue'
const directItems = _ref<any[] | null>(null)
const items = computed(() => {
  return (directItems.value && directItems.value.length > 0) ? directItems.value : cart.selectedItems
})

// 地址管理：从 localStorage 中读取 mock_addresses（示例格式：[{ id, name, phone, address }])
const addresses = ref<{ id: number; name: string; phone: string; address: string }[]>([])
const selectedAddressId = ref<number | null>(null)
const address = ref({ name: '', phone: '', address: '' })

const shipping = ref<number>(10)
const payment = ref<string>('alipay')

// 不在结算页展示订单详情；创建后跳转到支付页
const router = useRouter()

const total = computed(() => cart.selectedTotalPrice)
const selectedCount = computed(() => cart.selectedTotalCount)

onMounted(() => {
  try {
    // 读取直购临时数据（若存在）
    try {
      const rawDirect = localStorage.getItem('direct_purchase')
      if (rawDirect) {
        const parsed = JSON.parse(rawDirect)
        if (Array.isArray(parsed) && parsed.length > 0) {
          directItems.value = parsed
        }
        // 读取后移除，避免重复使用
        localStorage.removeItem('direct_purchase')
      }
    } catch (err) {
      // ignore parsing errors
    }

    const rawAddr = localStorage.getItem('mock_addresses')
    const addr = rawAddr ? JSON.parse(rawAddr) : []

    //begin:if (Array.isArray(addr) && addr.length > 0) {

    if (!Array.isArray(addr) || addr.length === 0) {
      // 如果没有地址，写入一个虚拟地址便于测试
      const demo = [{ id: 1, name: '测试用户', phone: '13800138000', address: '北京市朝阳区示例路1号' }]
      try {
        localStorage.setItem('mock_addresses', JSON.stringify(demo))
      } catch (e) {
        // ignore
      }
      addresses.value = demo
      const first = demo[0]!
      selectedAddressId.value = first.id
      address.value = { name: first.name, phone: first.phone, address: first.address }
    } else {

      //end:if (Array.isArray(addr) && addr.length > 0) {

      addresses.value = addr
      selectedAddressId.value = addr[0].id
      address.value = { name: addr[0].name || '', phone: addr[0].phone || '', address: addr[0].address || '' }
    }
  } catch (e) {
    // ignore
  }
})

function decreaseQuantity(item: any) {
  if (!item) return
  if ((item.count ?? 1) <= 1) return
  if (directItems.value && directItems.value.length > 0) {
    const idx = directItems.value.findIndex((i: any) => i.skuId === item.skuId)
    if (idx !== -1) {
      directItems.value[idx].count = (directItems.value[idx].count ?? 1) - 1
    }
  } else {
    cart.updateQuantity(item.skuId, (item.count ?? 1) - 1)
  }
}

function increaseQuantity(item: any) {
  if (!item) return
  if (directItems.value && directItems.value.length > 0) {
    const idx = directItems.value.findIndex((i: any) => i.skuId === item.skuId)
    if (idx !== -1) {
      directItems.value[idx].count = (directItems.value[idx].count ?? 1) + 1
    }
  } else {
    cart.updateQuantity(item.skuId, (item.count ?? 1) + 1)
  }
}

function onAddressChange(id: number) {
  const found = addresses.value.find((a) => a.id === id)
  if (found) {
    address.value = { name: found.name, phone: found.phone, address: found.address }
  }
}

async function createOrder() {
  if (!items.value || items.value.length === 0) {
    ElMessage.warning('请选择至少一件商品进行结算')
    return
  }
  if (!address.value.name || !address.value.phone || !address.value.address) {
    ElMessage.warning('请填写完整收货信息')
    return
  }

  try {
    if (!selectedAddressId.value) {
      ElMessage.warning('请先选择收货地址或前往地址管理添加地址')
      return
    }

    const payload = {
      addressId: selectedAddressId.value,
      // 传递完整的 item 信息（回退字段 name/price/imgUrl/productId），保证 createOrder 能保存正确的数据
      items: items.value.map((it: any) => ({
        skuId: it.skuId,
        count: it.count,
        name: it.name,
        price: it.price,
        imgUrl: it.imgUrl,
        productId: it.productId,
      })),
      remark: '',
    }

    const created = await apiCreateOrder(payload)
    ElMessage.success('订单已通过 API 创建（mock），即将跳转到支付页')
    // 下单成功后：不在此处删除购物车项，支付成功后由支付页统一清理。
    router.push({ path: '/payment', query: { orderId: (created as any).orderId || (created as any).id } })
  } catch (e) {
    ElMessage.error('创建订单失败：' + (e as Error).message)
  }
}
</script>

<style scoped>
.order-settlement h3 { margin: 0 0 12px 0 }

/* 使用与购物车页面一致的商品信息样式 */
.product-info {
  display: flex;
  gap: 15px;
  text-align: left;
  align-items: center;
}

.product-img {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #eee;
  flex-shrink: 0;
}

.product-detail {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.product-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  line-height: 1.4;
}

.product-specs {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
</style>
