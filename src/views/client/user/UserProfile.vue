<template>
  <div class="modern-profile-page">
    <!-- Header -->
    <div class="page-header" v-scroll-reveal>
      <h1 class="page-title">个人信息</h1>
      <span class="step-indicator">Profile Settings</span>
    </div>

    <div class="profile-content">
      <div class="section-card" v-scroll-reveal>
        <Transition name="fade-slide" mode="out-in">
          <!-- 展示模式（默认） -->
          <div v-if="!isEditing" class="mode-view" key="view">
            <div class="profile-layout">
              <div class="avatar-section" v-scroll-reveal>
                <div class="avatar-wrapper">
                  <el-image
                    v-if="userInfo.avatar"
                    :src="userInfo.avatar"
                    class="avatar"
                    fit="cover"
                  >
                    <template #placeholder>
                      <div class="avatar-placeholder-icon">
                        <el-icon class="is-loading"><Loading /></el-icon>
                      </div>
                    </template>
                  </el-image>
                  <el-icon v-else class="avatar-placeholder-icon"><Plus /></el-icon>
                </div>
              </div>

              <div class="info-section">
                <div class="info-grid">
                  <div class="info-item" v-scroll-reveal>
                    <span class="label">用户名</span>
                    <span class="value">{{ userInfo.username || '-' }}</span>
                  </div>
                  <div class="info-item" v-scroll-reveal>
                    <span class="label">手机号</span>
                    <span class="value">{{ userInfo.phone || '-' }}</span>
                  </div>
                  <div class="info-item" v-scroll-reveal>
                    <span class="label">性别</span>
                    <span class="value">{{ userInfo.gender || '-' }}</span>
                  </div>
                  <div class="info-item" v-scroll-reveal>
                    <span class="label">出生日期</span>
                    <span class="value">{{ userInfo.birthday || '-' }}</span>
                  </div>
                  <div class="info-item" v-scroll-reveal>
                    <span class="label">邮箱</span>
                    <span class="value">{{ userInfo.email || '-' }}</span>
                  </div>
                </div>

                <div class="action-bar">
                  <el-button type="primary" class="custom-btn primary" @click="startEdit"
                    >编辑资料</el-button
                  >
                  <el-button class="custom-btn secondary" @click="showChangePwdDialog = true"
                    >修改密码</el-button
                  >
                  <el-button
                    type="danger"
                    plain
                    class="custom-btn danger"
                    @click="handleCancelAccount"
                    >注销账号</el-button
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- 编辑模式 -->
          <div v-else class="mode-edit" key="edit">
            <el-form
              :model="editUserInfo"
              :rules="rules"
              ref="formRef"
              label-position="top"
              class="edit-form"
            >
              <div class="profile-layout">
                <div class="avatar-section" v-scroll-reveal>
                  <div class="avatar-wrapper upload-mode">
                    <el-upload
                      class="avatar-uploader"
                      :show-file-list="false"
                      :auto-upload="false"
                      :on-change="handlePickAvatarChange"
                      accept="image/jpeg,image/png,image/gif,image/bmp,image/webp"
                      name="file"
                      :limit="1"
                    >
                      <div v-if="editUserInfo.avatar" class="avatar-edit-wrapper">
                        <img :src="editUserInfo.avatar" class="avatar" />
                        <div class="avatar-mask">
                          <el-icon><Plus /></el-icon>
                          <span>更换头像</span>
                        </div>
                      </div>
                      <div v-else class="upload-placeholder">
                        <el-icon class="avatar-uploader-icon"><Plus /></el-icon>
                        <span class="upload-text">点击上传</span>
                      </div>
                    </el-upload>
                  </div>
                  <div class="avatar-tip">支持 jpg, png, gif 格式</div>
                </div>

                <div class="info-section">
                  <div class="form-grid">
                    <el-form-item label="用户名" prop="username">
                      <el-input
                        v-model="editUserInfo.username"
                        placeholder="请输入用户名"
                      ></el-input>
                    </el-form-item>

                    <el-form-item label="手机号" prop="phone">
                      <el-input v-model="editUserInfo.phone" placeholder="请输入手机号"></el-input>
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
                        style="width: 100%"
                      ></el-date-picker>
                    </el-form-item>

                    <el-form-item label="邮箱" prop="email">
                      <el-input v-model="editUserInfo.email" placeholder="选填"></el-input>
                    </el-form-item>
                  </div>

                  <div class="action-bar">
                    <div class="beam-container">
                      <div class="beam-border"></div>
                      <button type="button" class="primary-btn-beam" @click="handleSubmit" :disabled="isSaving">
                        <el-icon v-if="isSaving" class="is-loading" style="margin-right: 8px"
                          ><Loading
                        /></el-icon>
                        {{ isSaving ? '保存中...' : '保存修改' }}
                      </button>
                    </div>
                    <el-button class="custom-btn" @click="handleCancelEdit" :disabled="isSaving"
                      >取消</el-button
                    >
                  </div>
                </div>
              </div>
            </el-form>
          </div>
        </Transition>
      </div>
    </div>

    <!-- 修改密码弹窗 -->
    <el-dialog v-model="showChangePwdDialog" title="修改密码" width="400px" class="custom-dialog">
      <el-form :model="pwdForm" :rules="pwdRules" ref="pwdFormRef" label-position="top">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input
            v-model="pwdForm.oldPassword"
            type="password"
            show-password
            placeholder="请输入原密码"
          ></el-input>
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="pwdForm.newPassword"
            type="password"
            show-password
            placeholder="请输入新密码"
          ></el-input>
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input
            v-model="pwdForm.confirmPassword"
            type="password"
            show-password
            placeholder="请再次输入新密码"
          ></el-input>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="custom-btn" @click="showChangePwdDialog = false">取消</el-button>
          <div class="beam-container">
            <div class="beam-border"></div>
            <button
              class="primary-btn-beam"
              @click="handleChangePassword"
              :disabled="isChangingPwd"
            >
              <el-icon v-if="isChangingPwd" class="is-loading" style="margin-right: 8px"
                ><Loading
              /></el-icon>
              {{ isChangingPwd ? '提交中...' : '确认修改' }}
            </button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- 注销账号弹窗 -->
    <el-dialog
      v-model="showCancelAccountDialog"
      title="注销账号"
      width="400px"
      class="custom-dialog"
    >
      <div
        style="margin-bottom: 20px; color: var(--danger-color); font-size: 14px; line-height: 1.6"
      >
        <el-icon style="vertical-align: middle; margin-right: 4px"><Warning /></el-icon>
        警告：注销账号后，所有个人数据、订单记录将永久删除且无法恢复，请谨慎操作。
      </div>
      <el-form label-position="top">
        <el-form-item label="请输入登录密码确认注销">
          <el-input
            v-model="cancelAccountPassword"
            type="password"
            show-password
            placeholder="请输入密码"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button class="custom-btn" @click="showCancelAccountDialog = false">取消</el-button>
          <div class="beam-container danger">
            <div class="beam-border"></div>
            <button
              class="primary-btn-beam danger"
              @click="confirmCancelAccount"
              :disabled="isCancellingAccount"
            >
              <el-icon v-if="isCancellingAccount" class="is-loading" style="margin-right: 8px"
                ><Loading
              /></el-icon>
              {{ isCancellingAccount ? '注销中...' : '确认注销' }}
            </button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'
import type { FormItemRule } from 'element-plus'
import { Plus, Loading, Warning } from '@element-plus/icons-vue'
// import type { UploadRequestOptions } from 'element-plus'
import {
  getUserInfo,
  updateUserInfo,
  changePassword,
  cancelAccount,
  uploadAvatar,
} from '@/api/user'
import type {
  UserInfo,
  UpdateUserInfoRequest,
  ChangePasswordRequest,
  CancelAccountRequest,
} from '@/api/model/userModel'

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
const isChangingPwd = ref(false)

// 注销账号弹窗
const showCancelAccountDialog = ref(false)
const cancelAccountPassword = ref('')
const isCancellingAccount = ref(false)

// 修改密码表单
const pwdForm = reactive<ChangePasswordRequest & { confirmPassword: string }>({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// 验证规则
const rules = reactive({
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  birthday: [{ required: true, message: '请选择出生日期', trigger: 'change' }],
})

// 密码验证规则
const pwdRules = reactive({
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (
        rule: FormItemRule,
        value: string,
        callback: (error?: string | Error) => void,
      ) => {
        if (value !== pwdForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
})

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const res = await getUserInfo()
    const data = res.data
    // 主数据用于展示，编辑副本用于编辑操作
    Object.assign(userInfo, data)
    Object.assign(editUserInfo, data)

    // 同步到 localStorage，确保其他组件（如 Header）也能获取最新数据
    localStorage.setItem('userInfo', JSON.stringify(data))
    window.dispatchEvent(new CustomEvent('userInfoUpdated'))
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

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('图片裁剪失败'))
            return
          }
          const ext = outputType === 'image/png' ? '.png' : '.jpg'
          const baseName = file.name.replace(/\.[^.]+$/, '')
          const croppedFile = new File([blob], `${baseName}${ext}`, { type: outputType })
          resolve(croppedFile)
        },
        outputType,
        quality,
      )
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

    const readableSize =
      croppedFile.size >= 1024 * 1024
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

  // 先进行表单验证，验证失败时提示用户并保持在编辑界面
  try {
    await formRef.value.validate()
  } catch {
    ElMessage.warning('请填写所有必填项')
    return // 验证失败，保持在编辑界面不退出
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let loadingMessage: any = null

  try {
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
      email: editUserInfo.email,
    }
    // 调用更新接口
    await updateUserInfo(updateData)

    // 关闭加载提示
    loadingMessage?.close?.()

    // 保存成功后把编辑副本同步到展示数据并退出编辑模式
    Object.assign(userInfo, editUserInfo)
    isEditing.value = false

    // 同步更新 localStorage 中的 userInfo，以便 Header 等组件能获取最新数据
    try {
      // 直接将最新的 editUserInfo 同步到缓存
      localStorage.setItem('userInfo', JSON.stringify({ ...editUserInfo }))
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
    isChangingPwd.value = true

    // 调用修改密码接口
    await changePassword({
      oldPassword: pwdForm.oldPassword,
      newPassword: pwdForm.newPassword,
    })

    ElMessage.success('密码修改成功，请重新登录')
    showChangePwdDialog.value = false

    // 清除Token并跳转到登录页
    localStorage.removeItem('token')
    window.location.href = '/login'
  } catch (error) {
    console.error('修改密码失败:', error)
    ElMessage.error(getErrorMessage(error))
  } finally {
    isChangingPwd.value = false
  }
}

// 打开注销弹窗
const handleCancelAccount = () => {
  cancelAccountPassword.value = ''
  showCancelAccountDialog.value = true
}

// 确认注销账号
const confirmCancelAccount = async () => {
  if (!cancelAccountPassword.value) {
    ElMessage.warning('请输入密码确认注销')
    return
  }

  try {
    isCancellingAccount.value = true
    // 调用注销接口
    const cancelData: CancelAccountRequest = {
      password: cancelAccountPassword.value,
    }
    await cancelAccount(cancelData)

    ElMessage.success('账号注销成功')

    // 清除Token并跳转到首页
    localStorage.removeItem('token')
    window.location.href = '/'
  } catch (error) {
    console.error('注销账号失败:', error)
    ElMessage.error('注销失败: ' + getErrorMessage(error))
  } finally {
    isCancellingAccount.value = false
  }
}

// 初始化
onMounted(() => {
  // 优先从 localStorage 加载缓存数据，实现秒开体验
  const cached = localStorage.getItem('userInfo')
  if (cached) {
    try {
      const data = JSON.parse(cached)
      Object.assign(userInfo, data)
      Object.assign(editUserInfo, data)
    } catch (e) {
      console.warn('解析缓存用户信息失败', e)
    }
  }
  // 随后从后端获取最新数据进行校验和更新
  fetchUserInfo()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.modern-profile-page {
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
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

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
.section-card,
.info-item,
.avatar-section {
  animation: slideFadeBlurIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  animation-play-state: paused;
}

/* 交错延迟效果 */
.avatar-section {
  animation-delay: 0.05s;
}
.info-item:nth-child(1),
.edit-form :deep(.el-form-item:nth-child(1)) {
  animation-delay: 0.1s;
}
.info-item:nth-child(2),
.edit-form :deep(.el-form-item:nth-child(2)) {
  animation-delay: 0.15s;
}
.info-item:nth-child(3),
.edit-form :deep(.el-form-item:nth-child(3)) {
  animation-delay: 0.2s;
}
.info-item:nth-child(4),
.edit-form :deep(.el-form-item:nth-child(4)) {
  animation-delay: 0.25s;
}
.info-item:nth-child(5),
.edit-form :deep(.el-form-item:nth-child(5)) {
  animation-delay: 0.3s;
}

.is-visible {
  animation-play-state: running;
}

/* --- Header --- */
.page-header {
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

/* --- Content --- */
.profile-content {
  margin: 0 auto;
}

.section-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 40px;
  box-shadow: var(--card-shadow);
  transition: all 0.3s ease;
}

.section-card:hover {
  box-shadow: var(--card-hover-shadow);
}

/* --- Layout --- */
.profile-layout {
  display: flex;
  gap: 60px;
  align-items: flex-start;
}

.avatar-section {
  flex-shrink: 0;
  width: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.info-section {
  flex: 1;
  max-width: 600px;
}

/* --- Avatar --- */
.avatar-wrapper {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid #fff;
  box-shadow:
    0 0 0 1px var(--border-color),
    0 10px 20px rgba(0, 0, 0, 0.05);
  background-color: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s ease;
}

.avatar-wrapper.upload-mode {
  cursor: pointer;
}

.avatar-wrapper.upload-mode:hover {
  box-shadow:
    0 0 0 2px var(--accent-color),
    0 10px 25px rgba(79, 70, 229, 0.15);
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-edit-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.45);
  color: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  opacity: 0;
  transition: all 0.3s ease;
  font-size: 13px;
  font-weight: 500;
}

.avatar-wrapper.upload-mode:hover .avatar-mask {
  opacity: 1;
}

.avatar-mask .el-icon {
  font-size: 24px;
}

.avatar-placeholder-icon {
  font-size: 40px;
  color: var(--text-tertiary);
}

.avatar-uploader {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
}

.upload-text {
  font-size: 12px;
  font-weight: 500;
}

.avatar-tip {
  font-size: 12px;
  color: var(--text-tertiary);
  text-align: center;
}

/* --- Info Grid (View Mode) --- */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-item .label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-item .value {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  min-height: 24px;
}

/* --- Form (Edit Mode) --- */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 24px; /* 第一个值是行间距（上下），第二个是列间距（左右） */
  margin-bottom: 10px;
}

.edit-form :deep(.el-form-item) {
  margin-bottom: 12px; /* 减小每个表单项底部的外边距 */
}

.edit-form :deep(.el-form-item__label) {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  padding-bottom: 2px; /* 减小标签与输入框之间的间距 */
}

.edit-form :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--border-color) inset;
  border-radius: 8px;
  padding: 4px 12px; /* 减小上下内边距 */
  height: 24px; /* 直接设置较小的高度 */
  transition: all 0.2s;
}

.edit-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px var(--accent-color) inset !important;
}

/* --- Actions --- */
.action-bar {
  display: flex;
  gap: 16px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
  align-items: center;
}

/* Beam Effect for Save Button */
.beam-container {
  position: relative;
  border-radius: 8px;
  padding: 2px;
  overflow: hidden;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.beam-border {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: conic-gradient(
    transparent,
    rgba(79, 70, 229, 0.3),
    var(--accent-color),
    rgba(79, 70, 229, 0.3),
    transparent 30%
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

.beam-container.danger .beam-border {
  background: conic-gradient(
    transparent,
    rgba(239, 68, 68, 0.3),
    var(--danger-color),
    rgba(239, 68, 68, 0.3),
    transparent 30%
  );
}

.primary-btn-beam {
  position: relative;
  background: var(--text-primary);
  color: #fff;
  border: none;
  border-radius: 6px;
  height: 36px;
  padding: 0 24px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.5px;
  cursor: pointer;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  white-space: nowrap;
}

.primary-btn-beam:hover {
  background: #000;
}

.primary-btn-beam.danger {
  background: var(--danger-color);
}

.primary-btn-beam.danger:hover {
  background: #dc2626;
}

.primary-btn-beam:disabled {
  cursor: not-allowed;
  opacity: 0.8;
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

.custom-btn.danger {
  color: var(--danger-color);
  border-color: #fee2e2;
  background: #fef2f2;
}

.custom-btn.danger:hover {
  background: #fee2e2;
  border-color: #fecaca;
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

/* Responsive */
@media (max-width: 768px) {
  .profile-layout {
    flex-direction: column;
    align-items: center;
    gap: 30px;
  }

  .info-section {
    width: 100%;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .action-bar {
    flex-wrap: wrap;
  }
}
</style>
