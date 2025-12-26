<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { ProductSimple } from '@/api/model/productModel'

const props = defineProps<{
  product: ProductSimple
}>()

const router = useRouter()

const navigateToDetail = () => {
  router.push(`/product/${props.product.id}`)
}

const formattedPrice = computed(() => {
  return props.product.price.toFixed(2)
})

// const hasTag = computed(() => {
//   return props.product.tags && props.product.tags.length > 0
// })

// const firstTag = computed(() => {
//   return hasTag.value ? props.product.tags![0] : ''
// })
</script>

<template>
  <div class="product-card" @click="navigateToDetail">
    <div class="card-image-wrapper">
      <img
        :src="product.imgUrl"
        :alt="product.name"
        class="product-image"
        loading="lazy"
      />
      <!-- <div v-if="hasTag" class="product-tag">{{ firstTag }}</div> -->
    </div>

    <div class="card-content">
      <h3 class="product-name" :title="product.name">{{ product.name }}</h3>
      <div class="product-price">
        <span class="price-symbol">¥</span>
        <span class="price-value">{{ formattedPrice }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #f0f0f0;
  position: relative;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
  border-color: #667eea;
}

.card-image-wrapper {
  position: relative;
  width: 100%;
  padding-top: 100%;
  background: #f8f9fa;
  overflow: hidden;
}

.product-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.product-card:hover .product-image {
  transform: scale(1.05);
}

.product-tag {
  position: absolute;
  bottom: 8px;
  right: 8px;
  padding: 4px 10px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  border-radius: 12px;
  letter-spacing: 0.5px;
  z-index: 2;
}

.card-content {
  padding: 12px 16px 16px;
}

.product-name {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
  line-height: 1.5;
  height: 42px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.product-price {
  display: flex;
  align-items: baseline;
}

.price-symbol {
  font-size: 18px;
  font-weight: 600;
  margin-right: 2px;
}

.price-value {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.5px;
}
</style>
