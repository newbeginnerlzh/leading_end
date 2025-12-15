<template>
  <div class="profile-container">
    <div class="profile-title">个人信息</div>

    <el-card>
      <!-- 展示模式（默认） -->
      <div v-if="!isEditing">
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="avatar-display">
              <img v-if="userInfo.avatar" :src="userInfo.avatar" class="avatar" />
              <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
            </div>
          </el-col>

          <el-col :span="16">
            <el-form label-width="120px">
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
          label-width="120px"
        >
          <el-row :gutter="20">
            <el-col :span="8">
              <!-- 头像上传 -->
              <el-form-item label="用户头像">
                <el-upload
                  class="avatar-uploader"
                  :show-file-list="false"
                  :auto-upload="false"
                  :on-change="handlePickAvatarChange"
                  accept="image/jpeg,image/png"
                  name="file"
                  :limit="1"
                >
                  <img v-if="editUserInfo.avatar" :src="editUserInfo.avatar" class="avatar" />
                  <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
                </el-upload>
              </el-form-item>
            </el-col>

            <el-col :span="16">
              <el-form-item label="用户名">
                <el-input v-model="editUserInfo.username"></el-input>
              </el-form-item>

              <el-form-item label="手机号">
                <el-input v-model="editUserInfo.phone"></el-input>
              </el-form-item>
            </el-col>
          </el-row>

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

          <el-form-item>
            <el-button type="primary" @click="handleSubmit">保存修改</el-button>
            <el-button @click="handleCancelEdit">取消</el-button>
            <el-button type="warning" @click="showChangePwdDialog = true">修改密码</el-button>
            <el-button
              type="danger"
              @click="handleCancelAccount"
              style="margin-left: 10px"
            >
              注销账号
            </el-button>
          </el-form-item>
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
import { getUserInfo, updateUserInfo, changePassword, cancelAccount } from '@/api/user'
import type { UserInfo, UpdateUserInfoRequest, ChangePasswordRequest, CancelAccountRequest } from '@/api/model/userModel'
// 不再走独立头像上传接口，保存时与其他字段一并提交

const AVATAR_TARGET_BYTES = 350
const AVATAR_MAX_DIMENSION = 80
const AVATAR_MIN_DIMENSION = 16
const AVATAR_INITIAL_QUALITY = 0.5
const AVATAR_MIN_QUALITY = 0.08
const AVATAR_QUALITY_STEP = 0.08
const AVATAR_SCALE_STEP = 0.8

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

// 头像上传成功
// 选择头像文件：类型校验 + 可选压缩 + 本地预览（不直接上传）
const handlePickAvatar = async (file: File) => {
  const isImage = file.type === 'image/jpeg' || file.type === 'image/png'
  if (!isImage) {
    ElMessage.error('上传头像只能是 JPG/PNG 格式!')
    return false
  }

  try {
    const processed = await compressImage(file)
    const compressedBytes = processed.size
    const readableSize = compressedBytes >= 1024
      ? `${(compressedBytes / 1024).toFixed(2)}KB`
      : `${compressedBytes}B`
    // 将文件转为本地预览 URL；保存时由后端接收为字符串字段
    const reader = new FileReader()
    const base64 = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve((reader.result || '') as string)
      reader.onerror = (e) => reject(e)
      reader.readAsDataURL(processed)
    })
    editUserInfo.avatar = base64
    if (compressedBytes <= AVATAR_TARGET_BYTES) {
      ElMessage.success(`头像压缩成功（约 ${readableSize}），请点击保存提交`)
    } else {
      ElMessage.warning(`已尽力压缩头像（约 ${readableSize}），仍超 ${AVATAR_TARGET_BYTES}B，建议换更小图片`)
    }
    // 阻止 el-upload 继续默认上传流程
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

// 头像上传前校验
// 客户端图片压缩：保持清晰度同时减小体积
const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    try {
      if (file.size <= AVATAR_TARGET_BYTES) {
        resolve(file)
        return
      }

      const img = new Image()
      const url = URL.createObjectURL(file)

      img.onload = async () => {
        URL.revokeObjectURL(url)

        const longestEdge = Math.max(img.width, img.height) || 1
        const minScale = Math.min(1, AVATAR_MIN_DIMENSION / longestEdge)
        let scale = Math.min(1, AVATAR_MAX_DIMENSION / longestEdge)
        scale = Math.max(minScale, scale)
        let currentQuality = AVATAR_INITIAL_QUALITY

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('无法获取 canvas 上下文'))
          return
        }

        const drawAndCompress = (targetWidth: number, targetHeight: number, quality: number): Promise<Blob> => {
          canvas.width = Math.max(1, targetWidth)
          canvas.height = Math.max(1, targetHeight)
          ctx.fillStyle = '#fff'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          return new Promise((resolveBlob, rejectBlob) => {
            canvas.toBlob((blob) => {
              if (!blob) {
                rejectBlob(new Error('图片压缩失败'))
                return
              }
              resolveBlob(blob)
            }, 'image/jpeg', quality)
          })
        }

        while (true) {
          const targetWidth = Math.max(1, Math.round(img.width * scale))
          const targetHeight = Math.max(1, Math.round(img.height * scale))
          try {
            const blob = await drawAndCompress(targetWidth, targetHeight, currentQuality)
            if (blob.size <= AVATAR_TARGET_BYTES || (targetWidth <= AVATAR_MIN_DIMENSION && targetHeight <= AVATAR_MIN_DIMENSION && currentQuality <= AVATAR_MIN_QUALITY)) {
              const baseName = file.name.replace(/\.[^.]+$/, '')
              const newFile = new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' })
              console.debug('[compressImage] compressed', file.name, '->', newFile.name, `${file.size}B -> ${blob.size}B`, `${targetWidth}x${targetHeight}`, `q=${currentQuality.toFixed(2)}`)
              resolve(newFile)
              return
            }

            if (currentQuality > AVATAR_MIN_QUALITY + 0.001) {
              currentQuality = Math.max(AVATAR_MIN_QUALITY, currentQuality - AVATAR_QUALITY_STEP)
              continue
            }

            if (scale > minScale + 0.001) {
              scale = Math.max(minScale, scale * AVATAR_SCALE_STEP)
              continue
            }

            const baseName = file.name.replace(/\.[^.]+$/, '')
            const fallbackFile = new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' })
            resolve(fallbackFile)
            return
          } catch (loopErr) {
            reject(loopErr)
            return
          }
        }
      }

      img.onerror = (e) => {
        URL.revokeObjectURL(url)
        reject(e)
      }

      img.src = url
    } catch (err) {
      reject(err)
    }
  })
}

// 图片上传前处理：验证类型并做压缩处理，返回 Promise<File|boolean>
// 移除未使用的旧钩子，压缩逻辑已在 handlePickAvatar 内处理

// 保存用户信息
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    // 构造更新参数（使用编辑副本）
    const updateData: UpdateUserInfoRequest = {
      avatar: editUserInfo.avatar,
      gender: editUserInfo.gender,
      birthday: editUserInfo.birthday,
      // 额外同步用户名/手机号/邮箱等可选字段
      // 以防后端支持这些字段一起更新
      username: editUserInfo.username,
      phone: editUserInfo.phone,
      email: editUserInfo.email
    }
    //console.log('更新用户信息参数:', updateData)
    // 调用更新接口
    await updateUserInfo(updateData)

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
    //ElMessage.error(getErrorMessage(error))
  }
}

// 开始编辑：把当前展示数据拷贝到编辑副本并切换模式
const startEdit = () => {
  Object.assign(editUserInfo, userInfo)
  isEditing.value = true
}

// 取消编辑：恢复编辑副本为展示数据并退出编辑模式
const handleCancelEdit = () => {
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

.profile-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 20px;
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

.avatar-display {
  width: 100%;
  height: 33vh; /* 占据竖向约三分之一 */
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
