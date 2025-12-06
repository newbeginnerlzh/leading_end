<!-- 结算页：显示购物车条目、收货信息、支付方式，生成订单并保存到 localStorage -->
<template>
  <div class="order-settlement">
    <el-row :gutter="20">
      <el-col :span="16">
        <el-card>
          <h3>购物清单</h3>
          <el-table :data="items" border style="width: 100%" size="small">
            <el-table-column prop="imgUrl" label="" width="80">
              <template #default="{ row }">
                <img :src="row.imgUrl" alt="img" style="width:60px;height:60px;object-fit:cover;border-radius:4px" />
              </template>
            </el-table-column>
            <el-table-column prop="name" label="商品" />
            <el-table-column prop="price" label="单价(¥)" width="120">
              <template #default="{ row }">{{ row.price.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column label="数量" width="140">
              <template #default="{ row }">
                <el-input-number v-model="row.qty" :min="1" :max="999" size="small" @change="recalc" />
              </template>
            </el-table-column>
            <el-table-column label="小计(¥)" width="140">
              <template #default="{ row }">{{ (row.price * row.qty).toFixed(2) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button type="text" size="small" @click="removeItem(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card style="margin-top:16px">
          <h3>收货信息</h3>
          <el-form :model="address" label-width="80px" size="small">
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
              <el-button type="primary" @click="createOrder">生成订单</el-button>
              <el-button @click="clearCart" style="margin-left:8px">清空购物车</el-button>
            </el-form-item>
          </el-form>

          <div style="margin-top:12px;color:#666">
            <div>运费：¥{{ shipping.toFixed(2) }}</div>
            <div style="margin-top:8px">应付总额：<strong>¥{{ (total + shipping).toFixed(2) }}</strong></div>
          </div>
        </el-card>

        <el-card style="margin-top:16px">
          <h4>示例操作</h4>
          <div style="font-size:13px;color:#666">点击“生成订单”会把订单保存到 `localStorage` 的 <code>mock_orders</code> 键。</div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog title="订单已生成" :model-value="showOrderDialog" width="60%" @close="showOrderDialog = false">
      <pre style="white-space:pre-wrap;word-break:break-word">{{ lastOrderJson }}</pre>
      <template #footer>
        <el-button @click="copyOrder">复制订单 JSON</el-button>
        <el-button type="primary" @click="showOrderDialog = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
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

const items = reactive<CartItem[]>([
  { id: 1001, name: '游戏本 LEGION Y9000', price: 12999, imgUrl: 'https://via.placeholder.com/120', qty: 1 },
  { id: 1002, name: '机械键盘 K100', price: 499, imgUrl: 'https://via.placeholder.com/120', qty: 2 },
])

const address = reactive({ name: '', phone: '', address: '' })
const shipping = ref<number>(10)
const payment = ref<string>('alipay')

const showOrderDialog = ref(false)
const lastOrderJson = ref('')
const router = useRouter()

const total = computed(() => items.reduce((s, it) => s + it.price * it.qty, 0))

function recalc() {
  // 只触发响应更新
}

function removeItem(id: number) {
  const idx = items.findIndex((i) => i.id === id)
  if (idx >= 0) items.splice(idx, 1)
}

function clearCart() {
  items.splice(0, items.length)
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
    const payload = {
      address: { ...address },
      payment: payment.value,
      shipping: shipping.value,
      items: items.map((it) => ({ id: it.id, name: it.name, price: it.price, qty: it.qty, imgUrl: it.imgUrl })),
      remark: '',
    }

    const created = await apiCreateOrder(payload)
    lastOrderJson.value = JSON.stringify(created, null, 2)
    // 跳转到支付页，携带 orderId
    ElMessage.success('订单已通过 API 创建（mock），即将跳转到支付页')
    router.push({ path: '/payment', query: { orderId: created.id } })
  } catch (e) {
    ElMessage.error('创建订单失败：' + (e as Error).message)
  }
}

function copyOrder() {
  if (!lastOrderJson.value) return
  navigator.clipboard?.writeText(lastOrderJson.value).then(() => {
    ElMessage.success('已复制到剪贴板')
  }, () => {
    ElMessage.warning('复制失败，请手动复制')
  })
}
</script>

<style scoped>
.order-settlement h3 { margin: 0 0 12px 0 }
.order-settlement pre { background:#f5f7fa;padding:12px;border-radius:6px;max-height:360px;overflow:auto }
</style>
