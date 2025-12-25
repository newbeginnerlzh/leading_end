<template>
  <div class="modern-address-page">
    <!-- Header -->
    <div class="page-header" v-scroll-reveal>
      <div class="header-left">
        <h1 class="page-title">收货地址管理</h1>
        <span class="step-indicator">Address Management</span>
      </div>
      <el-button type="primary" class="custom-btn primary" @click="handleAdd">
        <el-icon class="el-icon--left"><Plus /></el-icon>新增收货地址
      </el-button>
    </div>

    <div class="address-content">
      <!-- 地址列表 -->
      <TransitionGroup name="list" tag="div" class="address-grid" v-scroll-reveal>
        <!-- 现有地址卡片 -->
        <div
          v-for="address in addressList"
          :key="address.id"
          class="address-card"
          :class="{ 'is-default': address.isDefault }"
        >
          <div class="card-header">
            <div class="user-info">
              <span class="name">{{ address.name }}</span>
              <span class="phone">{{ address.phone }}</span>
            </div>
            <span v-if="address.isDefault" class="default-badge">默认</span>
          </div>

          <div class="card-body">
            <div class="address-detail">
              {{ address.province }} {{ address.city }} {{ address.district }}
              <br />
              {{ address.detail }}
            </div>
            <div v-if="address.postal_code" class="postal-code">
              邮编：{{ address.postal_code }}
            </div>
          </div>

          <div class="card-footer">
            <div class="actions-left">
              <span
                v-if="!address.isDefault"
                class="action-link"
                @click.stop="handleSetDefault(address.id!)"
              >
                设为默认
              </span>
            </div>
            <div class="actions-right">
              <el-button type="primary" link class="action-btn" @click.stop="handleEdit(address)">
                <el-icon><Edit /></el-icon> 编辑
              </el-button>
              <el-button
                type="danger"
                link
                class="action-btn delete"
                @click.stop="handleDelete(address.id!)"
              >
                <el-icon><Delete /></el-icon> 删除
              </el-button>
            </div>
          </div>
        </div>
      </TransitionGroup>

      <div v-if="addressList.length === 0" class="empty-state" v-scroll-reveal>
        <el-empty description="暂无收货地址，请添加" />
      </div>
    </div>

    <!-- 地址编辑弹窗 -->
    <el-dialog
      v-model="showAddDialog"
      :title="dialogTitle"
      width="600px"
      class="custom-dialog"
      destroy-on-close
    >
      <el-form
        :model="addressForm"
        :rules="addressRules"
        ref="addressFormRef"
        label-position="top"
        class="address-form"
      >
        <div class="form-row">
          <el-form-item label="收货人" prop="name">
            <el-input v-model="addressForm.name" placeholder="请输入收货人姓名"></el-input>
          </el-form-item>

          <el-form-item label="手机号" prop="phone">
            <el-input v-model="addressForm.phone" placeholder="请输入手机号"></el-input>
          </el-form-item>
        </div>

        <el-form-item label="所在地区" prop="province">
          <el-cascader
            v-model="regionValue"
            :options="regionOptions"
            :props="{
              label: 'name',
              value: 'code',
              children: 'children',
            }"
            @change="handleRegionChange"
            placeholder="请选择省/市/区"
            style="width: 100%"
          ></el-cascader>
        </el-form-item>

        <el-form-item label="详细地址" prop="detail">
          <el-input
            v-model="addressForm.detail"
            type="textarea"
            :rows="2"
            placeholder="街道、楼牌号等"
          ></el-input>
        </el-form-item>

        <div class="form-row">
          <el-form-item label="邮政编码">
            <el-input v-model="addressForm.postal_code" placeholder="选填"></el-input>
          </el-form-item>

          <el-form-item class="checkbox-item">
            <el-checkbox v-model="addressForm.isDefault" label="设为默认地址" />
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="custom-btn" @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" class="custom-btn primary" @click="handleSave">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { getAddressList, addAddress, updateAddress, deleteAddress } from '@/api/user'
// Import China area data
import areaData from 'china-area-data/data.json'
type RawArea = Record<string, Record<string, string>>
const rawArea = areaData as unknown as RawArea
import type { AddressInfo } from '@/api/model/userModel'

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

// 省市区节点类型
type RegionNode = {
  code: string
  name: string
  children?: RegionNode[]
}

// 表单引用
const addressFormRef = ref()

// 地址列表
const addressList = ref<AddressInfo[]>([])

// 弹窗状态
const showAddDialog = ref(false)
const dialogTitle = ref('新增地址')
const currentAddressId = ref<number | null>(null)

// 地址表单
const addressForm = reactive<AddressInfo>({
  name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  postal_code: null,
  isDefault: false,
})

// 省市区选择器
const regionValue = ref<string[]>([])
const regionOptions = ref<RegionNode[]>([])

// build tree from raw area data
function buildNodes(parentCode: string): RegionNode[] {
  const map = rawArea[parentCode] || {}
  return Object.entries(map).map(([code, name]) => {
    const children = buildNodes(code)
    return children.length ? { code, name, children } : { code, name }
  })
}

// initialize regionOptions from root code '86'
regionOptions.value = buildNodes('86')

// find codes by province/city/district names (reverse mapping)
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

// 验证规则
const addressRules = reactive({
  name: [{ required: true, message: '请输入收货人姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
  province: [{ required: true, message: '请选择所在地区', trigger: 'change' }],
  detail: [
    { required: true, message: '请输入详细地址', trigger: 'blur' },
    { min: 5, message: '详细地址不能少于5个字符', trigger: 'blur' },
  ],
})

// 获取地址列表
const fetchAddressList = async () => {
  try {
    const res = await getAddressList()
    // 默认地址排在最前
    addressList.value = (res.data || []).sort(
      (a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0),
    )
  } catch (error) {
    console.error('获取地址列表失败:', error)
    ElMessage.error('获取地址列表失败')
  }
}

// 处理地区选择
const handleRegionChange = (value: string[]) => {
  if (value.length === 3) {
    // 根据code匹配省市区名称
    const provNode = regionOptions.value.find((item) => item.code === value[0])
    const cityNode = provNode?.children?.find((item) => item.code === value[1])
    const distNode = cityNode?.children?.find((item) => item.code === value[2])

    const province = provNode?.name || ''
    const city = cityNode?.name || ''
    const district = distNode?.name || ''

    addressForm.province = province
    addressForm.city = city
    addressForm.district = district
  }
}

// 新增地址
const handleAdd = () => {
  dialogTitle.value = '新增地址'
  currentAddressId.value = null

  // 重置表单
  Object.assign(addressForm, {
    name: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    detail: '',
    postal_code: null,
    isDefault: false,
  })
  regionValue.value = []

  showAddDialog.value = true
}

// 编辑地址
const handleEdit = (address: AddressInfo) => {
  dialogTitle.value = '编辑地址'
  currentAddressId.value = address.id ?? null

  // 填充表单
  Object.assign(addressForm, {
    name: address.name,
    phone: address.phone,
    province: address.province,
    city: address.city,
    district: address.district,
    detail: address.detail,
    postal_code: address.postal_code,
    isDefault: address.isDefault,
  })

  // 解析省市区code，使用反向映射以回显级联选择器
  regionValue.value = findCodesByNames(address.province, address.city, address.district)

  showAddDialog.value = true
}

// 保存地址
const handleSave = async () => {
  if (!addressFormRef.value) return

  try {
    await addressFormRef.value.validate()

    if (currentAddressId.value) {
      // 编辑地址
      await updateAddress({
        id: currentAddressId.value,
        ...addressForm,
      })
      ElMessage.success('地址修改成功')
    } else {
      // 新增地址
      await addAddress(addressForm)
      ElMessage.success('地址添加成功')
    }

    showAddDialog.value = false
    fetchAddressList()
  } catch (error) {
    console.error('保存地址失败:', error)
    ElMessage.error('保存地址失败')
  }
}

// 设置默认地址
const handleSetDefault = async (id: number) => {
  try {
    // 先取消其他默认地址
    addressList.value.forEach((item) => {
      if (item.isDefault) {
        item.isDefault = false
      }
    })

    // 更新当前地址为默认
    await updateAddress({
      id,
      isDefault: true,
      name: addressList.value.find((item) => item.id === id)?.name || '',
      phone: addressList.value.find((item) => item.id === id)?.phone || '',
      province: addressList.value.find((item) => item.id === id)?.province || '',
      city: addressList.value.find((item) => item.id === id)?.city || '',
      district: addressList.value.find((item) => item.id === id)?.district || '',
      detail: addressList.value.find((item) => item.id === id)?.detail || '',
      postal_code: addressList.value.find((item) => item.id === id)?.postal_code || null,
    })

    ElMessage.success('已设为默认地址')
    fetchAddressList()
  } catch (error) {
    console.error('设置默认地址失败:', error)
    ElMessage.error('设置默认地址失败')
  }
}

// 删除地址
const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个地址吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await deleteAddress(id)
    ElMessage.success('地址已删除')
    fetchAddressList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除地址失败:', error)
      ElMessage.error('删除地址失败')
    }
  }
}

// 初始化
onMounted(() => {
  fetchAddressList()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.modern-address-page {
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
  min-height: auto;
  padding: 18px 0;
  box-sizing: border-box;
}

/* --- Animations --- */
@keyframes slideFadeBlurIn {
  0% {
    opacity: 0;
    transform: translateY(10px);
    filter: blur(5px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}

.page-header,
.address-grid,
.empty-state {
  animation: slideFadeBlurIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  animation-play-state: paused;
}

.is-visible {
  animation-play-state: running;
}

/* --- List Transitions --- */
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.list-leave-active {
  position: absolute;
}

/* --- Header --- */
.page-header {
  margin: 0 auto 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 15px;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 20px;
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

/* --- Content --- */
.address-content {
  margin: 0 auto;
}

.address-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

/* --- Cards --- */
.address-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 20px;
  box-shadow: var(--card-shadow);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  position: relative;
  min-height: 150px;
}

.address-card:hover {
  box-shadow: var(--card-hover-shadow);
  transform: translateY(-2px);
  border-color: #cbd5e1;
}

.address-card.is-default {
  border-color: var(--accent-color);
  background: #fcfdff;
}

/* Add Card */
.address-card.add-card {
  border: 2px dashed var(--border-color);
  background: transparent;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-secondary);
  gap: 16px;
}

.address-card.add-card:hover {
  border-color: var(--accent-color);
  color: var(--accent-color);
  background: #f8fafc;
}

.add-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  transition: all 0.3s ease;
}

.address-card.add-card:hover .add-icon-wrapper {
  background: var(--accent-color);
  color: #fff;
}

.add-text {
  font-weight: 600;
  font-size: 16px;
}

/* Card Content */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-info .name {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.user-info .phone {
  font-size: 14px;
  color: var(--text-secondary);
  font-family: monospace;
}

.default-badge {
  background: var(--accent-color);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 99px;
  text-transform: uppercase;
}

.card-body {
  flex: 1;
  margin-bottom: 12px;
}

.address-detail {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 8px;
  /* 控制显示宽度和行数 */
  max-width: 100%;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2; /* 限制显示 2 行 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.postal-code {
  font-size: 12px;
  color: var(--text-tertiary);
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.action-link {
  font-size: 13px;
  color: #06b6d4;
  cursor: pointer;
  transition: color 0.2s;
}

.action-link:hover {
  color: #0891b2;
  text-decoration: underline;
}

.actions-right {
  display: flex;
  gap: 8px;
}

.action-btn {
  font-size: 13px;
  padding: 0 4px;
  height: auto;
}

.action-btn .el-icon {
  margin-right: 2px;
}

.action-btn.delete:hover {
  color: var(--danger-color);
}

/* --- Dialog --- */
.custom-dialog :deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
}

.custom-dialog :deep(.el-dialog__header) {
  margin: 0;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.custom-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

.custom-dialog :deep(.el-dialog__footer) {
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
  background: #f8fafc;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* Form Styles */
.address-form :deep(.el-form-item__label) {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  padding-bottom: 6px;
}

.address-form :deep(.el-input__wrapper),
.address-form :deep(.el-textarea__inner) {
  box-shadow: 0 0 0 1px var(--border-color) inset;
  border-radius: 8px;
  padding: 8px 12px;
  transition: all 0.2s;
}

.address-form :deep(.el-input__wrapper.is-focus),
.address-form :deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 2px var(--accent-color) inset !important;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.checkbox-item {
  display: flex;
  align-items: flex-end;
}

.custom-btn {
  height: 40px;
  padding: 0 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s;
  border: 1px solid var(--border-color);
  background: #fff;
  color: var(--text-primary);
}

.custom-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: var(--accent-color);
}

.custom-btn.primary {
  background: var(--accent-color);
  border-color: var(--accent-color);
  color: #fff;
}

.custom-btn.primary:hover {
  background: #4338ca;
  border-color: #4338ca;
}

/* Empty State */
.empty-state {
  padding: 60px 0;
}
</style>
