import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ProductDetail } from '@/api/model/productModel'

export interface CartItem {
  skuId: number
  productId: number
  name: string
  imgUrl: string
  specs: Record<string, string> // e.g. { "硬盘": "1T", "显卡": "RTX 5060" }
  price: number
  count: number
}

export const useCartStore = defineStore(
  'cart',
  () => {
    const items = ref<CartItem[]>([])

    // Getters
    const totalCount = computed(() => {
      return items.value.reduce((sum, item) => sum + item.count, 0)
    })

    const totalPrice = computed(() => {
      // 解决浮点数精度问题：先转整数计算，再转回小数
      const totalCent = items.value.reduce((sum, item) => {
        return sum + Math.round(item.price * 100) * item.count
      }, 0)
      return totalCent / 100
    })

    // Actions
    function addToCart(product: ProductDetail, skuId: number, count: number) {
      // 1. 找到对应的 SKU 信息
      const sku = product.skus.find((s) => s.id === skuId)
      if (!sku) {
        console.error('SKU not found:', skuId)
        return
      }

      // 2. 检查购物车是否已存在该 SKU
      const existingItem = items.value.find((item) => item.skuId === skuId)

      if (existingItem) {
        existingItem.count += count
      } else {
        items.value.push({
          skuId: sku.id,
          productId: product.id,
          name: product.name,
          imgUrl: product.mainImages[0] || '', // 使用主图的第一张
          specs: sku.specs,
          price: sku.price,
          count: count,
        })
      }
    }

    function removeFromCart(skuId: number) {
      const index = items.value.findIndex((item) => item.skuId === skuId)
      if (index > -1) {
        items.value.splice(index, 1)
      }
    }

    function updateQuantity(skuId: number, count: number) {
      const item = items.value.find((item) => item.skuId === skuId)
      if (item) {
        item.count = count
      }
    }

    function clearCart() {
      items.value = []
    }

    return {
      items,
      totalCount,
      totalPrice,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
    }
  },
  {
    persist: true, // 开启持久化
  },
)
