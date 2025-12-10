<template>
  <div class="profile-container">
    <div class="profile-title">个人信息</div>

    <el-card>
      <el-form :model="userInfo" :rules="rules" ref="formRef" label-width="120px">
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
                <img v-if="userInfo.avatar" :src="userInfo.avatar" class="avatar" />
                <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
              </el-upload>
            </el-form-item>
          </el-col>

          <el-col :span="16">
            <el-form-item label="用户名">
              <el-input v-model="userInfo.username" disabled></el-input>
            </el-form-item>

            <el-form-item label="手机号">
              <el-input v-model="userInfo.phone" disabled></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="userInfo.gender">
            <el-radio label="男">男</el-radio>
            <el-radio label="女">女</el-radio>
            <el-radio label="保密">保密</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="出生日期" prop="birthday">
          <el-date-picker
            v-model="userInfo.birthday"
            type="date"
            placeholder="请选择出生日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          ></el-date-picker>
        </el-form-item>

        <el-form-item label="邮箱">
          <el-input v-model="userInfo.email" placeholder="选填"></el-input>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit">保存修改</el-button>
          <el-button type="warning" @click="showChangePwdDialog = true">修改密码</el-button>
          <el-button type="danger" @click="handleCancelAccount" style="margin-left: 10px">
            注销账号
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 修改密码弹窗 -->
    <el-dialog v-model="showChangePwdDialog" title="修改密码" width="400px">
      <el-form :model="pwdForm" :rules="pwdRules" ref="pwdFormRef" label-width="100px">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="pwdForm.oldPassword" type="password" show-password></el-input>
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="pwdForm.newPassword" type="password" show-password></el-input>
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input v-model="pwdForm.confirmPassword" type="password" show-password></el-input>
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
import type {
  UserInfo,
  UpdateUserInfoRequest,
  ChangePasswordRequest,
  CancelAccountRequest,
} from '@/api/model/userModel'

// 表单引用
const formRef = ref()
const pwdFormRef = ref()

// 用户信息
const userInfo = reactive<UserInfo>({})

// 修改密码弹窗
const showChangePwdDialog = ref(false)

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
    Object.assign(userInfo, res.data)
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

// 头像上传成功
const handleAvatarSuccess = (response: { data: { url: string } }) => {
  // 更新头像URL
  userInfo.avatar = response.data.url
  // 立即保存头像信息
  updateUserInfo({ avatar: response.data.url })
  ElMessage.success('头像上传成功')
}

// 头像上传前校验
const beforeAvatarUpload = (file: File) => {
  const isImage = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('上传头像只能是 JPG/PNG 格式!')
  }
  if (!isLt2M) {
    ElMessage.error('上传头像大小不能超过 2MB!')
  }

  return isImage && isLt2M
}

// 保存用户信息
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    // 构造更新参数
    const updateData: UpdateUserInfoRequest = {
      avatar: userInfo.avatar,
      gender: userInfo.gender,
      birthday: userInfo.birthday,
    }

    // 调用更新接口
    await updateUserInfo(updateData)

    ElMessage.success('信息修改成功')
  } catch (error) {
    console.error('修改信息失败:', error)
  }
}

// 修改密码
const handleChangePassword = async () => {
  if (!pwdFormRef.value) return

  try {
    await pwdFormRef.value.validate()

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
  }
}

// 注销账号
const handleCancelAccount = async () => {
  try {
    const password = await ElMessageBox.prompt('请输入密码确认注销账号', '注销账号', {
      inputType: 'password',
      confirmButtonText: '确认注销',
      cancelButtonText: '取消',
      type: 'warning',
    })

    // 调用注销接口
    const cancelData: CancelAccountRequest = {
      password: password.value,
    }
    await cancelAccount(cancelData)

    ElMessage.success('账号注销成功')

    // 清除Token并跳转到首页
    localStorage.removeItem('token')
    window.location.href = '/'
  } catch (error) {
    // 取消操作不提示错误
    if (error !== 'cancel') {
      let msg = '密码错误'
      const e = error as unknown
      if (e && typeof e === 'object' && 'message' in e) {
        const m = (e as { message?: unknown }).message
        if (typeof m === 'string' && m.length > 0) msg = m
      }
      ElMessage.error('注销失败: ' + msg)
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
  width: 150px;
  height: 150px;
  display: block;
  object-fit: cover;
}
</style>
