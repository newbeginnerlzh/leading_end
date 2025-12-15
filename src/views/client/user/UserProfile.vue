<template>
  <div class="profile-container">
    <div class="profile-header">
      <h2>个人信息</h2>
    </div>

    <el-card>
      <!-- 展示模式（默认） -->
      <div v-if="!isEditing">
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="avatar-display">
              <div class="avatar-wrapper">
                <img v-if="userInfo.avatar" :src="userInfo.avatar" class="avatar" />
                <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
              </div>
            </div>
          </el-col>

          <el-col :span="16">
            <el-form label-width="200px">
              <el-form-item label="用户名">
                <div>{{ userInfo.username || '-' }}</div>
              </el-form-item>

              <el-form-item label="手机号">
                <div>{{ userInfo.phone || '-' }}</div>
              </el-form-item>

              <el-form-item label="性别">
                <div>{{ userInfo.gender || '-' }}</div>
              </el-form-item>

              <el-form-item label="出生日期">
                <div>{{ userInfo.birthday || '-' }}</div>
              </el-form-item>

              <el-form-item label="邮箱">
                <div>{{ userInfo.email || '-' }}</div>
              </el-form-item>

              <div style="margin-top:10px">
                <el-button type="primary" @click="startEdit">编辑资料</el-button>
                <el-button type="warning" @click="showChangePwdDialog = true" style="margin-left:10px">修改密码</el-button>
                <el-button type="danger" @click="handleCancelAccount" style="margin-left: 10px">注销账号</el-button>
              </div>
            </el-form>
          </el-col>
        </el-row>
      </div>

      <!-- 编辑模式（原有表单，绑定到 editUserInfo） -->
      <div v-else>
        <el-form
          :model="editUserInfo"
          :rules="rules"
          ref="formRef"
          label-width="200px"
        >
          <el-row :gutter="20">
            <el-col :span="8">
              <!-- 头像上传 -->
              <div class="avatar-display">
                <el-upload
                  class="avatar-uploader"
                  :show-file-list="false"
                  :auto-upload="false"
                  :on-change="handlePickAvatarChange"
                  accept="image/jpeg,image/png,image/gif,image/bmp,image/webp"
                  name="file"
                  :limit="1"
                >
                  <img v-if="editUserInfo.avatar" :src="editUserInfo.avatar" class="avatar" />
                  <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
                </el-upload>
              </div>
            </el-col>

            <el-col :span="11">
              <el-form-item label="用户名">
                <el-input v-model="editUserInfo.username"></el-input>
              </el-form-item>

              <el-form-item label="手机号">
                <el-input v-model="editUserInfo.phone"></el-input>
              </el-form-item>

              <el-form-item label="性别" prop="gender">
                <el-radio-group v-model="editUserInfo.gender">
                  <el-radio label="男">男</el-radio>
                  <el-radio label="女">女</el-radio>
                  <el-radio label="未知">未知</el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="出生日期" prop="birthday">
                <el-date-picker
                  v-model="editUserInfo.birthday"
                  type="date"
                  placeholder="请选择出生日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                ></el-date-picker>
              </el-form-item>

              <el-form-item label="邮箱">
                <el-input v-model="editUserInfo.email" placeholder="选填"></el-input>
              </el-form-item>

              <div style="margin-top:10px">
                <el-button type="primary" @click="handleSubmit" :disabled="isSaving">保存修改</el-button>
                <el-button @click="handleCancelEdit" :disabled="isSaving">取消</el-button>
                <el-button type="warning" @click="showChangePwdDialog = true" style="margin-left:10px" :disabled="isSaving">修改密码</el-button>
                <el-button type="danger" @click="handleCancelAccount" style="margin-left: 10px" :disabled="isSaving">注销账号</el-button>
              </div>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </el-card>

    <!-- 修改密码弹窗 -->
    <el-dialog
      v-model="showChangePwdDialog"
      title="修改密码"
      width="400px"
    >
      <el-form
        :model="pwdForm"
        :rules="pwdRules"
        ref="pwdFormRef"
        label-width="100px"
      >
        <el-form-item label="原密码" prop="oldPassword">
          <el-input
            v-model="pwdForm.oldPassword"
            type="password"
            show-password
          ></el-input>
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="pwdForm.newPassword"
            type="password"
            show-password
          ></el-input>
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input
            v-model="pwdForm.confirmPassword"
            type="password"
            show-password
          ></el-input>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showChangePwdDialog = false">取消</el-button>
        <el-button type="primary" @click="handleChangePassword">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { UploadFile } from 'element-plus'
import type { FormItemRule } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
// import type { UploadRequestOptions } from 'element-plus'
import { getUserInfo, updateUserInfo, changePassword, cancelAccount, uploadAvatar } from '@/api/user'
import type { UserInfo, UpdateUserInfoRequest, ChangePasswordRequest, CancelAccountRequest } from '@/api/model/userModel'

// 支持的头像格式
const SUPPORTED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp']
const SUPPORTED_AVATAR_EXTENSIONS = 'jpg, jpeg, png, gif, bmp, webp'

// 待上传的头像文件（保存时上传）
const pendingAvatarFile = ref<File | null>(null)

// 保存中的加载状态
const isSaving = ref(false)

// 表单引用
const formRef = ref()
const pwdFormRef = ref()

// 定义错误响应类型
interface ErrorResponse {
  response?: {
    data?: {
      message?: string
      msg?: string
    }
  }
  message?: string
}

// 从后端错误中提取友好信息
const getErrorMessage = (err: unknown): string => {
  try {
    if (!err) return '操作失败'
    // 错误可能就是字符串
    if (typeof err === 'string' && err.length > 0) return err
    const e = err as ErrorResponse
    // 常见 axios 错误结构：err.response.data.message
    if (e.response?.data) {
      const d = e.response.data
      if (typeof d.message === 'string' && d.message.length > 0) return d.message
      if (typeof d.msg === 'string' && d.msg.length > 0) return d.msg
    }
    // 有时后端直接抛出 { message }
    if (typeof e.message === 'string' && e.message.length > 0) return e.message
    return '操作失败'
  } catch {
    return '操作失败'
  }
}

// 编辑状态：默认只读，点击编辑后进入编辑表单
const isEditing = ref(false)

// 编辑用的副本，防止取消时修改到已展示的数据
const editUserInfo = reactive<UserInfo>({})

// 用户信息
const userInfo = reactive<UserInfo>({})

// 修改密码弹窗
const showChangePwdDialog = ref(false)

// 修改密码表单
const pwdForm = reactive<ChangePasswordRequest & { confirmPassword: string }>({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 验证规则
const rules = reactive({
  gender: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ],
  birthday: [
    { required: true, message: '请选择出生日期', trigger: 'change' }
  ]
})

// 密码验证规则
const pwdRules = reactive({
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule: FormItemRule, value: string, callback: (error?: string | Error) => void) => {
        if (value !== pwdForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
})

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const res = await getUserInfo()
    const data = res.data
    // 主数据用于展示，编辑副本用于编辑操作
    Object.assign(userInfo, data)
    Object.assign(editUserInfo, data)
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

// 裁剪图片为正方形（取中心最大正方形）
const cropToSquare = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      const size = Math.min(img.width, img.height)
      const offsetX = (img.width - size) / 2
      const offsetY = (img.height - size) / 2

      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('无法获取 canvas 上下文'))
        return
      }

      // 从原图中心裁剪正方形区域
      ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size)

      // 根据原文件类型输出，默认使用 jpeg
      const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
      const quality = outputType === 'image/jpeg' ? 0.92 : undefined

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('图片裁剪失败'))
          return
        }
        const ext = outputType === 'image/png' ? '.png' : '.jpg'
        const baseName = file.name.replace(/\.[^.]+$/, '')
        const croppedFile = new File([blob], `${baseName}${ext}`, { type: outputType })
        resolve(croppedFile)
      }, outputType, quality)
    }

    img.onerror = (e) => {
      URL.revokeObjectURL(url)
      reject(e)
    }

    img.src = url
  })
}

// 选择头像文件：类型校验 + 正方形裁剪 + 本地预览（保存时上传）
const handlePickAvatar = async (file: File) => {
  // 校验文件格式
  if (!SUPPORTED_AVATAR_TYPES.includes(file.type)) {
    ElMessage.error(`上传头像只能是 ${SUPPORTED_AVATAR_EXTENSIONS} 格式!`)
    return false
  }

  try {
    // 裁剪为正方形
    const croppedFile = await cropToSquare(file)

    // 生成本地预览URL
    const previewUrl = URL.createObjectURL(croppedFile)
    // 释放之前的预览URL
    if (editUserInfo.avatar && editUserInfo.avatar.startsWith('blob:')) {
      URL.revokeObjectURL(editUserInfo.avatar)
    }
    editUserInfo.avatar = previewUrl
    // 保存裁剪后的文件引用，待保存时上传
    pendingAvatarFile.value = croppedFile

    const readableSize = croppedFile.size >= 1024 * 1024
      ? `${(croppedFile.size / 1024 / 1024).toFixed(2)}MB`
      : croppedFile.size >= 1024
        ? `${(croppedFile.size / 1024).toFixed(2)}KB`
        : `${croppedFile.size}B`
    ElMessage.success(`已选择头像并裁剪为正方形（${readableSize}），请点击保存提交`)
    return false
  } catch (err) {
    console.error('处理头像失败:', err)
    ElMessage.error('图片处理失败，请重试')
    return false
  }
}

// el-upload 在 auto-upload=false 下，选择文件时触发 on-change
// UploadFile.raw 为原始 File 对象
const handlePickAvatarChange = async (uploadFile: UploadFile) => {
  const raw: File | undefined = uploadFile?.raw
  if (!raw) {
    ElMessage.error('未获取到文件，请重试')
    return
  }
  await handlePickAvatar(raw)
}



// 保存用户信息
const handleSubmit = async () => {
  if (!formRef.value) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let loadingMessage: any = null

  try {
    await formRef.value.validate()

    // 开启加载状态
    isSaving.value = true

    // 显示顶部加载提示
    loadingMessage = ElMessage.info({
      message: '确认中，请稍候...',
      //type: 'success',
      duration: 0, // 不自动关闭
      //icon: 'Loading'
    })

    let avatarUrl = editUserInfo.avatar

    // 如果有待上传的头像文件，先上传头像
    if (pendingAvatarFile.value) {
      try {
        const avatarRes = await uploadAvatar(pendingAvatarFile.value)
        avatarUrl = avatarRes.data // 后端返回的图片访问URL
        // 释放之前的预览URL
        if (editUserInfo.avatar && editUserInfo.avatar.startsWith('blob:')) {
          URL.revokeObjectURL(editUserInfo.avatar)
        }
        editUserInfo.avatar = avatarUrl
        pendingAvatarFile.value = null // 清除待上传文件
      } catch (avatarError) {
        console.error('头像上传失败:', avatarError)
        loadingMessage?.close?.() // 关闭加载提示
        ElMessage.error('头像上传失败: ' + getErrorMessage(avatarError))
        isSaving.value = false // 关闭加载状态
        return // 头像上传失败则不继续
      }
    }

    // 构造更新参数（使用编辑副本）
    const updateData: UpdateUserInfoRequest = {
      avatar: avatarUrl,
      gender: editUserInfo.gender,
      birthday: editUserInfo.birthday,
      // 额外同步用户名/手机号/邮箱等可选字段
      // 以防后端支持这些字段一起更新
      username: editUserInfo.username,
      phone: editUserInfo.phone,
      email: editUserInfo.email
    }
    // 调用更新接口
    await updateUserInfo(updateData)

    // 关闭加载提示
    loadingMessage?.close?.()

    // 保存成功后把编辑副本同步到展示数据并退出编辑模式
    Object.assign(userInfo, editUserInfo)
    isEditing.value = false

    // 同步更新 localStorage 中的 userInfo，以便 Header 等组件能获取最新用户名
    try {
      const stored = localStorage.getItem('userInfo')
      const oldInfo = stored ? JSON.parse(stored) : {}
      const newInfo = { ...oldInfo, username: editUserInfo.username, nickname: editUserInfo.username }
      localStorage.setItem('userInfo', JSON.stringify(newInfo))
      // 手动触发自定义事件通知其他组件（同一标签页内 storage 事件不会触发）
      window.dispatchEvent(new CustomEvent('userInfoUpdated'))
    } catch (e) {
      console.warn('同步 userInfo 到 localStorage 失败', e)
    }

    ElMessage.success('信息修改成功')
  } catch (error) {
    console.error('修改信息失败:', error)
    // 关闭加载提示（如果存在）
    loadingMessage?.close?.()
    ElMessage.error(getErrorMessage(error))
  } finally {
    // 无论成功失败都关闭加载状态
    isSaving.value = false
  }
}

// 开始编辑：把当前展示数据拷贝到编辑副本并切换模式
const startEdit = () => {
  Object.assign(editUserInfo, userInfo)
  pendingAvatarFile.value = null // 清除之前可能残留的待上传文件
  isEditing.value = true
}

// 取消编辑：恢复编辑副本为展示数据并退出编辑模式
const handleCancelEdit = () => {
  // 如果有待上传的预览URL，释放它
  if (pendingAvatarFile.value && editUserInfo.avatar && editUserInfo.avatar.startsWith('blob:')) {
    URL.revokeObjectURL(editUserInfo.avatar)
  }
  pendingAvatarFile.value = null
  Object.assign(editUserInfo, userInfo)
  isEditing.value = false
}

// 修改密码
const handleChangePassword = async () => {
  if (!pwdFormRef.value) return

  try {
    await pwdFormRef.value.validate()

    // 调用修改密码接口
    await changePassword({
      oldPassword: pwdForm.oldPassword,
      newPassword: pwdForm.newPassword
    })

    ElMessage.success('密码修改成功，请重新登录')
    showChangePwdDialog.value = false

    // 清除Token并跳转到登录页
    localStorage.removeItem('token')
    window.location.href = '/login'
  } catch (error) {
    console.error('修改密码失败:', error)
    ElMessage.error(getErrorMessage(error))
  }
}

// 注销账号
const handleCancelAccount = async () => {
  try {
    const password = await ElMessageBox.prompt(
      '请输入密码确认注销账号',
      '注销账号',
      {
        inputType: 'password',
        confirmButtonText: '确认注销',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 调用注销接口
    const cancelData: CancelAccountRequest = {
      password: password.value
    }
    await cancelAccount(cancelData)

    ElMessage.success('账号注销成功')

    // 清除Token并跳转到首页
    localStorage.removeItem('token')
    window.location.href = '/'
  } catch (error) {
    // 取消操作不提示错误
    if (error !== 'cancel') {
      console.error('注销账号失败:', error)
      ElMessage.error('注销失败: ' + getErrorMessage(error))
    }
  }
}

// 初始化
onMounted(() => {
  fetchUserInfo()
})
</script>

<style scoped>
.profile-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 12px 0;
  min-height: 50.5px;
}

.profile-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  line-height: 1;
  color: #1f2329;
}

.avatar-uploader {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
  width: 150px;
  height: 150px;
}

.avatar-uploader:hover {
  border-color: var(--el-color-primary);
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 150px;
  height: 150px;
  line-height: 150px;
  text-align: center;
}

.avatar {
  display: block;
  object-fit: cover;
  max-width: 100%;
  max-height: 100%;
}

/* 展示模式的头像容器，与编辑模式保持一致 */
.avatar-wrapper {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  overflow: hidden;
  width: 150px;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
}

.avatar-display {
  width: 100%;
  height: 33vh; /* 占据竖向约三分之一 */
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
