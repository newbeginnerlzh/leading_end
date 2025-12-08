<!-- 结算页：展示购物车条目、收货地址选择、订单概要并创建订单（调用 mock API） -->
<template>
  <div class="order-settlement">
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
                  <span class="quantity-text">{{ row.qty }}</span>
                  <el-button size="small" @click="increaseQuantity(row)">+</el-button>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="小计" width="150" align="center">
              <template #default="{ row }">
                <span class="subtotal">¥{{ (row.price * row.qty).toFixed(2) }}</span>
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
import { reactive, ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { createOrder as apiCreateOrder } from '@/api/order'
import { useRouter } from 'vue-router'

interface CartItem {
  id: number
  name: string
  price: number
  imgUrl: string
  qty: number
}

const items = reactive<CartItem[]>([])

// 地址管理：从 localStorage 中读取 mock_addresses（示例格式：[{ id, name, phone, address }])
const addresses = ref<{ id: number; name: string; phone: string; address: string }[]>([])
const selectedAddressId = ref<number | null>(null)
const address = reactive({ name: '', phone: '', address: '' })

const shipping = ref<number>(10)
const payment = ref<string>('alipay')

// 不在结算页展示订单详情；创建后跳转到支付页
const router = useRouter()

const total = computed(() => items.reduce((s, it) => s + it.price * it.qty, 0))
const selectedCount = computed(() => items.reduce((s, it) => s + (it.qty || 0), 0))

onMounted(() => {
  // 从 localStorage 加载购物车
  try {
    const raw = localStorage.getItem('mock_cart')
    const cart = raw ? JSON.parse(raw) : null
    if (Array.isArray(cart) && cart.length > 0) {
      // 只加入被勾选的商品。兼容 pinia 存储字段名：skuId/productId/id, count/qty, selected
      cart.forEach((c: any) => {
        const selected = typeof c.selected !== 'undefined' ? c.selected : true
        if (!selected) return
        const id = c.skuId ?? c.id ?? c.productId
        const qty = c.count ?? c.qty ?? 1
        items.push({ id, name: c.name || c.title || '商品', price: c.price || 0, imgUrl: c.imgUrl || c.mainImage || 'https://via.placeholder.com/120', qty })
      })
    } else {
      // fallback 示例
      items.push({ id: 1001, name: '示例商品 A', price: 1299, imgUrl: 'https://via.placeholder.com/120', qty: 1 })
    }

    const rawAddr = localStorage.getItem('mock_addresses')
    const addr = rawAddr ? JSON.parse(rawAddr) : []
    if (Array.isArray(addr) && addr.length > 0) {
      addresses.value = addr
      selectedAddressId.value = addr[0].id
      address.name = addr[0].name || ''
      address.phone = addr[0].phone || ''
      address.address = addr[0].address || ''
    }
  } catch (e) {
    // ignore
  }
})

function recalc() {
  // 触发响应
}

function removeItem(id: number) {
  const idx = items.findIndex((i) => i.id === id)
  if (idx >= 0) items.splice(idx, 1)
}

function decreaseQuantity(item: any) {
  if (item.qty <= 1) return
  const idx = items.findIndex((i) => i.id === item.id)
  if (idx >= 0) {
    const o = items[idx]
    if (o) o.qty = o.qty - 1
  }
}

function increaseQuantity(item: any) {
  const idx = items.findIndex((i) => i.id === item.id)
  if (idx >= 0) {
    const o = items[idx]
    if (o) o.qty = o.qty + 1
  }
}

function clearCart() {
  items.splice(0, items.length)
  try {
    localStorage.removeItem('mock_cart')
  } catch (e) {
    void e
  }
}

function onAddressChange(id: number) {
  const found = addresses.value.find((a) => a.id === id)
  if (found) {
    address.name = found.name
    address.phone = found.phone
    address.address = found.address
  }
}

async function createOrder() {
  if (items.length === 0) {
    ElMessage.warning('购物车为空，无法生成订单')
    return
  }
  if (!address.name || !address.phone || !address.address) {
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
      items: items.map((it) => ({ skuId: it.id, count: it.qty })),
      remark: '',
    }

    const created = await apiCreateOrder(payload)
    ElMessage.success('订单已通过 API 创建（mock），即将跳转到支付页')
    try { localStorage.removeItem('mock_cart') } catch (e) { void e }
    router.push({ path: '/payment', query: { orderId: (created as any).orderId || (created as any).id } })
  } catch (e) {
    ElMessage.error('创建订单失败：' + (e as Error).message)
  }
}
</script>

<style scoped>
.order-settlement h3 { margin: 0 0 12px 0 }
</style>
