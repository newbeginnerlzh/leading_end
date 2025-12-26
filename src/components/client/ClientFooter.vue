<template>
  <footer class="footer-container">
    <div class="footer-content">
      <!-- 顶部链接区域 -->
      <div class="footer-top">
        <!-- 关于我们 -->
        <div class="footer-column">
          <h4 class="footer-title">关于我们</h4>
          <ul class="footer-links">
            <li><a href="#" @click.prevent>公司简介</a></li>
            <li><a href="#" @click.prevent>企业文化</a></li>
            <li><a href="#" @click.prevent>加入我们</a></li>
            <li><a href="#" @click.prevent>联系方式</a></li>
          </ul>
        </div>

        <!-- 购物指南 -->
        <div class="footer-column">
          <h4 class="footer-title">购物指南</h4>
          <ul class="footer-links">
            <li><router-link to="/products">商品分类</router-link></li>
            <li><router-link to="/cart">购物车</router-link></li>
            <li><router-link to="/user/orders">订单查询</router-link></li>
            <li><a href="#" @click.prevent>购物流程</a></li>
          </ul>
        </div>

        <!-- 售后服务 -->
        <div class="footer-column">
          <h4 class="footer-title">售后服务</h4>
          <ul class="footer-links">
            <li><router-link to="/service">在线客服</router-link></li>
            <li><a href="#" @click.prevent>退换货政策</a></li>
            <li><a href="#" @click.prevent>保修说明</a></li>
            <li><a href="#" @click.prevent>常见问题</a></li>
          </ul>
        </div>

        <!-- 配送与支付 -->
        <div class="footer-column">
          <h4 class="footer-title">配送与支付</h4>
          <ul class="footer-links">
            <li><a href="#" @click.prevent>配送方式</a></li>
            <li><a href="#" @click.prevent>运费说明</a></li>
            <li><a href="#" @click.prevent>支付方式</a></li>
            <li><router-link to="/user/address">收货地址</router-link></li>
          </ul>
        </div>

        <!-- 用户中心 -->
        <div class="footer-column">
          <h4 class="footer-title">用户中心</h4>
          <ul class="footer-links">
            <li><router-link to="/user/profile">个人中心</router-link></li>
            <li><router-link to="/user/orders">我的订单</router-link></li>
            <li><router-link to="/user/address">地址管理</router-link></li>
            <li><a href="#" @click.prevent>账户安全</a></li>
          </ul>
        </div>

        <!-- 联系我们 -->
        <div class="footer-column contact-column">
          <h4 class="footer-title">联系我们</h4>
          <div class="contact-info">
            <p>
              <el-icon><Phone /></el-icon>
              <span>客服热线：400-100-6000</span>
            </p>
            <p>
              <el-icon><Message /></el-icon>
              <span>邮箱：service@lenovo.com</span>
            </p>
            <p>
              <el-icon><Clock /></el-icon>
              <span>工作时间：9:00-18:00</span>
            </p>
          </div>
        </div>
      </div>

      <!-- 分隔线 -->
      <div class="footer-divider"></div>

      <!-- 底部版权区域 -->
      <div class="footer-bottom">
        <div class="copyright">
          <p>© {{ currentYear }} 联想商城 All Rights Reserved</p>
          <p class="secondary-text">
            <a href="#" @click.prevent>京ICP备12345678号</a>
            <span class="separator">|</span>
            <a href="#" @click.prevent>营业执照</a>
            <span class="separator">|</span>
            <a href="#" @click.prevent>隐私政策</a>
            <span class="separator">|</span>
            <a href="#" @click.prevent>用户协议</a>
          </p>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Phone, Message, Clock } from '@element-plus/icons-vue'

// 动态获取当前年份
const currentYear = computed(() => new Date().getFullYear())
</script>

<style scoped>
.footer-container {
  width: 100%;
  background: linear-gradient(to bottom, #2e1a47, #1a0f2e);
  color: #b3b3b3;
  margin-top: 60px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.footer-content {
  max-width: 1240px;
  margin: 0 auto;
  padding: 50px 20px 30px;
}

/* 顶部链接区域 */
.footer-top {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 40px;
  margin-bottom: 40px;
}

.footer-column {
  display: flex;
  flex-direction: column;
}

.footer-title {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 20px;
  position: relative;
  padding-bottom: 10px;
}

.footer-title::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 40px;
  height: 2px;
  background: linear-gradient(to right, #a855f7, transparent);
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-links li {
  margin-bottom: 12px;
  transition: transform 0.2s;
}

.footer-links li:hover {
  transform: translateX(5px);
}

.footer-links a {
  color: #b3b3b3;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s;
  display: inline-block;
}

.footer-links a:hover {
  color: #a855f7;
}

/* 联系我们区域 */
.contact-column .contact-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.contact-info p {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 14px;
  color: #b3b3b3;
}

.contact-info .el-icon {
  color: #a855f7;
  font-size: 16px;
}

/* 分隔线 */
.footer-divider {
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1), transparent);
  margin: 30px 0;
}

/* 底部版权区域 */
.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  padding-top: 20px;
}

.copyright {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.copyright p {
  margin: 0;
  font-size: 14px;
  color: #808080;
}

.secondary-text {
  font-size: 12px !important;
  color: #666 !important;
}

.secondary-text a {
  color: #666;
  text-decoration: none;
  transition: color 0.3s;
}

.secondary-text a:hover {
  color: #a855f7;
}

.separator {
  margin: 0 8px;
  color: #444;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .footer-top {
    grid-template-columns: repeat(2, 1fr);
    gap: 30px;
  }

  .footer-bottom {
    flex-direction: column;
    text-align: center;
  }

  .payment-methods {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .footer-top {
    grid-template-columns: 1fr;
  }

  .footer-content {
    padding: 40px 15px 20px;
  }
}
</style>
