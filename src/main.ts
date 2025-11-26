import { createApp } from 'vue'
import { createPinia } from 'pinia'

import 'element-plus/theme-chalk/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.config.globalProperties.$ELEMENT = {
  locale: zhCn,
}

app.mount('#app')
