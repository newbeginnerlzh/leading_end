<!-- 登录/注册页：现代分栏设计 -->
<template>
  <div class="modern-login-page">
    <div class="login-wrapper" v-scroll-reveal>
      <!-- 左侧品牌区 -->
      <div class="branding-section">
        <div class="branding-content">
          <div class="logo-area">
            <div class="logo-icon">L</div>
            <h1 class="brand-name">Lenovo Mall</h1>
          </div>
          <div class="slogan">
            <h2>探索科技<br>无限可能</h2>
            <p>立即登录，开启您的智能生活之旅。</p>
          </div>
          <!-- 装饰圆环 -->
          <div class="circle circle-1"></div>
          <div class="circle circle-2"></div>
        </div>
      </div>

      <!-- 右侧表单区 -->
      <div class="form-section">
        <div class="form-container">
          <!-- 自定义 Tab 切换 -->
          <div class="custom-tabs" v-if="activeTab !== 'findPassword'">
            <div
              class="tab-item"
              :class="{ active: activeTab === 'login' }"
              @click="activeTab = 'login'"
            >
              用户登录
              <div class="active-bar"></div>
            </div>
            <div
              class="tab-item"
              :class="{ active: activeTab === 'register' }"
              @click="activeTab = 'register'"
            >
              账号注册
              <div class="active-bar"></div>
            </div>
          </div>
          <div class="tab-header-title" v-else>
            <span class="back-link" @click="activeTab = 'login'">
              <i class="el-icon-back"></i> 返回登录
            </span>
            <h3>重置密码</h3>
          </div>

          <!-- 表单内容区域 -->
          <div class="form-content-wrapper">

            <!-- 登录表单 -->
            <div v-show="activeTab === 'login'" class="form-pane fade-in">
              <el-form :model="loginForm" :rules="loginRules" ref="loginFormRef" class="modern-form" size="large">
                <el-form-item prop="account">
                  <el-input
                    v-model="loginForm.account"
                    placeholder="请输入手机号"
                    prefix-icon="User"
                    class="custom-input"
                  ></el-input>
                </el-form-item>
                <el-form-item prop="password">
                  <el-input
                    v-model="loginForm.password"
                    placeholder="请输入密码"
                    type="password"
                    prefix-icon="Lock"
                    show-password
                    class="custom-input"
                  ></el-input>
                </el-form-item>

                <div class="form-extras">
                  <span class="forgot-pwd" @click="activeTab = 'findPassword'">忘记密码？</span>
                </div>

                <el-form-item class="action-item">
                  <div class="beam-container">
                    <div class="beam-border"></div>
                    <button class="primary-btn-beam" @click.prevent="handleLogin">
                      登 录
                    </button>
                  </div>
                </el-form-item>
              </el-form>
            </div>

            <!-- 注册表单 -->
            <div v-show="activeTab === 'register'" class="form-pane fade-in">
              <el-form :model="registerForm" :rules="registerRules" ref="registerFormRef" class="modern-form" size="large">
                <el-form-item prop="phone">
                  <el-input
                    v-model="registerForm.phone"
                    placeholder="请输入手机号"
                    prefix-icon="Phone"
                    class="custom-input"
                  ></el-input>
                </el-form-item>
                <el-form-item prop="code">
                  <div class="code-row">
                    <el-input
                      v-model="registerForm.code"
                      placeholder="验证码"
                      prefix-icon="Message"
                      class="custom-input code-input"
                    ></el-input>
                    <button
                      class="code-btn-custom"
                      :disabled="codeDisabled"
                      @click.prevent="getCode"
                    >
                      {{ codeText }}
                    </button>
                  </div>
                </el-form-item>
                <el-form-item prop="password">
                  <el-input
                    v-model="registerForm.password"
                    placeholder="设置密码 (不少于6位)"
                    type="password"
                    prefix-icon="Lock"
                    show-password
                    class="custom-input"
                  ></el-input>
                </el-form-item>
                <el-form-item prop="agreeProtocol">
                  <el-checkbox v-model="registerForm.agreeProtocol">
                    我已阅读并同意<a href="#" class="protocol-link">《用户协议》</a>
                  </el-checkbox>
                </el-form-item>
                <el-form-item class="action-item">
                  <div class="beam-container">
                    <div class="beam-border"></div>
                    <button class="primary-btn-beam" @click.prevent="handleRegister">
                      注 册
                    </button>
                  </div>
                </el-form-item>
              </el-form>
            </div>

            <!-- 找回密码表单 -->
            <div v-show="activeTab === 'findPassword'" class="form-pane fade-in">
              <el-form :model="findPwdForm" :rules="findPwdRules" ref="findPwdFormRef" class="modern-form" size="large">
                <el-form-item prop="phone">
                  <el-input
                    v-model="findPwdForm.phone"
                    placeholder="请输入手机号"
                    prefix-icon="Phone"
                    class="custom-input"
                  ></el-input>
                </el-form-item>
                <el-form-item prop="code">
                  <div class="code-row">
                    <el-input
                      v-model="findPwdForm.code"
                      placeholder="验证码"
                      prefix-icon="Message"
                      class="custom-input code-input"
                    ></el-input>
                    <button
                      class="code-btn-custom"
                      :disabled="findPwdCodeDisabled"
                      @click.prevent="getFindPwdCode"
                    >
                      {{ findPwdCodeText }}
                    </button>
                  </div>
                </el-form-item>
                <el-form-item prop="newPassword">
                  <el-input
                    v-model="findPwdForm.newPassword"
                    placeholder="请输入新密码"
                    type="password"
                    prefix-icon="Lock"
                    show-password
                    class="custom-input"
                  ></el-input>
                </el-form-item>
                <el-form-item class="action-item">
                  <div class="beam-container">
                    <div class="beam-border"></div>
                    <button class="primary-btn-beam" @click.prevent="handleFindPassword">
                      重置密码
                    </button>
                  </div>
                </el-form-item>
              </el-form>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormItemRule } from 'element-plus'
import { login, register, findPassword } from '@/api/user'
import type {
  LoginRequest,
  RegisterRequest,
  FindPasswordRequest
} from '@/api/model/userModel'
import { useCartStore } from '@/stores/cart'

// Scroll Reveal Directive (Simple version)
const vScrollReveal = {
  mounted: (el: HTMLElement) => {
    el.style.opacity = '0'
    el.style.transform = 'translateY(20px)'
    setTimeout(() => {
      el.style.transition = 'all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)'
      el.style.opacity = '1'
      el.style.transform = 'translateY(0)'
    }, 100)
  }
}

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
  password: '',
})

// 注册表单
const registerForm = reactive<RegisterRequest>({
  phone: '',
  password: '',
  code: '',
  agreeProtocol: false,
})

// 找回密码表单
const findPwdForm = reactive<FindPasswordRequest>({
  phone: '',
  code: '',
  newPassword: '',
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
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
  ],
})

// 注册验证规则
const registerRules = reactive({
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码长度为6位', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
  ],
  agreeProtocol: [
    {
      validator: (
        _rule: FormItemRule,
        value: boolean,
        callback: (error?: string | Error) => void,
      ) => {
        if (value) {
          callback()
        } else {
          callback(new Error('请同意用户协议'))
        }
      },
      trigger: 'change',
    },
  ],
})

// 找回密码验证规则
const findPwdRules = reactive({
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码长度为6位', trigger: 'blur' },
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
  ],
})

// 初始化
onMounted(() => {
  // 根据URL参数切换标签页
  const type = route.query.type as string
  if (type === 'register') activeTab.value = 'register'
  if (type === 'findPassword') activeTab.value = 'findPassword'
})

const navigateAfterAuth = () => {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : undefined
  if (redirect) {
    router.replace(redirect)
    return
  }
  router.push('/')
}

// 获取注册验证码
const getCode = () => {
  if (!registerForm.phone) {
    ElMessage.warning('请先输入手机号')
    return
  }

  // 模拟验证码倒计时
  codeDisabled.value = true
  let count = 60
  codeText.value = `${count}s`

  const timer = setInterval(() => {
    count--
    codeText.value = `${count}s`
    if (count <= 0) {
      clearInterval(timer)
      codeDisabled.value = false
      codeText.value = '获取验证码'
    }
  }, 1000)

  // TODO: 调用获取验证码接口
  ElMessage.success('验证码已发送')
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
  findPwdCodeText.value = `${count}s`

  const timer = setInterval(() => {
    count--
    findPwdCodeText.value = `${count}s`
    if (count <= 0) {
      clearInterval(timer)
      findPwdCodeDisabled.value = false
      findPwdCodeText.value = '获取验证码'
    }
  }, 1000)

  // TODO: 调用获取验证码接口
  ElMessage.success('验证码已发送')
}

// 处理登录
const handleLogin = async () => {
  if (!loginFormRef.value) return

  try {
    await loginFormRef.value.validate()

    // 调用登录接口
    const { data: payload } = await login(loginForm)

    // 保存Token和用户信息
    localStorage.setItem('token', payload.token)
    localStorage.setItem('userInfo', JSON.stringify(payload.userInfo))

    // 触发自定义事件通知 Header 等组件更新用户名显示
    window.dispatchEvent(new CustomEvent('userInfoUpdated'))

    ElMessage.success('登录成功')
    // 设置购物车用户ID（优先 uid，回退到 id）
    const cartStore = useCartStore()

    if (localStorage.userInfo.id !== undefined) {
      cartStore.setUser(localStorage.userInfo.id)
    }

    const userInfoRecord = payload.userInfo as unknown as Record<string, unknown>
    const uidNum = (userInfoRecord['uid'] ?? userInfoRecord['id']) as number | string | undefined
    if (uidNum != null) {
      const idArg = typeof uidNum === 'number' ? String(uidNum) : (uidNum as string)
      ;(cartStore as unknown as { setUser: (id: string) => void }).setUser(idArg)
    }
    navigateAfterAuth()
  } catch (error) {
    // 如果是后端返回的 BaseResponse 错误对象，优雅展示错误信息
    if (error && typeof error === 'object' && 'message' in error) {
      const m = (error as { message?: unknown }).message
      if (typeof m === 'string' && m.length > 0) {
        //ElMessage.error(m)
        return
      }
    }

    console.error('登录失败:', error)
  }
}

// 处理注册
const handleRegister = async () => {
  if (!registerFormRef.value) return

  try {
    await registerFormRef.value.validate()

    // 构造严格的注册请求体以满足后端 OpenAPI 要求
    const reqBody = {
      phone: String(registerForm.phone),
      password: String(registerForm.password),
      code: String(registerForm.code),
      agreeProtocol: Boolean(registerForm.agreeProtocol),
    }

    // 调用注册接口
    await register(reqBody)

    ElMessage.success('注册成功，请使用账号登录')

    // 完成注册后引导用户回到登录页
    activeTab.value = 'login'
    loginForm.account = String(registerForm.phone)
    loginForm.password = ''
  } catch (error) {
    // 如果是后端返回的 BaseResponse 错误对象，区分手机号重复与其他错误
    if (error && typeof error === 'object') {
      const statusValue = 'status' in error ? (error as { status?: unknown }).status : undefined
      const messageValue = 'message' in error ? (error as { message?: unknown }).message : undefined

      if (statusValue === '1003') {
        // 手机号已注册，提示但不当作错误
        const msg = typeof messageValue === 'string' && messageValue.length > 0 ? messageValue : '该手机号已注册'
        ElMessage.warning(msg)
        return
      }

      if (typeof messageValue === 'string' && messageValue.length > 0) {
        ElMessage.error(messageValue)
        return
      }
    }

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
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.modern-login-page {
  --bg-color: #f1f5f9;
  --accent-color: #4f46e5;
  --accent-hover: #4338ca;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --border-color: #e2e8f0;

  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-color);
  font-family: 'Inter', sans-serif;
  box-sizing: border-box;
}

.login-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 1000px;
  height: 600px;
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* --- Left Branding Section --- */
.branding-section {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  overflow: hidden;
}

.branding-content {
  position: relative;
  z-index: 2;
  padding: 40px;
  max-width: 360px;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 40px;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 24px;
}

.brand-name {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  letter-spacing: 0.5px;
}

.slogan h2 {
  font-size: 42px;
  font-weight: 800;
  line-height: 1.1;
  margin: 0 0 20px;
}

.slogan p {
  font-size: 16px;
  opacity: 0.9;
  line-height: 1.6;
}

/* Decorative Circles */
.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}
.circle-1 {
  width: 300px;
  height: 300px;
  top: -50px;
  right: -50px;
}
.circle-2 {
  width: 200px;
  height: 200px;
  bottom: -20px;
  left: -40px;
}

/* --- Right Form Section --- */
.form-section {
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.form-container {
  width: 100%;
  max-width: 360px;
}

/* Custom Tabs */
.custom-tabs {
  display: flex;
  gap: 32px;
  margin-bottom: 32px;
  border-bottom: 1px solid var(--border-color);
}

.tab-item {
  padding-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  position: relative;
  transition: color 0.3s;
}

.tab-item.active {
  color: var(--accent-color);
}

.active-bar {
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--accent-color);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.tab-item.active .active-bar {
  transform: scaleX(1);
}

.tab-header-title {
  margin-bottom: 32px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-link {
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}
.back-link:hover {
  color: var(--accent-color);
}

.tab-header-title h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

/* Form Styling */
.modern-form :deep(.el-input__wrapper) {
  box-shadow: none !important;
  background: #f8fafc;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 8px 12px;
  transition: all 0.3s;
}

.modern-form :deep(.el-input__wrapper.is-focus) {
  background: #fff;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1) !important;
}

.modern-form :deep(.el-input__inner) {
  height: 32px;
  font-weight: 500;
}

.code-row {
  display: flex;
  gap: 12px;
}

.code-btn-custom {
  white-space: nowrap;
  padding: 0 16px;
  border: 1px solid var(--border-color);
  background: #fff;
  border-radius: 12px;
  color: var(--accent-color);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.code-btn-custom:hover:not(:disabled) {
  background: #f8fafc;
  border-color: var(--accent-color);
}
.code-btn-custom:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  color: var(--text-secondary);
}

.form-extras {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 24px;
}

.forgot-pwd {
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.2s;
}
.forgot-pwd:hover {
  color: var(--accent-color);
}

.protocol-link {
  color: var(--accent-color);
  text-decoration: none;
  font-weight: 600;
}

/* Action Item Full Width */
.action-item :deep(.el-form-item__content) {
  width: 100%;
  display: block;
}

/* Beam Button */
.beam-container {
  position: relative;
  border-radius: 99px;
  padding: 2px;
  overflow: hidden;
  background: #e2e8f0;
  margin-top: 8px;
  width: 100%;
  box-sizing: border-box;
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
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.primary-btn-beam {
  position: relative;
  width: 100%;
  background: var(--text-primary);
  color: #fff;
  border: none;
  border-radius: 99px;
  padding: 12px 0;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  z-index: 1;
  transition: transform 0.1s;
}

.primary-btn-beam:active {
  transform: scale(0.98);
}

/* Animation */
.fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Responsive */
@media (max-width: 900px) {
  .login-wrapper {
    grid-template-columns: 1fr;
    width: 100%;
    max-width: 450px;
    height: auto;
  }
  .branding-section {
    display: none;
  }
  .form-section {
    padding: 40px 20px;
  }
}
</style>
