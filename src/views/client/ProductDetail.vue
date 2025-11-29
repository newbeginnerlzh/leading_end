<script setup lang="ts">
import { onMounted } from 'vue'

// ... 其他代码 ...

const fetchProductDetail = async () => {
  // 1. 模拟请求后端数据
  const product = { name: 'ThinkPad X1 Carbon 2024' } // 假设这是后端返回的

  // 2. 数据回来后，修改浏览器标题
  document.title = `${product.name} - 联想商城`
}

onMounted(() => {
  fetchProductDetail()
})
</script>
