<!-- 结算页：展示购物车条目、收货地址选择、订单概要并创建订单 -->
<template>
  <div class="modern-settlement-page">
    <!-- Header -->
    <div class="page-header" v-scroll-reveal>
      <h2 class="page-title">订单结算</h2>
      <span class="step-indicator">确认订单</span>
    </div>

    <div class="settlement-container loading-state" v-if="pageLoading">
      <div class="loading-overlay">
        <div class="loading-badge">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>正在加载订单信息...</span>
        </div>
      </div>
      <div class="main-content">
        <div class="section-card">
          <el-skeleton :rows="3" animated />
        </div>
        <div class="section-card">
          <el-skeleton :rows="5" animated />
        </div>
      </div>
      <div class="sidebar-content">
        <div class="section-card">
          <el-skeleton :rows="8" animated />
        </div>
      </div>
    </div>

    <div class="settlement-container" v-else>
      <!-- Left Column: Address & Items -->
      <div class="main-content">
        <!-- Address Section -->
        <section class="section-card address-card" v-scroll-reveal>
          <div class="section-header">
            <h3>收货地址</h3>
            <button class="text-btn" @click="openAddressSelectModal">切换</button>
          </div>

          <div v-if="!address.name" class="empty-address" @click="openModal">
            <div class="add-icon">+</div>
            <span>添加收货地址</span>
          </div>

          <div v-else class="address-content">
            <div class="address-icon">📍</div>
            <div class="address-info">
              <div class="user-row">
                <span class="name">{{ address.name }}</span>
                <span class="phone">{{ address.phone }}</span>
              </div>
              <div class="detail-row">{{ address.address }}</div>
            </div>
            <button class="edit-btn" @click="openModal">编辑</button>
          </div>
        </section>

        <!-- Items Section -->
        <section class="section-card items-card" v-scroll-reveal>
          <div class="section-header">
            <h3>商品清单 ({{ items.length }})</h3>
          </div>

          <!-- List Header -->
          <div class="list-header">
            <div class="col-product">商品信息</div>
            <div class="col-price">单价</div>
            <div class="col-quantity">数量</div>
            <div class="col-subtotal">小计</div>
          </div>

          <div class="items-list">
            <div
              v-for="(item, index) in items"
              :key="index"
              class="settlement-item"
              :style="{ animationDelay: `${index * 50}ms` }"
            >
              <!-- Product Info -->
              <div class="col-product">
                <div class="img-wrapper">
                  <img :src="item.imgUrl" alt="Product" />
                </div>
                <div class="info-wrapper">
                  <div class="name">{{ item.name }}</div>
                  <!-- Specs if available -->
                  <div class="specs" v-if="item.spec">
                    <span class="spec-tag">{{ item.spec }}</span>
                  </div>
                </div>
              </div>

              <!-- Price -->
              <div class="col-price">
                <span class="unit-price">¥{{ (item.price || 0).toFixed(2) }}</span>
              </div>

              <!-- Quantity -->
              <div class="col-quantity">
                <span class="qty-display">x{{ item.count }}</span>
              </div>

              <!-- Subtotal -->
              <div class="col-subtotal">
                <span class="price-val">¥{{ ((item.price || 0) * (item.count || 1)).toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- Right Column: Summary & Payment -->
      <div class="sidebar-content">
        <section class="section-card summary-card" v-scroll-reveal>
          <h3>订单摘要</h3>

          <div class="summary-row">
            <span>商品总额</span>
            <span class="val">¥{{ total.toFixed(2) }}</span>
          </div>
          <div class="summary-row">
            <span>运费</span>
            <span class="val">{{ shipping === 0 ? '包邮' : `¥${shipping.toFixed(2)}` }}</span>
          </div>

          <div class="divider"></div>

          <div class="summary-total">
            <span>应付总额</span>
            <span class="total-val">¥{{ (total + shipping).toFixed(2) }}</span>
          </div>

          <!-- Payment Method -->
          <div class="payment-method">
            <h4>支付方式</h4>
            <div class="payment-options">
              <label class="payment-option" :class="{ active: payment === 'alipay' }">
                <input type="radio" v-model="payment" value="alipay" />
                <span class="radio-mark"></span>
                <span>支付宝</span>
              </label>
              <label class="payment-option" :class="{ active: payment === 'wechat' }">
                <input type="radio" v-model="payment" value="wechat" />
                <span class="radio-mark"></span>
                <span>微信支付</span>
              </label>
              <label class="payment-option" :class="{ active: payment === 'cod' }">
                <input type="radio" v-model="payment" value="cod" />
                <span class="radio-mark"></span>
                <span>货到付款</span>
              </label>
            </div>
          </div>

          <!-- Remark -->
          <div class="remark-section">
            <h4>买家留言</h4>
            <textarea
              v-model="buyerRemark"
              class="custom-textarea"
              placeholder="给卖家的留言（选填）..."
              rows="3"
              maxlength="200"
            ></textarea>
          </div>

          <!-- Action -->
          <div class="action-area">
            <div class="beam-container">
              <div class="beam-border"></div>
              <button class="primary-btn-beam full-width" @click="createOrder">提交订单</button>
            </div>
            <button class="text-btn back-btn" @click="router.back()">返回</button>
          </div>
        </section>
      </div>
    </div>

    <!-- Dialogs (Keeping Element Plus for complex forms) -->
    <el-dialog
      v-model="modalVisible"
      title="编辑地址"
      width="500px"
      :close-on-click-modal="false"
      :modal-append-to-body="true"
      :destroy-on-close="false"
      center
      class="custom-dialog"
    >
      <el-form
        :model="modalAddressForm"
        :rules="modalRules"
        ref="modalFormRef"
        label-position="top"
        class="custom-form"
      >
        <el-form-item label="收件人" prop="name">
          <el-input v-model="modalAddressForm.name" placeholder="姓名" />
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input v-model="modalAddressForm.phone" placeholder="手机号" />
        </el-form-item>

        <el-form-item label="所在地区" prop="province">
          <el-cascader
            v-model="regionValue"
            :options="regionOptions"
            :props="{ value: 'code', label: 'name', children: 'children' }"
            @change="handleModalRegionChange"
            placeholder="选择地区"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="详细地址" prop="detail">
          <el-input v-model="modalAddressForm.detail" placeholder="街道、楼牌号等" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <button class="cancel-btn" @click="modalVisible = false">取消</button>
          <button
            v-if="isModalModified && !matchesExisting"
            class="secondary-btn"
            @click="saveModalAsNewAddress"
          >
            保存为新地址
          </button>
          <button class="confirm-btn" @click="applyModalAddress">确认</button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="addressSelectVisible"
      title="选择地址"
      width="600px"
      center
      class="custom-dialog"
    >
      <div class="address-list-container">
        <div
          v-for="addr in rawAddresses"
          :key="addr.id"
          class="address-select-item"
          @click="onAddressSelectFromList(addr)"
        >
          <div class="addr-main">
            <span class="addr-name">{{ addr.name }}</span>
            <span class="addr-phone">{{ addr.phone }}</span>
          </div>
          <div class="addr-detail">
            {{ addr.province }} {{ addr.city }} {{ addr.district }} {{ addr.detail }}
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { createOrdersFromCart, buyNowOrder } from '@/api/order'
import type { AddressInfo } from '@/api/model/userModel'
import { getAddressList, addAddress } from '@/api/user'
import { useRouter, useRoute } from 'vue-router'
import { useCartStore, type CartItem } from '@/stores/cart'

// Scroll Reveal Directive
const vScrollReveal = {
  mounted: (el: HTMLElement) => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add('is-visible')
            observer.unobserve(el)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' },
    )
    observer.observe(el)
  },
}

const cart = useCartStore()
// 支持两种结算模式：
// - 直接购买（direct_purchase 存在于 localStorage）：使用临时项，不影响购物车
// - 购物车结算：使用 cart.selectedItems
import { ref as _ref } from 'vue'
// 直购临时项的最小结构定义，替代 any
interface DirectPurchaseItem {
  specId?: number
  skuId?: number
  id?: number
  price?: number
  count?: number
  quantity?: number
  productName?: string
  name?: string
  mainImage?: string
  imgUrl?: string
  spec?: string // Added for display
}
const directItems = _ref<DirectPurchaseItem[] | null>(null)
const items = computed<DirectPurchaseItem[]>(() => {
  if (directItems.value && directItems.value.length > 0) {
    return directItems.value
  }
  return cart.selectedItems.map((item: CartItem) => ({
    skuId: item.skuId,
    id: item.id,
    name: item.name,
    imgUrl: item.imgUrl,
    price: item.price,
    count: item.count,
    spec: Object.values(item.specs || {}).join(' '),
  }))
})

// 地址管理：从 localStorage 中读取 mock_addresses（示例格式：[{ id, name, phone, address }])
type SimpleAddress = { id: number; name: string; phone: string; address: string }
const addresses = ref<SimpleAddress[]>([])
const selectedAddressId = ref<number | null>(null)
const address = ref<{ name: string; phone: string; address: string }>({
  name: '',
  phone: '',
  address: '',
})

// 弹窗相关
const modalVisible = ref(false)
const addressSelectVisible = ref(false)
const rawAddresses = ref<AddressInfo[]>([])
const modalSelectedAddressId = ref<number | null>(null)
const modalAddressForm = ref<{
  name: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  postal_code: string | null
  isDefault: boolean
}>({
  name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  postal_code: null,
  isDefault: false,
})
const modalOriginal = ref<{
  name?: string
  phone?: string
  province?: string
  city?: string
  district?: string
  detail?: string
} | null>(null)
// 临时结构化地址（用于在未保存地址时保留 province/city/district/detail）
const tempAddress = ref<{
  name?: string
  phone?: string
  province?: string
  city?: string
  district?: string
  detail?: string
} | null>(null)
const regionValue = ref<string[]>([])
interface RegionNode {
  code: string
  name: string
  children?: RegionNode[]
}
const regionOptions = ref<RegionNode[]>([])

// modal 表单引用与校验规则
const modalFormRef = ref()
import type { FormItemRule } from 'element-plus'
const modalRules: Record<string, FormItemRule[]> = {
  name: [{ required: true, message: '请输入收件人', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
  province: [
    {
      validator: (_rule, _value, callback) => {
        if (Array.isArray(regionValue.value) && regionValue.value.length === 3) {
          callback()
        } else {
          callback(new Error('请选择省/市/区'))
        }
      },
      trigger: 'change',
    },
  ],
  detail: [
    { required: true, message: '请输入详细地址', trigger: 'blur' },
    { min: 2, message: '详细地址太短', trigger: 'blur' },
  ],
}

// 提取：刷新并映射地址列表为通用函数，返回原始 list
async function fetchAndMapAddresses(): Promise<AddressInfo[]> {
  try {
    const res = await getAddressList()
    const data = (res as { data?: AddressInfo[] }).data || []
    const list: AddressInfo[] = Array.isArray(data) ? data : []
    rawAddresses.value = list
    const mapped = list
      .map((a) => {
        const addrStr = a.detail
          ? `${a.province || ''} ${a.city || ''} ${a.district || ''} ${a.detail || ''}`.trim()
          : ''
        return { id: a.id!, name: a.name || '', phone: a.phone || '', address: addrStr }
      })
      .filter((x) => typeof x.id === 'number')
    addresses.value = mapped
    return list
  } catch {
    rawAddresses.value = []
    addresses.value = []
    return []
  }
}

async function openAddressSelectModal() {
  if (rawAddresses.value.length === 0) {
    await fetchAndMapAddresses()
  }
  addressSelectVisible.value = true
}

function onAddressSelectFromList(addr: AddressInfo) {
  selectedAddressId.value = addr.id ?? null
  const addrStr = addr.detail
    ? `${addr.province || ''} ${addr.city || ''} ${addr.district || ''} ${addr.detail || ''}`.trim()
    : ''
  address.value = { name: addr.name || '', phone: addr.phone || '', address: addrStr }
  addressSelectVisible.value = false
  ElMessage.success('已切换收货地址')
}

// 导入中国省市区数据并构建级联选项
import areaData from 'china-area-data/data.json'
type RawArea = Record<string, Record<string, string>>
const rawArea = areaData as unknown as RawArea

function buildNodes(parentCode: string): RegionNode[] {
  const map = rawArea[parentCode] || {}
  return Object.entries(map).map(([code, name]) => {
    const children = buildNodes(code)
    return children.length ? { code, name, children } : { code, name }
  })
}
regionOptions.value = buildNodes('86')

function handleModalRegionChange(value: string[]) {
  if (value.length === 3) {
    const provNode = regionOptions.value.find((item) => item.code === value[0])
    const cityNode = provNode?.children?.find((item) => item.code === value[1])
    const distNode = cityNode?.children?.find((item) => item.code === value[2])

    const province = provNode?.name || ''
    const city = cityNode?.name || ''
    const district = distNode?.name || ''

    modalAddressForm.value.province = province
    modalAddressForm.value.city = city
    modalAddressForm.value.district = district
  }
}

// 是否与地址管理里的任一地址一致（用于隐藏“保存为新地址”）
const matchesExisting = computed(() => {
  const modalName = (modalAddressForm.value.name || '').trim()
  const modalPhone = (modalAddressForm.value.phone || '').trim()
  const modalDetail = (modalAddressForm.value.detail || '').trim()

  return rawAddresses.value.some((a) => {
    const rawName = (a.name || '').trim()
    const rawPhone = (a.phone || '').trim()
    if (rawName !== modalName || rawPhone !== modalPhone) return false

    const sameDetail = (a.detail || '').trim() === modalDetail
    const sameRegion =
      (a.province || '') === (modalAddressForm.value.province || '') &&
      (a.city || '') === (modalAddressForm.value.city || '') &&
      (a.district || '') === (modalAddressForm.value.district || '')

    // 如果有省市区信息，需同时匹配省市区与详细地址
    if (a.province || a.city || a.district) {
      return sameDetail && sameRegion
    }

    // 否则仅按详细地址匹配
    return sameDetail
  })
})

const isModalModified = computed(() => {
  const orig = modalOriginal.value
  if (!orig) {
    // 若没有原始值，则根据是否填写判定
    return !!(
      modalAddressForm.value.name ||
      modalAddressForm.value.phone ||
      modalAddressForm.value.detail ||
      (modalAddressForm.value.province &&
        modalAddressForm.value.city &&
        modalAddressForm.value.district)
    )
  }
  return (
    (modalAddressForm.value.name || '') !== (orig.name || '') ||
    (modalAddressForm.value.phone || '') !== (orig.phone || '') ||
    (modalAddressForm.value.detail || '') !== (orig.detail || '') ||
    (modalAddressForm.value.province || '') !== (orig.province || '') ||
    (modalAddressForm.value.city || '') !== (orig.city || '') ||
    (modalAddressForm.value.district || '') !== (orig.district || '')
  )
})

async function applyModalAddress() {
  // 验证表单（必须通过）
  try {
    if (modalFormRef.value) {
      await modalFormRef.value.validate()
    }
  } catch {
    // 验证失败，不关闭弹窗
    return
  }

  // 将弹窗当前显示的地址应用到结算页（不一定保存为新地址）
  if (modalSelectedAddressId.value && !isModalModified.value) {
    // 选中了已有地址并且未修改，直接以该 id 为准
    const found = rawAddresses.value.find((a) => a.id === modalSelectedAddressId.value)
    if (found) {
      selectedAddressId.value = found.id ?? null
      const addrStr = found.detail
        ? `${found.province || ''} ${found.city || ''} ${found.district || ''} ${found.detail || ''}`.trim()
        : ''
      address.value = { name: found.name || '', phone: found.phone || '', address: addrStr }
    }
  } else {
    // 使用弹窗表单的内容作为临时结构化地址（无论是否选择了已有地址但做了修改）
    selectedAddressId.value = null
    const addrStr = modalAddressForm.value.detail
      ? `${modalAddressForm.value.province || ''} ${modalAddressForm.value.city || ''} ${modalAddressForm.value.district || ''} ${modalAddressForm.value.detail || ''}`.trim()
      : ''
    address.value = {
      name: modalAddressForm.value.name || '',
      phone: modalAddressForm.value.phone || '',
      address: addrStr,
    }
    // 保存结构化的临时地址，便于再次打开弹窗时回填 province/city/district/detail
    tempAddress.value = {
      name: modalAddressForm.value.name || '',
      phone: modalAddressForm.value.phone || '',
      province: modalAddressForm.value.province || '',
      city: modalAddressForm.value.city || '',
      district: modalAddressForm.value.district || '',
      detail: modalAddressForm.value.detail || '',
    }
  }

  modalVisible.value = false
}

function findCodesByNames(
  provinceName?: string,
  cityName?: string,
  districtName?: string,
): string[] {
  if (!provinceName) return []
  const provinces = rawArea['86'] || {}
  const provEntry = Object.entries(provinces).find(([, name]) => name === provinceName)
  if (!provEntry) return []
  const provCode = provEntry[0]

  if (!cityName) return [provCode]
  const cities = rawArea[provCode] || {}
  const cityEntry = Object.entries(cities).find(([, name]) => name === cityName)
  if (!cityEntry) return [provCode]
  const cityCode = cityEntry[0]

  if (!districtName) return [provCode, cityCode]
  const districts = rawArea[cityCode] || {}
  const distEntry = Object.entries(districts).find(([, name]) => name === districtName)
  if (!distEntry) return [provCode, cityCode]
  const distCode = distEntry[0]

  return [provCode, cityCode, distCode]
}

async function openModal() {
  // 确保 rawAddresses 可用
  if (!rawAddresses.value || rawAddresses.value.length === 0) {
    try {
      const res = await getAddressList()
      const data = (res as { data?: AddressInfo[] }).data || []
      rawAddresses.value = Array.isArray(data) ? data : []
    } catch {
      rawAddresses.value = []
    }
  }
  // 每次打开弹窗时清空下拉的选中项
  modalSelectedAddressId.value = null

  // 如果当前有选中地址，优先用 rawAddresses 的细粒度数据回填 modal 表单
  if (selectedAddressId.value) {
    const found = rawAddresses.value.find((a) => a.id === selectedAddressId.value)
    if (found) {
      modalAddressForm.value.name = found.name || ''
      modalAddressForm.value.phone = found.phone || ''
      modalAddressForm.value.detail = found.detail || ''
      modalAddressForm.value.province = found.province || ''
      modalAddressForm.value.city = found.city || ''
      modalAddressForm.value.district = found.district || ''
      regionValue.value = findCodesByNames(
        modalAddressForm.value.province,
        modalAddressForm.value.city,
        modalAddressForm.value.district,
      )
    } else {
      // 回退到扁平 address
      modalAddressForm.value.name = address.value.name || ''
      modalAddressForm.value.phone = address.value.phone || ''
      modalAddressForm.value.detail = address.value.address || ''
      modalAddressForm.value.province = ''
      modalAddressForm.value.city = ''
      modalAddressForm.value.district = ''
      regionValue.value = []
    }
  } else {
    // 如果之前存在临时的结构化地址，优先回填结构化内容，避免把省市区合并到 detail
    if (tempAddress.value) {
      modalAddressForm.value.name = tempAddress.value.name || ''
      modalAddressForm.value.phone = tempAddress.value.phone || ''
      modalAddressForm.value.detail = tempAddress.value.detail || ''
      modalAddressForm.value.province = tempAddress.value.province || ''
      modalAddressForm.value.city = tempAddress.value.city || ''
      modalAddressForm.value.district = tempAddress.value.district || ''
      regionValue.value = findCodesByNames(
        modalAddressForm.value.province,
        modalAddressForm.value.city,
        modalAddressForm.value.district,
      )
    } else {
      modalAddressForm.value.name = address.value.name || ''
      modalAddressForm.value.phone = address.value.phone || ''
      modalAddressForm.value.detail = address.value.address || ''
      modalAddressForm.value.province = ''
      modalAddressForm.value.city = ''
      modalAddressForm.value.district = ''
      regionValue.value = []
    }
  }

  // 记录当前弹窗原始值，用于判断是否修改
  modalOriginal.value = {
    name: modalAddressForm.value.name,
    phone: modalAddressForm.value.phone,
    province: modalAddressForm.value.province,
    city: modalAddressForm.value.city,
    district: modalAddressForm.value.district,
    detail: modalAddressForm.value.detail,
  }

  modalVisible.value = true
  // 等待 DOM 更新后清除表单的历史验证信息（避免打开时显示旧的错误）
  await nextTick()
  try {
    if (modalFormRef.value) {
      modalFormRef.value.clearValidate()
    }
  } catch {
    // ignore
  }
}

// 订单总额：支持直接购买（directItems）或购物车结算
const total = computed(() => {
  try {
    if (directItems.value && Array.isArray(directItems.value) && directItems.value.length > 0) {
      return directItems.value.reduce(
        (sum: number, it: DirectPurchaseItem) => sum + (it.price || 0) * (it.count || 1),
        0,
      )
    }
  } catch {
    // ignore and fallback
  }
  return cart.selectedTotalPrice
})

// 运费：满 ¥199 包邮，否则固定 ¥10
const shipping = computed(() => (total.value >= 199 ? 0 : 10))
const payment = ref<string>('alipay')
const buyerRemark = ref<string>('')

// 不在结算页展示订单详情；创建后跳转到支付页
const router = useRouter()
const route = useRoute()

type CheckoutMode = 'direct' | 'cart'
const checkoutMode = ref<CheckoutMode>('cart')
const pageLoading = ref(true)

onMounted(async () => {
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
    } catch {
      // ignore parsing errors
    }

    // 根据路由参数或数据判断结算模式
    const qMode = (route.query.mode as string | undefined) || undefined
    if (qMode === 'direct') {
      checkoutMode.value = 'direct'
      if (!directItems.value || directItems.value.length === 0) {
        ElMessage.warning('未检测到直购商品，已切换为购物车结算')
        checkoutMode.value = 'cart'
      }
    } else if (qMode === 'cart') {
      checkoutMode.value = 'cart'
    } else {
      checkoutMode.value = directItems.value && directItems.value.length > 0 ? 'direct' : 'cart'
    }

    // 使用统一的用户地址 API 获取地址列表，保持与 UserAddress.vue 一致
    try {
      const list = await fetchAndMapAddresses()
      // 优先使用用户地址列表中标记为默认的地址
      const defaultRaw = list.find((a) => a.isDefault)
      if (defaultRaw) {
        const addrStr = defaultRaw.detail
          ? `${defaultRaw.province || ''} ${defaultRaw.city || ''} ${defaultRaw.district || ''} ${defaultRaw.detail || ''}`.trim()
          : ''
        selectedAddressId.value = defaultRaw.id ?? null
        address.value = {
          name: defaultRaw.name || '',
          phone: defaultRaw.phone || '',
          address: addrStr,
        }
      } else if (addresses.value.length > 0) {
        const first = addresses.value[0]
        if (first) {
          selectedAddressId.value = first.id
          address.value = { name: first.name, phone: first.phone, address: first.address }
        }
      } else {
        selectedAddressId.value = null
        address.value = { name: '', phone: '', address: '' }
      }
    } catch {
      addresses.value = []
      selectedAddressId.value = null
      address.value = { name: '', phone: '', address: '' }
    }
  } catch {
    // ignore
  } finally {
    // 延迟关闭 Loading，确保数据渲染就绪，避免动画闪烁
    setTimeout(() => {
      pageLoading.value = false
    }, 400)
  }
})

async function saveModalAsNewAddress() {
  // validate basic fields
  if (
    !modalAddressForm.value.name ||
    !modalAddressForm.value.phone ||
    !modalAddressForm.value.detail
  ) {
    ElMessage.warning('请填写完整收货信息后再保存')
    return
  }

  try {
    const payload = {
      name: modalAddressForm.value.name,
      phone: modalAddressForm.value.phone,
      province: modalAddressForm.value.province || '',
      city: modalAddressForm.value.city || '',
      district: modalAddressForm.value.district || '',
      detail: modalAddressForm.value.detail,
      postal_code: null,
      isDefault: false,
    }

    const res = await addAddress(payload)
    const saved = (res as { data?: AddressInfo }).data
    ElMessage.success('地址已保存')

    // 刷新地址列表并选择新保存的地址
    try {
      await fetchAndMapAddresses()
      if (saved && saved.id) {
        selectedAddressId.value = saved.id
        const addrStr = saved?.detail
          ? `${saved.province || ''} ${saved.city || ''} ${saved.district || ''} ${saved.detail || ''}`.trim()
          : ''
        address.value = { name: saved.name || '', phone: saved.phone || '', address: addrStr }
        modalSelectedAddressId.value = saved.id
        // 用结构化字段回填 modal 表单
        modalAddressForm.value.name = saved.name || ''
        modalAddressForm.value.phone = saved.phone || ''
        modalAddressForm.value.detail = saved?.detail || ''
        modalAddressForm.value.province = saved.province || ''
        modalAddressForm.value.city = saved.city || ''
        modalAddressForm.value.district = saved.district || ''
        regionValue.value = findCodesByNames(
          modalAddressForm.value.province,
          modalAddressForm.value.city,
          modalAddressForm.value.district,
        )
        // 更新原始值，并清理临时存储
        modalOriginal.value = {
          name: modalAddressForm.value.name,
          phone: modalAddressForm.value.phone,
          province: modalAddressForm.value.province,
          city: modalAddressForm.value.city,
          district: modalAddressForm.value.district,
          detail: modalAddressForm.value.detail,
        }
        tempAddress.value = null
      }
    } catch {
      console.error('刷新地址列表失败')
    }

    modalVisible.value = false
  } catch {
    console.error('保存地址失败')
    ElMessage.error('保存地址失败')
  }
}

async function createOrder() {
  if (checkoutMode.value === 'cart') {
    if (!items.value || items.value.length === 0) {
      ElMessage.warning('请选择至少一件购物车商品进行结算')
      return
    }
  } else {
    if (!directItems.value || directItems.value.length === 0) {
      ElMessage.warning('未检测到直购商品，无法创建订单')
      return
    }
  }
  if (!address.value.name || !address.value.phone || !address.value.address) {
    ElMessage.warning('请填写完整收货信息')
    return
  }

  try {
    // 如果选中了已保存地址但 address 显示为空或不完整，尝试从原始地址列表中补全（防止用户未点击“确定”导致信息未应用）
    if (
      selectedAddressId.value &&
      !(address.value.name && address.value.phone && address.value.address)
    ) {
      try {
        if (!rawAddresses.value || rawAddresses.value.length === 0) {
          await fetchAndMapAddresses()
        }
        const foundRaw = rawAddresses.value.find((a) => a.id === selectedAddressId.value)
        if (foundRaw) {
          const addrStr = foundRaw.detail
            ? `${foundRaw.province || ''} ${foundRaw.city || ''} ${foundRaw.district || ''} ${foundRaw.detail || ''}`.trim()
            : ''
          address.value = {
            name: foundRaw.name || '',
            phone: foundRaw.phone || '',
            address: addrStr,
          }
        }
      } catch {
        // ignore
      }
    }
    // 支持未保存的临时地址：如果没有 selectedAddressId，就把当前 address 表单作为临时地址传入 API
    if (
      !selectedAddressId.value &&
      !(address.value.name && address.value.phone && address.value.address)
    ) {
      ElMessage.warning('请填写完整收货信息或选择已保存地址')
      return
    }

    // 必须有选中地址（后端创建订单需要 addressId）
    if (!selectedAddressId.value) {
      ElMessage.error('请选择收货地址')
      return
    }

    let created: unknown = null
    if (checkoutMode.value === 'direct') {
      const first = directItems.value?.[0]
      if (!first) {
        ElMessage.error('直购数据为空')
        return
      }
      const specId = (first.skuId ?? first.specId ?? first.id) as number
      const quantity = (first.count ?? first.quantity ?? 1) as number
      try {
        created = await buyNowOrder({
          addressId: selectedAddressId.value!,
          specId,
          quantity,
          buyerRemark: buyerRemark.value || '',
        })
      } catch (err) {
        ElMessage.error('创建直购订单失败：' + (err as Error).message)
        return
      }
    } else {
      const cartItemIds = (items.value as Array<{ id: number }>)
        .map((it) => it.id)
        .filter((id) => typeof id === 'number')
      if (!cartItemIds.length) {
        ElMessage.error('缺少购物车条目ID，无法创建订单')
        return
      }
      try {
        created = await createOrdersFromCart({
          addressId: selectedAddressId.value,
          cartItemIds,
          buyerRemark: buyerRemark.value || null,
        })
        const cartStore = useCartStore()
        cartStore.getCloudCart()
      } catch (err) {
        ElMessage.error('创建购物车订单失败：' + (err as Error).message)
        return
      }
    }

    ElMessage.success('订单已创建，跳转支付页')
    const orderSn = (created as { data?: { orderSn?: string } })?.data?.orderSn || ''
    router.push({ path: '/payment', query: { orderId: orderSn, fromCheckout: '1' } })
  } catch (e) {
    ElMessage.error('创建订单失败：' + (e as Error).message)
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.modern-settlement-page {
  --bg-color: #f8f9fc;
  --card-bg: #ffffff;
  --text-primary: #1a1b25;
  --text-secondary: #5e6c84;
  --text-tertiary: #94a3b8;
  --accent-color: #4f46e5;
  --accent-gradient: linear-gradient(135deg, #4f46e5, #9333ea);
  --danger-color: #ef4444;
  --border-color: #e2e8f0;
  --card-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
  --card-hover-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025);

  font-family: 'Inter', sans-serif;
  background-color: var(--bg-color);
  color: var(--text-primary);
  min-height: 100vh;
  padding: 40px 20px;
  box-sizing: border-box;
}

/* --- Animations --- */
@keyframes slideFadeBlurIn {
  0% {
    opacity: 0;
    transform: translateY(20px);
    filter: blur(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}

.page-header,
.section-card,
.settlement-item,
.summary-row,
.summary-total,
.payment-method,
.remark-section,
.action-area {
  animation: slideFadeBlurIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  animation-play-state: paused;
}

/* 当卡片可见时，内部元素开始播放 */
.section-card.is-visible .settlement-item,
.section-card.is-visible .summary-row,
.section-card.is-visible .summary-total,
.section-card.is-visible .payment-method,
.section-card.is-visible .remark-section,
.section-card.is-visible .action-area {
  animation-play-state: running;
}

/* 摘要栏延迟 */
.summary-row:nth-child(2) { animation-delay: 0.1s; } /* h3 is first child? No, h3 is sibling */
.summary-row:nth-child(3) { animation-delay: 0.15s; }
.summary-total { animation-delay: 0.2s; }
.payment-method { animation-delay: 0.25s; }
.remark-section { animation-delay: 0.3s; }
.action-area { animation-delay: 0.35s; }

.is-visible {
  animation-play-state: running;
}

/* --- Header --- */
.page-header {
  max-width: 1200px;
  margin: 0 auto 30px;
  display: flex;
  align-items: baseline;
  gap: 20px;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 15px;
}

.page-title {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.5px;
  margin: 0;
  background: linear-gradient(to right, #1a1b25, #4f46e5);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.step-indicator {
  font-size: 14px;
  font-weight: 600;
  color: var(--accent-color);
  background: #eef2ff;
  padding: 4px 12px;
  border-radius: 99px;
}

/* --- Layout --- */
.settlement-container {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 24px;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--card-shadow);
  transition: all 0.3s ease;
}

.section-card:hover {
  box-shadow: var(--card-hover-shadow);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

/* --- Address Section --- */
.empty-address {
  border: 2px dashed var(--border-color);
  border-radius: 12px;
  padding: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s;
}
.empty-address:hover {
  border-color: var(--accent-color);
  color: var(--accent-color);
  background: #f8fafc;
}
.add-icon {
  font-size: 24px;
  font-weight: 300;
}

.address-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  background: #f8fafc;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
}
.address-icon {
  font-size: 24px;
}
.address-info {
  flex: 1;
}
.user-row {
  display: flex;
  gap: 12px;
  align-items: baseline;
  margin-bottom: 4px;
}
.user-row .name {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}
.user-row .phone {
  font-size: 14px;
  color: var(--text-secondary);
}
.detail-row {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
}
.edit-btn {
  background: none;
  border: none;
  color: var(--accent-color);
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
}

/* --- Items Section --- */
.list-header {
  display: grid;
  grid-template-columns: 4fr 1.5fr 1fr 1.5fr;
  padding: 0 10px 10px;
  font-size: 12px;
  color: var(--text-tertiary);
  font-weight: 600;
  text-transform: uppercase;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 16px;
}
.col-product {
  display: flex;
  gap: 16px;
  align-items: center;
}
.col-price,
.col-quantity,
.col-subtotal {
  text-align: center;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.settlement-item {
  display: grid;
  grid-template-columns: 4fr 1.5fr 1fr 1.5fr;
  align-items: center;
  padding: 10px;
  border-radius: 12px;
  transition: background 0.2s;
}
.settlement-item:hover {
  background: #f8fafc;
}

.img-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  background: #fff;
}
.img-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.info-wrapper .name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
  line-height: 1.3;
}
.spec-tag {
  font-size: 11px;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--text-secondary);
}
.unit-price,
.qty-display {
  font-size: 14px;
  color: var(--text-secondary);
}
.price-val {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

/* --- Sidebar Summary --- */
.summary-card {
  position: sticky;
  top: 20px;
}
.summary-card h3 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: 700;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 14px;
  color: var(--text-secondary);
}
.summary-row .val {
  font-weight: 600;
  color: var(--text-primary);
}

.divider {
  height: 1px;
  background: var(--border-color);
  margin: 16px 0;
}

.summary-total {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 24px;
}
.summary-total span:first-child {
  font-size: 16px;
  font-weight: 600;
}
.total-val {
  font-size: 24px;
  font-weight: 800;
  background: var(--accent-gradient);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Payment Method */
.payment-method {
  margin-bottom: 24px;
}
.payment-method h4,
.remark-section h4 {
  font-size: 12px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  margin-bottom: 10px;
}
.payment-options {
  display: flex;
  flex-direction: row;
  gap: 8px;
}
.payment-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 4px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.payment-option:hover {
  border-color: #cbd5e1;
}
.payment-option.active {
  border-color: var(--accent-color);
  background: #eef2ff;
}
.payment-option input {
  display: none;
}
.radio-mark {
  width: 16px;
  height: 16px;
  border: 2px solid #cbd5e1;
  border-radius: 50%;
  margin-right: 10px;
  position: relative;
}
.payment-option.active .radio-mark {
  border-color: var(--accent-color);
}
.payment-option.active .radio-mark::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 6px;
  height: 6px;
  background: var(--accent-color);
  border-radius: 50%;
}
.payment-option span:last-child {
  font-size: 14px;
  font-weight: 500;
}

/* Remark */
.remark-section {
  margin-bottom: 24px;
}
.custom-textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s;
}
.custom-textarea:focus {
  border-color: var(--accent-color);
}

/* Action */
.action-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.beam-container {
  position: relative;
  border-radius: 9999px;
  padding: 3px;
  overflow: hidden;
  background: #e2e8f0;
}
.beam-border {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: conic-gradient(
    transparent,
    transparent 80deg,
    #4f46e5 100deg,
    #9333ea 140deg,
    transparent 180deg
  );
  animation: rotateBeam 3s linear infinite;
}
@keyframes rotateBeam {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.primary-btn-beam {
  position: relative;
  background: var(--text-primary);
  color: #fff;
  border: none;
  border-radius: 9999px;
  padding: 14px 0;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 1px;
  cursor: pointer;
  z-index: 1;
  width: 100%;
}
.back-btn {
  width: 100%;
  padding: 10px;
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 600;
}
.back-btn:hover {
  color: var(--text-primary);
}
.text-btn {
  background: none;
  border: none;
  color: var(--accent-color);
  font-weight: 600;
  cursor: pointer;
}

/* Dialog Customization */
.custom-dialog :deep(.el-dialog__body) {
  padding: 20px 30px;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.cancel-btn,
.secondary-btn,
.confirm-btn {
  padding: 8px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  border: none;
}
.cancel-btn {
  background: #f1f5f9;
  color: var(--text-secondary);
}
.secondary-btn {
  background: #eef2ff;
  color: var(--accent-color);
}
.confirm-btn {
  background: var(--accent-color);
  color: #fff;
}

.address-list-container {
  max-height: 400px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.address-select-item {
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.address-select-item:hover {
  border-color: var(--accent-color);
  background: #f8fafc;
}
.addr-main {
  display: flex;
  justify-content: space-between;
  font-weight: 600;
  margin-bottom: 4px;
}
.addr-detail {
  font-size: 13px;
  color: var(--text-secondary);
}

/* Loading State */
.loading-state {
  position: relative;
  min-height: 400px;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(2px);
  border-radius: 16px;
}

.loading-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #fff;
  border-radius: 99px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  font-weight: 600;
  color: var(--accent-color);
  font-size: 14px;
  border: 1px solid rgba(79, 70, 229, 0.1);
}
</style>
