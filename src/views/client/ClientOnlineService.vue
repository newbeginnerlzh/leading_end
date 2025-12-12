<template>
  <div class="service-page">
    <div class="chat-container">
      <!-- 左侧：信息栏 -->
      <div class="chat-sidebar">
        <div class="agent-card">
          <el-avatar :size="60" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
          <div class="agent-info">
            <h3>专属客服-小联</h3>
            <div class="status">
              <span class="dot"></span> 在线中
            </div>
          </div>
        </div>
        
        <div class="faq-section">
          <h4>常见问题</h4>
          <ul class="faq-list">
            <li v-for="(q, index) in faqList" :key="index" @click="sendQuickMessage(q)">
              {{ q }}
            </li>
          </ul>
        </div>
        
        <div class="sidebar-footer">
          <p>服务时间：9:00 - 22:00</p>
          <p>客服热线：400-888-8888</p>
        </div>
      </div>

      <!-- 右侧：聊天窗口 -->
      <div class="chat-window">
        <!-- 头部 -->
        <div class="chat-header">
          <div class="header-left">
            <span class="title">联想官方客服</span>
            <el-tag size="small" type="success" effect="dark" round>官方认证</el-tag>
          </div>
          <el-button text bg circle size="small">
            <el-icon><MoreFilled /></el-icon>
          </el-button>
        </div>

        <!-- 消息列表区域 -->
        <div class="message-list" ref="messageListRef">
          <div class="time-stamp">今天 {{ currentTime }}</div>
          
          <div 
            v-for="(msg, index) in messages" 
            :key="index" 
            class="message-row"
            :class="{ 'message-mine': msg.role === 'user', 'message-admin': msg.role === 'admin' }"
          >
            <!-- 客服头像 (左侧) -->
            <el-avatar 
              v-if="msg.role === 'admin'" 
              :size="36" 
              src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" 
              class="msg-avatar" 
            />
            
            <!-- 消息气泡 -->
            <div class="bubble-wrapper">
              <div class="bubble">
                {{ msg.content }}
              </div>
            </div>

            <!-- 用户头像 (右侧) -->
            <el-avatar 
              v-if="msg.role === 'user'" 
              :size="36" 
              src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png" 
              class="msg-avatar" 
            />
          </div>
        </div>

        <!-- 底部输入框 -->
        <div class="chat-input-area">
          <div class="toolbar">
            <el-tooltip content="发送图片" placement="top">
              <el-icon class="tool-icon"><Picture /></el-icon>
            </el-tooltip>
            <el-tooltip content="发送表情" placement="top">
              <el-icon class="tool-icon"><Orange /></el-icon>
            </el-tooltip>
          </div>
          
          <el-input
            v-model="inputContent"
            type="textarea"
            :rows="3"
            placeholder="请输入您的问题..."
            resize="none"
            class="msg-input"
            @keydown.enter.prevent="handleSend"
          />
          
          <div class="send-action">
            <span class="tip">按 Enter 发送</span>
            <el-button type="primary" @click="handleSend" :disabled="!inputContent.trim()">发送</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { MoreFilled, Picture, Orange } from '@element-plus/icons-vue'
import dayjs from 'dayjs' // 如果项目中没有dayjs，可以直接用 new Date() 格式化

// --- 状态定义 ---
const inputContent = ref('')
const messageListRef = ref<HTMLDivElement | null>(null)
const currentTime = dayjs().format('HH:mm')

interface Message {
  role: 'admin' | 'user'
  content: string
  time: string
}

// 模拟聊天记录
const messages = ref<Message[]>([
  { 
    role: 'admin', 
    content: '您好，我是联想官方客服小联，请问有什么可以帮您？', 
    time: dayjs().format('HH:mm') 
  }
])

const faqList = [
  '如何查询物流进度？',
  'ThinkBook 14+ 有现货吗？',
  '支持分期付款吗？',
  '退换货政策是什么？',
  '如何申请开具发票？'
]

// --- 方法 ---

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick()
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  }
}

// 发送消息
const handleSend = () => {
  const text = inputContent.value.trim()
  if (!text) return

  // 1. 添加用户消息
  messages.value.push({
    role: 'user',
    content: text,
    time: dayjs().format('HH:mm')
  })
  
  inputContent.value = ''
  scrollToBottom()

  // 2. 模拟自动回复 (1秒后)
  setTimeout(() => {
    messages.value.push({
      role: 'admin',
      content: '收到您的问题，正在为您转接人工客服，请稍候...',
      time: dayjs().format('HH:mm')
    })
    scrollToBottom()
  }, 1000)
}

// 点击常见问题快速发送
const sendQuickMessage = (text: string) => {
  inputContent.value = text
  handleSend()
}

onMounted(() => {
  scrollToBottom()
})
</script>

<style scoped>
.service-page {
  width: 100%;
  min-height: calc(100vh - 64px); /* 减去 Header 高度 */
  background-color: #f0f2f5;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
}

.chat-container {
  width: 1000px;
  height: 700px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  display: flex;
  overflow: hidden;
}

/* --- 左侧侧边栏 --- */
.chat-sidebar {
  width: 280px;
  background: #f9fafe;
  border-right: 1px solid #eee;
  display: flex;
  flex-direction: column;
}

.agent-card {
  padding: 30px 20px;
  text-align: center;
  border-bottom: 1px solid #eee;
}

.agent-info h3 {
  margin: 15px 0 5px;
  font-size: 16px;
  color: #333;
}

.status {
  font-size: 12px;
  color: #67c23a;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.dot {
  width: 8px;
  height: 8px;
  background: #67c23a;
  border-radius: 50%;
  display: inline-block;
}

.faq-section {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.faq-section h4 {
  margin-bottom: 15px;
  font-size: 14px;
  color: #999;
}

.faq-list {
  list-style: none;
  padding: 0;
}

.faq-list li {
  padding: 10px 15px;
  background: #fff;
  margin-bottom: 10px;
  border-radius: 8px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  border: 1px solid #eee;
  transition: all 0.3s;
}

.faq-list li:hover {
  border-color: #409eff;
  color: #409eff;
  background: #ecf5ff;
}

.sidebar-footer {
  padding: 20px;
  text-align: center;
  font-size: 12px;
  color: #999;
  border-top: 1px solid #eee;
}

/* --- 右侧聊天窗口 --- */
.chat-window {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.chat-header {
  height: 60px;
  padding: 0 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left .title {
  font-size: 16px;
  font-weight: bold;
  margin-right: 10px;
}

.message-list {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #fbfbfb;
}

.time-stamp {
  text-align: center;
  font-size: 12px;
  color: #ccc;
  margin-bottom: 20px;
}

.message-row {
  display: flex;
  margin-bottom: 20px;
  align-items: flex-start;
}

.message-admin {
  justify-content: flex-start;
}

.message-mine {
  justify-content: flex-end;
}

.msg-avatar {
  flex-shrink: 0;
}

.bubble-wrapper {
  margin: 0 12px;
  max-width: 70%;
}

.bubble {
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  position: relative;
  word-break: break-all;
}

.message-admin .bubble {
  background: #fff;
  border: 1px solid #eee;
  color: #333;
  border-top-left-radius: 2px;
}

.message-mine .bubble {
  background: #409eff;
  color: #fff;
  border-top-right-radius: 2px;
}

/* --- 底部输入区 --- */
.chat-input-area {
  height: 160px;
  border-top: 1px solid #eee;
  padding: 10px 20px;
  display: flex;
  flex-direction: column;
}

.toolbar {
  margin-bottom: 5px;
}

.tool-icon {
  font-size: 20px;
  color: #666;
  cursor: pointer;
  margin-right: 15px;
  padding: 5px;
  border-radius: 4px;
}

.tool-icon:hover {
  background: #f5f5f5;
}

:deep(.msg-input .el-textarea__inner) {
  border: none;
  box-shadow: none;
  padding: 0;
  font-size: 14px;
  background: transparent;
}

.send-action {
  margin-top: auto;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
}

.tip {
  font-size: 12px;
  color: #999;
}
</style>