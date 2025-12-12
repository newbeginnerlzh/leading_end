<template>
  <div class="address-container">
    <div class="address-header">
      <h2>收货地址管理</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增地址
      </el-button>
    </div>

    <!-- 地址列表 -->
    <div class="address-list">
      <el-card
        v-for="address in addressList"
        :key="address.id"
        class="address-card"
      >
        <div class="address-info">
          <div class="address-name">
            {{ address.name }} {{ address.phone }}
            <span v-if="address.isDefault" class="default-tag">默认地址</span>
          </div>
          <div class="address-detail">
            {{ address.province }} {{ address.city }} {{ address.district }} {{ address.detail }}
            <span v-if="address.postal_code" class="postal-code">({{ address.postal_code }})</span>
          </div>
        </div>
        <div class="address-actions">
          <el-button
            type="text"
            @click="handleEdit(address)"
          >
            编辑
          </el-button>
          <el-button
            type="text"
            @click="handleSetDefault(address.id!)"
            v-if="!address.isDefault"
          >
            设为默认
          </el-button>
          <el-button
            type="text"
            text-color="#ff4d4f"
            @click="handleDelete(address.id!)"
          >
            删除
          </el-button>
        </div>
      </el-card>

      <div v-if="addressList.length === 0" class="empty-address">
        <el-empty description="暂无收货地址，请添加"></el-empty>
      </div>
    </div>

    <!-- 地址编辑弹窗 -->
    <el-dialog
      v-model="showAddDialog"
      :title="dialogTitle"
      width="600px"
    >
      <el-form
        :model="addressForm"
        :rules="addressRules"
        ref="addressFormRef"
        label-width="100px"
      >
        <el-form-item label="收货人" prop="name">
          <el-input v-model="addressForm.name"></el-input>
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input v-model="addressForm.phone"></el-input>
        </el-form-item>

        <el-form-item label="所在地区" prop="province">
          <el-cascader
            v-model="regionValue"
            :options="regionOptions"
            :props="{
              label: 'name',
              value: 'code',
              children: 'children'
            }"
            @change="handleRegionChange"
            placeholder="请选择省/市/区"
            style="width: 100%"
          ></el-cascader>
        </el-form-item>

        <el-form-item label="详细地址" prop="detail">
          <el-input v-model="addressForm.detail" placeholder="街道、门牌号等"></el-input>
        </el-form-item>

        <el-form-item label="邮政编码">
          <el-input v-model="addressForm.postal_code" placeholder="选填"></el-input>
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="addressForm.isDefault">设为默认地址</el-checkbox>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getAddressList, addAddress, updateAddress, deleteAddress } from '@/api/user'
// Import China area data
import areaData from 'china-area-data/data.json'
type RawArea = Record<string, Record<string, string>>
const rawArea = areaData as unknown as RawArea
import type { AddressInfo } from '@/api/model/userModel'

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
  isDefault: false
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

// 验证规则
const addressRules = reactive({
  name: [
    { required: true, message: '请输入收货人姓名', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  province: [
    { required: true, message: '请选择所在地区', trigger: 'change' }
  ],
  detail: [
    { required: true, message: '请输入详细地址', trigger: 'blur' },
    { min: 5, message: '详细地址不能少于5个字符', trigger: 'blur' }
  ]
})

// 获取地址列表
const fetchAddressList = async () => {
  try {
    const res = await getAddressList()
    addressList.value = res.data || []
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
    isDefault: false
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
    isDefault: address.isDefault
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
        ...addressForm
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
    addressList.value.forEach(item => {
      if (item.isDefault) {
        item.isDefault = false
      }
    })

    // 更新当前地址为默认
    await updateAddress({
      id,
      isDefault: true,
      name: addressList.value.find(item => item.id === id)?.name || '',
      phone: addressList.value.find(item => item.id === id)?.phone || '',
      province: addressList.value.find(item => item.id === id)?.province || '',
      city: addressList.value.find(item => item.id === id)?.city || '',
      district: addressList.value.find(item => item.id === id)?.district || '',
      detail: addressList.value.find(item => item.id === id)?.detail || '',
      postal_code: addressList.value.find(item => item.id === id)?.postal_code || null
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
    await ElMessageBox.confirm(
      '确定要删除这个地址吗？',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

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
.address-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.address-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.address-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.address-card {
  padding: 20px;
  transition: box-shadow 0.3s;
}

.address-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.address-info {
  margin-bottom: 15px;
}

.address-name {
  font-weight: 500;
  margin-bottom: 8px;
  font-size: 16px;
}

.default-tag {
  margin-left: 10px;
  background-color: #e6f7ff;
  color: #1890ff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.address-detail {
  color: #666;
  line-height: 1.5;
}

.postal-code {
  margin-left: 8px;
  color: #999;
  font-size: 12px;
}

.address-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid #eee;
  padding-top: 10px;
  margin-top: 10px;
}

.empty-address {
  grid-column: 1 / -1;
  margin-top: 50px;
  text-align: center;
}
</style>
