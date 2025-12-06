<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-title">联想商城</div>
      <el-tabs v-model="activeTab" stretch>
        <!-- 登录标签页 -->
        <el-tab-pane label="用户登录" name="login">
          <el-form
            :model="loginForm"
            :rules="loginRules"
            ref="loginFormRef"
            class="login-form"
          >
            <el-form-item prop="account">
              <el-input
                v-model="loginForm.account"
                placeholder="请输入手机号"
                prefix-icon="User"
              ></el-input>
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="loginForm.password"
                placeholder="请输入密码"
                type="password"
                prefix-icon="Lock"
                show-password
              ></el-input>
            </el-form-item>
            <el-form-item class="form-actions">
              <el-button type="primary" @click="handleLogin" class="login-btn">登录</el-button>
              <div class="login-links">
                <el-button type="text" @click="activeTab = 'findPassword'">忘记密码？</el-button>
              </div>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 注册标签页 -->
        <el-tab-pane label="账号注册" name="register">
          <el-form
            :model="registerForm"
            :rules="registerRules"
            ref="registerFormRef"
            class="login-form"
          >
            <el-form-item prop="phone">
              <el-input
                v-model="registerForm.phone"
                placeholder="请输入手机号"
                prefix-icon="Phone"
              ></el-input>
            </el-form-item>
            <el-form-item prop="code">
              <el-row :gutter="10">
                <el-col :span="16">
                  <el-input
                    v-model="registerForm.code"
                    placeholder="请输入验证码"
                    prefix-icon="Message"
                  ></el-input>
                </el-col>
                <el-col :span="8">
                  <el-button
                    type="primary"
                    @click="getCode"
                    :disabled="codeDisabled"
                    class="code-btn"
                  >
                    {{ codeText }}
                  </el-button>
                </el-col>
              </el-row>
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="registerForm.password"
                placeholder="请输入密码"
                type="password"
                prefix-icon="Lock"
                show-password
              ></el-input>
            </el-form-item>
            <el-form-item prop="agreeProtocol">
              <el-checkbox v-model="registerForm.agreeProtocol">
                我已阅读并同意<a href="#" class="protocol-link">《用户协议》</a>
              </el-checkbox>
            </el-form-item>
            <el-form-item class="form-actions">
              <el-button type="primary" @click="handleRegister" class="login-btn">注册</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 找回密码标签页 -->
        <el-tab-pane label="找回密码" name="findPassword">
          <el-form
            :model="findPwdForm"
            :rules="findPwdRules"
            ref="findPwdFormRef"
            class="login-form"
          >
            <el-form-item prop="phone">
              <el-input
                v-model="findPwdForm.phone"
                placeholder="请输入手机号"
                prefix-icon="Phone"
              ></el-input>
            </el-form-item>
            <el-form-item prop="code">
              <el-row :gutter="10">
                <el-col :span="16">
                  <el-input
                    v-model="findPwdForm.code"
                    placeholder="请输入验证码"
                    prefix-icon="Message"
                  ></el-input>
                </el-col>
                <el-col :span="8">
                  <el-button
                    type="primary"
                    @click="getFindPwdCode"
                    :disabled="findPwdCodeDisabled"
                    class="code-btn"
                  >
                    {{ findPwdCodeText }}
                  </el-button>
                </el-col>
              </el-row>
            </el-form-item>
            <el-form-item prop="newPassword">
              <el-input
                v-model="findPwdForm.newPassword"
                placeholder="请输入新密码"
                type="password"
                prefix-icon="Lock"
                show-password
              ></el-input>
            </el-form-item>
            <el-form-item class="form-actions">
              <el-button type="primary" @click="handleFindPassword" class="login-btn">重置密码</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormItemRule } from 'element-plus'
import { login, register, findPassword } from '@/api/user'
import type { LoginRequest, RegisterRequest, FindPasswordRequest } from '@/api/model/userModel'

const route = useRoute()
const router = useRouter()

// 标签页状态
const activeTab = ref('login')

// 表单引用
const loginFormRef = ref()
const registerFormRef = ref()
const findPwdFormRef = ref()

// 登录表单
const loginForm = reactive<LoginRequest>({
  account: '',
  password: ''
})

// 注册表单
const registerForm = reactive<RegisterRequest>({
  phone: '',
  password: '',
  code: '',
  agreeProtocol: false
})

// 找回密码表单
const findPwdForm = reactive<FindPasswordRequest>({
  phone: '',
  code: '',
  newPassword: ''
})

// 验证码倒计时
const codeDisabled = ref(false)
const codeText = ref('获取验证码')
const findPwdCodeDisabled = ref(false)
const findPwdCodeText = ref('获取验证码')

// 登录验证规则
const loginRules = reactive({
  account: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
})

// 注册验证规则
const registerRules = reactive({
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码长度为6位', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  agreeProtocol: [
    { validator: (_rule: FormItemRule, value: boolean, callback: (error?: string | Error) => void) => {
      if (value) {
        callback()
      } else {
        callback(new Error('请同意用户协议'))
      }
    }, trigger: 'change' }
  ]
})

// 找回密码验证规则
const findPwdRules = reactive({
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码长度为6位', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
})

// 初始化
onMounted(() => {
  // 根据URL参数切换标签页
  const type = route.query.type as string
  if (type === 'register') activeTab.value = 'register'
  if (type === 'findPassword') activeTab.value = 'findPassword'
})

// 获取注册验证码
const getCode = () => {
  if (!registerForm.phone) {
    ElMessage.warning('请先输入手机号')
    return
  }

  // 模拟验证码倒计时
  codeDisabled.value = true
  let count = 60
  codeText.value = `${count}s后重新获取`

  const timer = setInterval(() => {
    count--
    codeText.value = `${count}s后重新获取`
    if (count <= 0) {
      clearInterval(timer)
      codeDisabled.value = false
      codeText.value = '获取验证码'
    }
  }, 1000)

  // TODO: 调用获取验证码接口
  ElMessage.success('验证码已发送，请注意查收')
}

// 获取找回密码验证码
const getFindPwdCode = () => {
  if (!findPwdForm.phone) {
    ElMessage.warning('请先输入手机号')
    return
  }

  // 模拟验证码倒计时
  findPwdCodeDisabled.value = true
  let count = 60
  findPwdCodeText.value = `${count}s后重新获取`

  const timer = setInterval(() => {
    count--
    findPwdCodeText.value = `${count}s后重新获取`
    if (count <= 0) {
      clearInterval(timer)
      findPwdCodeDisabled.value = false
      findPwdCodeText.value = '获取验证码'
    }
  }, 1000)

  // TODO: 调用获取验证码接口
  ElMessage.success('验证码已发送，请注意查收')
}

// 处理登录
const handleLogin = async () => {
  if (!loginFormRef.value) return

  try {
    await loginFormRef.value.validate()

    // 调用登录接口
    const res = await login(loginForm)

    // 保存Token和用户信息
    localStorage.setItem('token', res.data.data.token)
    localStorage.setItem('userInfo', JSON.stringify(res.data.data.userInfo))

    ElMessage.success('登录成功')

    // 跳转到首页
    router.push('/')
  } catch (error) {
    console.error('登录失败:', error)
    // 登录失败不重复提示（接口拦截器已处理）
  }
}

// 处理注册
const handleRegister = async () => {
  if (!registerFormRef.value) return

  try {
    await registerFormRef.value.validate()

    // 调用注册接口
    const res = await register(registerForm)

    // 保存Token和用户信息
    localStorage.setItem('token', res.data.data.token)
    localStorage.setItem('userInfo', JSON.stringify(res.data.data.userInfo))

    ElMessage.success('注册成功')

    // 跳转到首页
    router.push('/')
  } catch (error) {
    console.error('注册失败:', error)
  }
}

// 处理找回密码
const handleFindPassword = async () => {
  if (!findPwdFormRef.value) return

  try {
    await findPwdFormRef.value.validate()

    // 调用找回密码接口
    await findPassword(findPwdForm)

    ElMessage.success('密码重置成功，请重新登录')

    // 切换到登录标签页
    activeTab.value = 'login'
    // 清空找回密码表单
    findPwdForm.phone = ''
    findPwdForm.code = ''
    findPwdForm.newPassword = ''
  } catch (error) {
    console.error('找回密码失败:', error)
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 64px);
  background-color: #f5f7fa;
  padding: 20px;
}

.login-box {
  width: 450px;
  padding: 30px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.login-title {
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #1f2329;
}

.login-form {
  margin-top: 20px;
}

.form-actions {
  margin-top: 10px;
}

.login-btn {
  width: 100%;
  padding: 12px 0;
}

.login-links {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.code-btn {
  width: 100%;
}

.protocol-link {
  color: #409eff;
  text-decoration: underline;
}
</style>
