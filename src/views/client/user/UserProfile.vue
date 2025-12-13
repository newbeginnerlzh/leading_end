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
                  action="/api/upload/avatar"
                  :show-file-list="false"
                  :on-success="handleAvatarSuccess"
                  :before-upload="beforeAvatarUpload"
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
import type { FormItemRule } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getUserInfo, updateUserInfo, changePassword, cancelAccount } from '@/api/user'
import type { UserInfo, UpdateUserInfoRequest, ChangePasswordRequest, CancelAccountRequest } from '@/api/model/userModel'

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
const handleAvatarSuccess = (response: { data: { url: string } }) => {
  const url = response.data.url
  // 如果处于编辑模式，更新编辑副本；否则直接更新展示数据并保存
  if (isEditing.value) {
    editUserInfo.avatar = url
  } else {
    userInfo.avatar = url
    // 立即保存头像信息
    updateUserInfo({ avatar: url }).catch((e) => {
      console.error(e)
      ElMessage.error(getErrorMessage(e))
    })
  }
  ElMessage.success('头像上传成功')
}

// 头像上传前校验
// 客户端图片压缩：保持清晰度同时减小体积
const compressImage = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.85): Promise<File> => {
  return new Promise((resolve, reject) => {
    try {
      // 如果文件已经很小则跳过压缩（例如小于100KB）
      const sizeKB = file.size / 1024
      if (sizeKB < 100) {
        console.debug('[compressImage] skip compress, small file', file.name, `${Math.round(sizeKB)}KB`)
        resolve(file)
        return
      }

      const img = new Image()
      const url = URL.createObjectURL(file)

      img.onload = () => {
        URL.revokeObjectURL(url)
        const { width, height } = img

        // 等比例缩放到 maxWidth/maxHeight
        const ratio = Math.min(1, maxWidth / width, maxHeight / height)
        const destWidth = Math.round(width * ratio)
        const destHeight = Math.round(height * ratio)

        // 如果尺寸没变化且原来就是 jpeg，则直接返回原文件
        if (destWidth === width && destHeight === height && file.type === 'image/jpeg') {
          resolve(file)
          return
        }

        const canvas = document.createElement('canvas')
        canvas.width = destWidth
        canvas.height = destHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('无法获取 canvas 上下文'))
          return
        }

        // 填充白底以避免 png 转 jpeg 失去透明背景导致黑色问题
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, destWidth, destHeight)
        ctx.drawImage(img, 0, 0, destWidth, destHeight)

        // 输出为 jpeg 以取得更好的压缩比，保持较高质量
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('图片压缩失败'))
              return
            }
            const ext = '.jpg'
            const baseName = file.name.replace(/\.[^.]+$/, '')
            const newName = baseName + ext
            const newFile = new File([blob], newName, { type: 'image/jpeg' })
            console.debug('[compressImage] compressed', file.name, '->', newFile.name, `${Math.round(file.size/1024)}KB -> ${Math.round(newFile.size/1024)}KB`)
            resolve(newFile)
          },
          'image/jpeg',
          quality
        )
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
const beforeAvatarUpload = async (file: File) => {
  const isImage = file.type === 'image/jpeg' || file.type === 'image/png'
  if (!isImage) {
    ElMessage.error('上传头像只能是 JPG/PNG 格式!')
    return false
  }

  try {
    console.debug('[beforeAvatarUpload] original', file.name, `${Math.round(file.size/1024)}KB`)
    const compressed = await compressImage(file, 1200, 1200, 0.85)
    // 如果压缩返回的是原文件，直接返回原文件
    console.debug('[beforeAvatarUpload] returning file', compressed.name, `${Math.round(compressed.size/1024)}KB`)
    return compressed
  } catch (err) {
    console.error('图片压缩失败，回退到原文件上传', err)
    ElMessage.error('图片处理失败，使用原文件上传')
    // 出错时回退为原文件，避免阻塞上传流程
    return file
  }
}

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
