import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { ProductDetail } from '@/api/model/productModel'
import {
  getCartList,
  addToCart as addToCartApi,
  updateCartItem,
  deleteCartItemBySku,
  batchUpdateSelected,
  getCartCount,
} from '@/api/cart'

export interface CartItem {
  id?: number // 购物车条目ID（后端返回时才有）
  skuId: number
  productId: number
  name: string
  imgUrl: string
  specs: Record<string, string> // e.g. { "硬盘": "1T", "显卡": "RTX 5060" }
  price: number
  count: number
  stock?: number // 库存数量（后端返回时才有）
  selected: boolean
}

export const useCartStore = defineStore(
  'cart',
  () => {
    const items = ref<CartItem[]>([])

    // 修复持久化可能导致的数据格式错误
    watch(
      items,
      (val) => {
        if (!Array.isArray(val)) {
          items.value = []
        }
      },
      { immediate: true },
    )
    const userId = ref<number | null>(null)
    const serverCartCount = ref(0)

    // 监听 userId 变化，自动更新 serverCartCount
    watch(
      userId,
      async (newUserId) => {
        if (newUserId) {
          serverCartCount.value = await getCartCount()
        } else {
          serverCartCount.value = 0 // 退出登录时清零（可选）
        }
      },
      { immediate: true },
    ) // 立即执行一次

    function setUser(id: number) {
      userId.value = id
      mergeCloudCart()
    }

    async function mergeCloudCart() {
      try {
        // 1.保存本地购物车
        if (!Array.isArray(items.value)) {
          items.value = []
        }
        const localCart = [...items.value]

        // 2. 获取云端购物车
        const cloudCart = await getCartList()

        // 3. 如果本地购物车为空，直接使用云端
        if (localCart.length === 0) {
          items.value = cloudCart
          return
        }

        //  4. 如果云端购物车为空，把本地同步上去
        if (cloudCart.length === 0) {
          // 将本地每一项都添加到后端
          for (const item of localCart) {
            await addToCartApi({
              productId: item.productId,
              skuId: item.skuId,
              count: item.count,
            })
          }
          return
        }

        // 5. 两边都有，执行合并
        const cloudMap = new Map(cloudCart.map((item) => [item.skuId, item]))

        for (const localItem of localCart) {
          if (cloudMap.has(localItem.skuId)) {
            // 相同 SKU，累加数量
            const cloudItem = cloudMap.get(localItem.skuId)!
            cloudItem.count += localItem.count

            // 同步到后端
            await updateCartItem({
              id: cloudItem.id!,
              count: cloudItem.count,
            })
          } else {
            // 本地独有的 SKU，添加到云端
            await addToCartApi({
              productId: localItem.productId,
              skuId: localItem.skuId,
              count: localItem.count,
            })
          }
        }

        // 6. 重新获取最新的云端购物车
        const finalCart = await getCartList()
        items.value = finalCart
      } catch (error) {
        console.error('合并购物车失败', error)
      }
    }

    // Getters
    const totalCount = computed(() => {
      if (userId.value) {
        return serverCartCount.value
      }
      if (!Array.isArray(items.value)) return 0
      return items.value.reduce((sum, item) => sum + item.count, 0)
    })

    const totalPrice = computed(() => {
      if (!Array.isArray(items.value)) return 0
      // 解决浮点数精度问题：先转整数计算，再转回小数
      const totalCent = items.value.reduce((sum, item) => {
        return sum + Math.round(item.price * 100) * item.count
      }, 0)
      return totalCent / 100
    })

    // 选中的总数量
    const selectedTotalCount = computed(() => {
      if (!Array.isArray(items.value)) return 0
      return items.value.filter((item) => item.selected).reduce((sum, item) => sum + item.count, 0)
    })

    // 选中的总价
    const selectedTotalPrice = computed(() => {
      if (!Array.isArray(items.value)) return 0
      const totalCent = items.value
        .filter((item) => item.selected)
        .reduce((sum, item) => {
          return sum + Math.round(item.price * 100) * item.count
        }, 0)
      return totalCent / 100
    })

    // 全选状态
    const isAllSelected = computed(() => {
      if (!Array.isArray(items.value)) return false
      return items.value.length > 0 && items.value.every((item) => item.selected)
    })

    // 选中的购物车项
    const selectedItems = computed(() => {
      if (!Array.isArray(items.value)) return []
      return items.value.filter((item) => item.selected)
    })

    // Actions
    async function addToCart(product: ProductDetail, skuId: number, count: number) {
      // 1. 找到对应的 SKU 信息
      const sku = product.skus.find((s) => s.id === skuId)
      if (!sku) {
        console.error('SKU not found:', skuId)
        return
      }

      // 2. 检查购物车是否已存在该 SKU
      const existingItem = items.value.find((item) => item.skuId === skuId)

      // 保存旧状态（用于回滚）
      const oldCount = existingItem ? existingItem.count : 0
      const wasInCart = !!existingItem

      // 3. 乐观更新：先立即更新本地状态
      if (existingItem) {
        existingItem.count += count
        existingItem.selected = true // 重新加入时默认选中
      } else {
        items.value.push({
          skuId: sku.id,
          productId: product.id,
          name: product.name,
          imgUrl: product.mainImages[0] || '', // 使用主图的第一张
          specs: sku.specs,
          price: sku.price,
          count: count,
          selected: true,
        })
      }

      // 4. 调用后端 API（仅在登录时）
      if (userId.value) {
        try {
          const result = (await addToCartApi({
            productId: product.id,
            skuId: sku.id,
            count: count,
          })) as CartItem | null

          // 5. 后端返回的数据包含 id，更新到本地
          const item = items.value.find((item) => item.skuId === skuId)
          if (item && result && typeof result === 'object' && 'id' in result) {
            item.id = result.id
            if ('stock' in result) {
              item.stock = result.stock
            }
          }
          serverCartCount.value = await getCartCount()
        } catch (error) {
          // 6. API 失败，回滚本地状态
          console.error('添加到购物车失败', error)

          if (wasInCart && existingItem) {
            existingItem.count = oldCount
          } else {
            const index = items.value.findIndex((item) => item.skuId === skuId)
            if (index > -1) {
              items.value.splice(index, 1)
            }
          }

          throw error // 抛出错误让调用方处理
        }
      }
    }

    async function removeFromCart(skuId: number) {
      const index = items.value.findIndex((item) => item.skuId === skuId)
      if (index === -1) return

      // 1. 保存被删除的项（用于回滚）
      const removedItem = { ...items.value[index] } as CartItem

      // 2. 乐观更新：先立即从本地删除
      items.value.splice(index, 1)

      // 3. 调用后端 API（仅在登录时）
      if (userId.value) {
        try {
          await deleteCartItemBySku(skuId)
          serverCartCount.value = await getCartCount()
        } catch (error) {
          // 4. API 失败，恢复删除的项
          console.error('删除购物车商品失败', error)
          items.value.splice(index, 0, removedItem)
          throw error
        }
      }
    }

    async function batchRemoveFromCart() {
      if (!Array.isArray(items.value)) return

      // 找到所有被选中的项
      const selectedIds = items.value
        .filter((item) => item.selected && typeof item.id === 'number')
        .map((item) => item.id as number)
      if (selectedIds.length === 0) return

      // 保存旧状态（用于回滚）
      const oldItems = [...items.value]

      // 乐观更新：先从本地移除选中的项
      items.value = items.value.filter((item) => !item.selected)

      // 调用后端 API（仅在登录时）
      if (userId.value) {
        try {
          const { deleteCartItem } = await import('@/api/cart')
          await deleteCartItem({ ids: selectedIds }) // 保证格式为 { ids: [...] }
          serverCartCount.value = await getCartCount()
        } catch (error) {
          // API 失败，回滚本地状态
          console.error('批量删除购物车项失败', error)
          items.value = oldItems
          throw error
        }
      }
    }

    async function updateQuantity(skuId: number, count: number) {
      const item = items.value.find((item) => item.skuId === skuId)
      if (!item) return

      // 1. 保存旧数量（用于回滚）
      const oldCount = item.count

      // 2. 乐观更新：先立即更新本地
      item.count = count
      // 3. 调用后端 API（仅在登录且有 id 时）
      if (userId.value && item.id) {
        try {
          await updateCartItem({
            id: item.id,
            count: count,
          })
          serverCartCount.value = await getCartCount()
        } catch (error) {
          // 4. API 失败，回滚数量
          console.error('更新数量失败', error)
          item.count = oldCount
          throw error
        }
      }
    }

    async function updateSelection(skuId: number, selected: boolean) {
      const item = items.value.find((item) => item.skuId === skuId)
      if (!item) return

      // 1. 保存旧状态（用于回滚）
      const oldSelected = item.selected

      // 2. 乐观更新：先立即更新本地
      item.selected = selected

      console.log(skuId, selected)
      // 3. 调用后端 API（仅在登录且有 id 时）
      if (userId.value && item.id) {
        try {
          await updateCartItem({
            id: item.id,
            selected: selected,
          })
        } catch (error) {
          // 4. API 失败，回滚状态
          console.error('更新选中状态失败', error)
          item.selected = oldSelected
          throw error
        }
      }
    }

    async function clearCart() {
      // 1. 保存当前购物车（用于回滚）
      const oldItems = [...items.value]

      // 2. 乐观更新：先立即清空本地
      items.value = []

      // 3. 调用后端 API（仅在登录时）
      if (userId.value) {
        try {
          const { clearCart } = await import('@/api/cart')
          await clearCart()
          serverCartCount.value = await getCartCount()
        } catch (error) {
          // 4. API 失败，恢复购物车
          console.error('清空购物车失败', error)
          items.value = oldItems
          throw error
        }
      }
    }

    async function toggleSelectAll(selected: boolean) {
      // 1. 保存旧状态（用于回滚）
      const oldStates = items.value.map((item) => ({ skuId: item.skuId, selected: item.selected }))

      // 2. 乐观更新：先立即更新本地
      items.value.forEach((item) => (item.selected = selected))

      // 3. 调用后端 API（仅在登录时）
      if (userId.value) {
        try {
          // 获取所有购物车项的 id
          const ids = items.value.filter((item) => item.id).map((item) => item.id!)

          if (ids.length > 0) {
            await batchUpdateSelected({ ids, selected })
          }
        } catch (error) {
          // 4. API 失败，恢复选中状态
          console.error('批量更新选中状态失败', error)
          items.value.forEach((item) => {
            const oldState = oldStates.find((s) => s.skuId === item.skuId)
            if (oldState) {
              item.selected = oldState.selected
            }
          })
          throw error
        }
      }
    }

    return {
      items,
      totalCount,
      totalPrice,
      selectedTotalCount,
      selectedTotalPrice,
      isAllSelected,
      selectedItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      setUser,
      userId,
      toggleSelectAll,
      updateSelection,
      batchRemoveFromCart,
    }
  },
  {
    persist: true, // 开启持久化
  },
)
