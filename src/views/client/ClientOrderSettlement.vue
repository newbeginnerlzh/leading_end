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
                  <span class="quantity-text">{{ row.count }}</span>
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
            <div class="address-display" style="padding:12px 0">
              <div style="font-weight:500">{{ address.name }} {{ address.phone }}</div>
              <div style="color:#666;margin-top:6px">{{ address.address }}</div>
                    <div style="text-align:right;margin-top:8px">
                <el-button type="text" @click="openModal">修改地址</el-button>
              </div>
            </div>

            <!-- 地址编辑弹窗（外观与 UserAddress.vue 一致） -->
            <el-dialog v-model="modalVisible" title="修改地址" width="600px" :close-on-click-modal="false" :modal-append-to-body="true" :destroy-on-close="false" center>
              <el-form 
              :model="modalAddressForm" 
              :rules="modalRules" 
              ref="modalFormRef" 
              label-width="100px" 
              >
                <el-form-item label="收件人" prop="name">
                  <el-input v-model="modalAddressForm.name" placeholder="姓名" />
                </el-form-item>

                <el-form-item label="手机号" prop="phone">
                  <el-input v-model="modalAddressForm.phone" placeholder="手机号码" />
                </el-form-item>

                <el-form-item label="所在地区" prop="province">
                  <el-cascader v-model="regionValue" :options="regionOptions" :props="{ value: 'code', label: 'name', children: 'children' }" @change="handleModalRegionChange" placeholder="请选择省/市/区" style="width:100%" />
                </el-form-item>

                <el-form-item label="详细地址" prop="detail">
                  <el-input v-model="modalAddressForm.detail" placeholder="街道、门牌号等" />
                </el-form-item>

                <el-form-item label="选择其他地址">
                  <el-select v-model="modalSelectedAddressId" placeholder="请选择收货地址" style="width:100%" @change="onModalAddressSelect">
                    <el-option v-for="a in rawAddresses" :key="a.id" :label="(a.name || '') + ' - ' + (a.phone || '') + ' - ' + ((a.detail && (a.province||a.city||a.district)) ? (a.province + ' ' + a.city + ' ' + a.district + ' ' + a.detail) : (a.address || ''))" :value="a.id" />
                  </el-select>
                </el-form-item>
              </el-form>

              <template #footer>
                <el-button @click="modalVisible = false">取消</el-button>
                <el-button v-if="isModalModified && !matchesExisting" @click="saveModalAsNewAddress">保存为新地址</el-button>
                <el-button type="primary" @click="applyModalAddress">确定</el-button>
              </template>
            </el-dialog>
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
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { createOrder as apiCreateOrder } from '@/api/order'
import { getAddressList, addAddress } from '@/api/user'
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
// 控制是否显示地址下拉选择（已改为弹窗管理）

// 弹窗相关
const modalVisible = ref(false)
const rawAddresses = ref<any[]>([])
const modalSelectedAddressId = ref<number | null>(null)
const modalAddressForm = ref({ name: '', phone: '', province: '', city: '', district: '', detail: '', postal_code: null, isDefault: false })
const modalOriginal = ref<any>(null)
// 临时结构化地址（用于在未保存地址时保留 province/city/district/detail）
const tempAddress = ref<any>(null)
const regionValue = ref<string[]>([])
const regionOptions = ref<any[]>([])

// modal 表单引用与校验规则
const modalFormRef = ref()
const modalRules = {
  name: [{ required: true, message: '请输入收件人', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
  province: [
    {
      validator: (_rule: any, _value: any, callback: any) => {
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
async function fetchAndMapAddresses() {
  try {
    const res = await getAddressList()
    const r = res as unknown
    const data = (r && (r as { data?: any }).data) ? (r as { data?: any }).data : (r as any)
    const list = Array.isArray(data) ? data as any[] : []
    rawAddresses.value = list
    const mapped = list.map((a) => {
      const addrStr = a.detail ? `${a.province || ''} ${a.city || ''} ${a.district || ''} ${a.detail || ''}`.trim() : (a.address || '')
      return { id: a.id ?? a.addressId ?? null, name: a.name || '', phone: a.phone || '', address: addrStr }
    }).filter(x => x.id !== null)
    addresses.value = mapped
    return list
  } catch (e) {
    rawAddresses.value = []
    addresses.value = []
    return []
  }
}

// 导入中国省市区数据并构建级联选项
import areaData from 'china-area-data/data.json'
type RawArea = Record<string, Record<string, string>>
const rawArea = areaData as unknown as RawArea

function buildNodes(parentCode: string) {
  const map = rawArea[parentCode] || {}
  return Object.entries(map).map(([code, name]) => {
    const children = buildNodes(code)
    return children.length ? { code, name, children } : { code, name }
  })
}
regionOptions.value = buildNodes('86')

function handleModalRegionChange(value: string[]) {
  if (value.length === 3) {
    const provNode = regionOptions.value.find((item: any) => item.code === value[0])
    const cityNode = provNode?.children?.find((item: any) => item.code === value[1])
    const distNode = cityNode?.children?.find((item: any) => item.code === value[2])

    const province = provNode?.name || ''
    const city = cityNode?.name || ''
    const district = distNode?.name || ''

    modalAddressForm.value.province = province
    modalAddressForm.value.city = city
    modalAddressForm.value.district = district
  }
}

function onModalAddressSelect(id: number) {
  const found = rawAddresses.value.find((a) => a.id === id)
  if (!found) return
  modalAddressForm.value.name = found.name || ''
  modalAddressForm.value.phone = found.phone || ''
  modalAddressForm.value.detail = found.detail || found.address || ''
  modalAddressForm.value.province = found.province || ''
  modalAddressForm.value.city = found.city || ''
  modalAddressForm.value.district = found.district || ''
  // 更新 regionValue via reverse lookup
  const provs = rawArea['86'] || {}
  const provEntry = Object.entries(provs).find(([, name]) => name === modalAddressForm.value.province)
  if (provEntry) {
    const provCode = provEntry[0]
    const cities = rawArea[provCode] || {}
    const cityEntry = Object.entries(cities).find(([, name]) => name === modalAddressForm.value.city)
    const cityCode = cityEntry ? cityEntry[0] : undefined
    const distCode = cityCode ? (Object.entries(rawArea[cityCode] || {}).find(([, name]) => name === modalAddressForm.value.district) || [])[0] : undefined
    const codes: string[] = []
    if (provCode) codes.push(provCode)
    if (cityCode) codes.push(cityCode)
    if (distCode) codes.push(distCode)
    regionValue.value = codes
  }
  // 更新原始值用于判断是否修改
  modalOriginal.value = {
    name: modalAddressForm.value.name,
    phone: modalAddressForm.value.phone,
    province: modalAddressForm.value.province,
    city: modalAddressForm.value.city,
    district: modalAddressForm.value.district,
    detail: modalAddressForm.value.detail,
  }
}

// 是否与地址管理里的任一地址一致（用于隐藏“保存为新地址”）
const matchesExisting = computed(() => {
  const modalName = (modalAddressForm.value.name || '').trim()
  const modalPhone = (modalAddressForm.value.phone || '').trim()
  const modalDetail = (modalAddressForm.value.detail || '').trim()

  return rawAddresses.value.some((a: any) => {
    const rawName = (a.name || '').trim()
    const rawPhone = (a.phone || '').trim()
    if (rawName !== modalName || rawPhone !== modalPhone) return false

    // 比较 detail
    if (a.detail && (a.detail || '').trim()) {
      return (a.detail || '').trim() === modalDetail
    }

    // 比较省市区 + detail
    if ((a.province || '') && (a.city || '') && (a.district || '')) {
      return (a.province || '') === (modalAddressForm.value.province || '') &&
             (a.city || '') === (modalAddressForm.value.city || '') &&
             (a.district || '') === (modalAddressForm.value.district || '') &&
             ((a.detail || '').trim() === modalDetail)
    }

    // 平面 address 字段对比
    if (a.address && (a.address || '').trim()) {
      return (a.address || '').trim() === modalDetail
    }

    return false
  })
})

const isModalModified = computed(() => {
  const orig = modalOriginal.value
  if (!orig) {
    // 若没有原始值，则根据是否填写判定
    return !!(modalAddressForm.value.name || modalAddressForm.value.phone || modalAddressForm.value.detail || (modalAddressForm.value.province && modalAddressForm.value.city && modalAddressForm.value.district))
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
  } catch (e) {
    // 验证失败，不关闭弹窗
    return
  }

  // 将弹窗当前显示的地址应用到结算页（不一定保存为新地址）
  if (modalSelectedAddressId.value && !isModalModified.value) {
    // 选中了已有地址并且未修改，直接以该 id 为准
    const found = rawAddresses.value.find((a) => (a.id ?? a.addressId) === modalSelectedAddressId.value)
    if (found) {
      selectedAddressId.value = found.id ?? found.addressId ?? null
      const addrStr = found.detail ? `${found.province || ''} ${found.city || ''} ${found.district || ''} ${found.detail || ''}`.trim() : (found.address || '')
      address.value = { name: found.name || '', phone: found.phone || '', address: addrStr }
    }
  } else {
    // 使用弹窗表单的内容作为临时结构化地址（无论是否选择了已有地址但做了修改）
    selectedAddressId.value = null
    const addrStr = modalAddressForm.value.detail ? `${modalAddressForm.value.province || ''} ${modalAddressForm.value.city || ''} ${modalAddressForm.value.district || ''} ${modalAddressForm.value.detail || ''}`.trim() : ''
    address.value = { name: modalAddressForm.value.name || '', phone: modalAddressForm.value.phone || '', address: addrStr }
    // 保存结构化的临时地址，便于再次打开弹窗时回填 province/city/district/detail
    tempAddress.value = {
      name: modalAddressForm.value.name || '',
      phone: modalAddressForm.value.phone || '',
      province: modalAddressForm.value.province || '',
      city: modalAddressForm.value.city || '',
      district: modalAddressForm.value.district || '',
      detail: modalAddressForm.value.detail || ''
    }
  }

  modalVisible.value = false
}

function findCodesByNames(provinceName?: string, cityName?: string, districtName?: string): string[] {
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
      const r = res as unknown
      const data = (r && (r as { data?: any }).data) ? (r as { data?: any }).data : (r as any)
      rawAddresses.value = Array.isArray(data) ? data as any[] : []
    } catch (e) {
      rawAddresses.value = []
    }
  }
  // 每次打开弹窗时清空下拉的选中项
  modalSelectedAddressId.value = null

  // 如果当前有选中地址，优先用 rawAddresses 的细粒度数据回填 modal 表单
  if (selectedAddressId.value) {
    const found = rawAddresses.value.find((a) => (a.id ?? a.addressId) === selectedAddressId.value)
    if (found) {
      modalAddressForm.value.name = found.name || ''
      modalAddressForm.value.phone = found.phone || ''
      modalAddressForm.value.detail = found.detail || found.address || ''
      modalAddressForm.value.province = found.province || ''
      modalAddressForm.value.city = found.city || ''
      modalAddressForm.value.district = found.district || ''
      regionValue.value = findCodesByNames(modalAddressForm.value.province, modalAddressForm.value.city, modalAddressForm.value.district)
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
      regionValue.value = findCodesByNames(modalAddressForm.value.province, modalAddressForm.value.city, modalAddressForm.value.district)
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
    modalFormRef.value && modalFormRef.value.clearValidate()
  } catch (e) {
    // ignore
  }
}

const shipping = ref<number>(10)
const payment = ref<string>('alipay')

// 不在结算页展示订单详情；创建后跳转到支付页
const router = useRouter()

const total = computed(() => cart.selectedTotalPrice)
const selectedCount = computed(() => cart.selectedTotalCount)

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
    } catch (err) {
      // ignore parsing errors
    }

    // 使用统一的用户地址 API 获取地址列表，保持与 UserAddress.vue 一致
    try {
      const list = await fetchAndMapAddresses()
      // 优先使用用户地址列表中标记为默认的地址
      const defaultRaw = list.find((a: any) => a.isDefault)
      if (defaultRaw) {
        const addrStr = defaultRaw.detail ? `${defaultRaw.province || ''} ${defaultRaw.city || ''} ${defaultRaw.district || ''} ${defaultRaw.detail || ''}`.trim() : (defaultRaw.address || '')
        selectedAddressId.value = defaultRaw.id ?? defaultRaw.addressId ?? null
        address.value = { name: defaultRaw.name || '', phone: defaultRaw.phone || '', address: addrStr }
      } else if (addresses.value.length > 0) {
        selectedAddressId.value = addresses.value[0].id
        const first = addresses.value[0]
        address.value = { name: first.name, phone: first.phone, address: first.address }
      } else {
        selectedAddressId.value = null
        address.value = { name: '', phone: '', address: '' }
      }
    } catch (e) {
      addresses.value = []
      selectedAddressId.value = null
      address.value = { name: '', phone: '', address: '' }
    }
  } catch (e) {
    // ignore
  }
})

async function saveModalAsNewAddress() {
  // validate basic fields
  if (!modalAddressForm.value.name || !modalAddressForm.value.phone || !modalAddressForm.value.detail) {
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
    const saved = (res && (res as any).data) ? (res as any).data : res
    ElMessage.success('地址已保存')

    // 刷新地址列表并选择新保存的地址
    try {
      const list = await fetchAndMapAddresses()
      if (saved && saved.id) {
        selectedAddressId.value = saved.id
        const addrStr = saved.detail ? `${saved.province || ''} ${saved.city || ''} ${saved.district || ''} ${saved.detail || ''}`.trim() : (saved.address || '')
        address.value = { name: saved.name || '', phone: saved.phone || '', address: addrStr }
        modalSelectedAddressId.value = saved.id
        // 用结构化字段回填 modal 表单
        modalAddressForm.value.name = saved.name || ''
        modalAddressForm.value.phone = saved.phone || ''
        modalAddressForm.value.detail = saved.detail || saved.address || ''
        modalAddressForm.value.province = saved.province || ''
        modalAddressForm.value.city = saved.city || ''
        modalAddressForm.value.district = saved.district || ''
        regionValue.value = findCodesByNames(modalAddressForm.value.province, modalAddressForm.value.city, modalAddressForm.value.district)
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
    } catch (e) {
      console.error('刷新地址列表失败', e)
    }

    modalVisible.value = false
  } catch (e) {
    console.error('保存地址失败', e)
    ElMessage.error('保存地址失败')
  }
}

// 已合并并重构：非模态保存函数与冗余计算属性被移除，使用统一的 fetchAndMapAddresses() 与 modal 保存流程。

// 数量在结算页为只读展示，相关修改操作在购物车页处理

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
    // 支持未保存的临时地址：如果没有 selectedAddressId，就把当前 address 表单作为临时地址传入 API
    if (!selectedAddressId.value && !(address.value.name && address.value.phone && address.value.address)) {
      ElMessage.warning('请填写完整收货信息或选择已保存地址')
      return
    }

    const payload: any = {
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

    if (selectedAddressId.value) {
      payload.addressId = selectedAddressId.value
    } else {
      // 临时地址（不保存）
      payload.address = { name: address.value.name, phone: address.value.phone, address: address.value.address }
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

/* 使用 Element Plus 默认的必填样式，与 UserAddress 弹窗保持一致 */
</style>
