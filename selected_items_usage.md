# 如何从 selectedItems 计算属性获取购物车项属性

## 概述

`selectedItems` 是 Cart Store 中的一个计算属性，用于获取所有被选中的购物车项。

## 基本用法

```typescript
import { useCartStore } from "@/stores/cart";

const cartStore = useCartStore();

// 获取所有选中的购物车项
const selectedItems = cartStore.selectedItems;
```

## 购物车项属性说明

每个购物车项（`CartItem`）包含以下属性：

| 属性名      | 类型                     | 说明                      | 示例                                   |
| ----------- | ------------------------ | ------------------------- | -------------------------------------- |
| `id`        | `number?`                | 购物车条目 ID（后端返回） | `1`                                    |
| `skuId`     | `number`                 | SKU ID                    | `201`                                  |
| `productId` | `number`                 | 商品 ID                   | `101`                                  |
| `name`      | `string`                 | 商品名称                  | `"游戏本"`                             |
| `imgUrl`    | `string`                 | 商品图片 URL              | `"https://example.com/img.jpg"`        |
| `specs`     | `Record<string, string>` | 规格信息对象              | `{ "硬盘": "1T", "显卡": "RTX 5060" }` |
| `price`     | `number`                 | 单价                      | `5999`                                 |
| `count`     | `number`                 | 数量                      | `2`                                    |
| `stock`     | `number?`                | 库存数量（后端返回）      | `50`                                   |
| `selected`  | `boolean`                | 选中状态                  | `true`                                 |

## 使用示例

### 1. 获取所有选中商品的 ID 列表

```typescript
const cartStore = useCartStore();

// 获取所有选中商品的购物车条目 ID
const selectedIds = cartStore.selectedItems
  .filter((item) => item.id) // 确保 id 存在
  .map((item) => item.id!);

console.log(selectedIds); // [1, 2, 3]
```

### 2. 获取所有选中商品的 SKU ID 列表

```typescript
const cartStore = useCartStore();

const selectedSkuIds = cartStore.selectedItems.map((item) => item.skuId);

console.log(selectedSkuIds); // [201, 202, 203]
```

### 3. 遍历选中商品获取各个属性

```typescript
const cartStore = useCartStore();

cartStore.selectedItems.forEach((item) => {
  console.log("购物车ID:", item.id);
  console.log("SKU ID:", item.skuId);
  console.log("商品ID:", item.productId);
  console.log("商品名称:", item.name);
  console.log("图片URL:", item.imgUrl);
  console.log("规格信息:", item.specs);
  console.log("单价:", item.price);
  console.log("数量:", item.count);
  console.log("库存:", item.stock);
  console.log("小计:", item.price * item.count);
  console.log("---");
});
```

### 4. 创建订单时准备订单数据

```typescript
import { useCartStore } from "@/stores/cart";
import { ElMessage } from "element-plus";

const cartStore = useCartStore();

function createOrder() {
  // 检查是否有选中的商品
  if (cartStore.selectedItems.length === 0) {
    ElMessage.warning("请至少选择一件商品");
    return;
  }

  // 准备订单数据
  const orderData = {
    // 订单商品列表
    items: cartStore.selectedItems.map((item) => ({
      cartItemId: item.id, // 购物车条目ID
      skuId: item.skuId, // SKU ID
      productId: item.productId, // 商品ID
      name: item.name, // 商品名称
      imgUrl: item.imgUrl, // 图片URL
      specs: item.specs, // 规格信息
      price: item.price, // 单价
      count: item.count, // 数量
      subtotal: item.price * item.count, // 小计
    })),

    // 订单总计
    totalAmount: cartStore.selectedTotalPrice, // 总价
    totalCount: cartStore.selectedTotalCount, // 总数量
  };

  console.log("订单数据:", orderData);

  // 调用创建订单 API
  // await createOrderApi(orderData)
}
```

### 5. 验证选中商品的库存

```typescript
const cartStore = useCartStore();

function checkStock() {
  const outOfStock = cartStore.selectedItems.filter((item) => {
    // 检查库存是否充足
    return item.stock !== undefined && item.count > item.stock;
  });

  if (outOfStock.length > 0) {
    outOfStock.forEach((item) => {
      console.log(
        `商品 ${item.name} 库存不足：需要 ${item.count} 件，库存仅剩 ${item.stock} 件`
      );
    });
    return false;
  }

  return true;
}
```

### 6. 访问规格信息

规格信息是一个对象（`Record<string, string>`），可以这样访问：

```typescript
const cartStore = useCartStore();

cartStore.selectedItems.forEach((item) => {
  console.log("商品规格:");

  // 方式1: 遍历所有规格
  Object.entries(item.specs).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });

  // 方式2: 访问特定规格
  const diskSpec = item.specs["硬盘"];
  const gpuSpec = item.specs["显卡"];
  console.log(`硬盘: ${diskSpec}, 显卡: ${gpuSpec}`);
});
```

### 7. 完整的创建订单页面示例

```vue
<script setup lang="ts">
import { useCartStore } from "@/stores/cart";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { ref } from "vue";

const cartStore = useCartStore();
const router = useRouter();
const loading = ref(false);

// 提交订单
const submitOrder = async () => {
  // 1. 检查是否有选中商品
  if (cartStore.selectedItems.length === 0) {
    ElMessage.warning("请至少选择一件商品");
    return;
  }

  // 2. 准备订单数据
  const orderData = {
    items: cartStore.selectedItems.map((item) => ({
      cartItemId: item.id,
      skuId: item.skuId,
      productId: item.productId,
      name: item.name,
      imgUrl: item.imgUrl,
      specs: item.specs,
      price: item.price,
      count: item.count,
    })),
    totalAmount: cartStore.selectedTotalPrice,
    totalCount: cartStore.selectedTotalCount,
  };

  // 3. 调用 API 创建订单
  try {
    loading.value = true;
    // const result = await createOrderApi(orderData)
    ElMessage.success("订单创建成功");
    // router.push(`/order/${result.orderId}`)
  } catch (error) {
    ElMessage.error("订单创建失败，请重试");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="checkout-page">
    <h2>订单确认</h2>

    <!-- 显示选中的商品 -->
    <div
      v-for="item in cartStore.selectedItems"
      :key="item.skuId"
      class="order-item"
    >
      <img :src="item.imgUrl" :alt="item.name" />
      <div class="item-info">
        <div class="item-name">{{ item.name }}</div>
        <div class="item-specs">
          <span v-for="(value, key) in item.specs" :key="key">
            {{ key }}: {{ value }}
          </span>
        </div>
        <div class="item-price">¥{{ item.price }} × {{ item.count }}</div>
      </div>
    </div>

    <!-- 订单总计 -->
    <div class="order-summary">
      <div>共 {{ cartStore.selectedTotalCount }} 件商品</div>
      <div class="total-price">总计：¥{{ cartStore.selectedTotalPrice }}</div>
    </div>

    <!-- 提交按钮 -->
    <el-button type="primary" :loading="loading" @click="submitOrder">
      提交订单
    </el-button>
  </div>
</template>
```

## 注意事项

1. **确保 `id` 存在**: 购物车项的 `id` 字段是可选的（`id?: number`），只有在后端返回时才有。使用前需要检查：

   ```typescript
   const idsExist = cartStore.selectedItems.every((item) => item.id);
   if (!idsExist) {
     console.warn("某些购物车项缺少 id");
   }
   ```

2. **响应式数据**: `selectedItems` 是计算属性，会自动响应购物车状态的变化：

   ```typescript
   // 当用户勾选/取消勾选商品时，selectedItems 会自动更新
   watch(
     () => cartStore.selectedItems.length,
     (newLength) => {
       console.log("选中商品数量变化:", newLength);
     }
   );
   ```

3. **类型安全**: 在 TypeScript 中，可以明确指定类型：

   ```typescript
   import type { CartItem } from "@/stores/cart";

   const selectedItems: CartItem[] = cartStore.selectedItems;
   ```

## 相关 Store 属性

除了 `selectedItems`，Cart Store 还提供了其他有用的计算属性：

- `selectedTotalCount`: 选中商品的总数量
- `selectedTotalPrice`: 选中商品的总价
- `isAllSelected`: 是否全选
- `items`: 所有购物车项（包括未选中的）
- `totalCount`: 所有商品的总数量
- `totalPrice`: 所有商品的总价
