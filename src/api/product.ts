// src/api/product.ts
// import { get } from '@/utils/request'
import type { ProductSimple, ProductDetail } from './model/productModel'
import type { PageResult } from './model/common'

/**
 * 获取商品列表（搜索、筛选）
 * @param params { keyword, categoryId, page, pageSize, sort }
 * @example
 * getProductList({ keyword: "Y9000P", page: 1, pageSize: 20 })
 */
export function getProductList(params: {
  keyword?: string
  categoryId?: number
  page?: number
  pageSize?: number
  sort?: string
}) {
  void params
  // 参考实现：
  // return get<PageResult<ProductSimple>>('/product/list', params)
  return Promise.resolve({
    list: [],
    total: 0,
    page: params.page || 1,
    pageSize: params.pageSize || 10,
  } as PageResult<ProductSimple>)
}

/**
 * 获取商品详情
 * 包含详细参数 ComputerParams
 * @param id 商品ID
 * @example
 * getProductDetail(1001) -> 返回包含 skus, params 的完整信息
 */
export function getProductDetail(id: number) {
  void id

  const mockData: ProductDetail = {
    id: 1001,
    name: '联想拯救者 Y9000X 2025 AI元启',
    desc: '英特尔® 酷睿™ Ultra 9/Windows 11 家庭中文版/16英寸/32GB(16+16)/冰魄白',
    priceRange: '¥13999 - ¥15848',
    mainImages: [
      'https://p4.lefile.cn/product/adminweb/2025/05/20/UsLzKs0iPovinA04fp6vfjbmq-1832.jpg',
      'https://p4.lefile.cn/product/adminweb/2025/05/20/UsLzKs0iPovinA04fp6vfjbmq-1832.jpg', // 示例占位
      'https://p4.lefile.cn/product/adminweb/2025/05/20/UsLzKs0iPovinA04fp6vfjbmq-1832.jpg', // 示例占位
    ],
    detailHtml: `
      <div class="product-intro">
        <img src="https://p1.lefile.cn/product/adminweb/2025/05/30/ivmwzHYISsEs787D4nMDl4BlF-4937.jpg" data-original="https://p1.lefile.cn/product/adminweb/2025/05/30/ivmwzHYISsEs787D4nMDl4BlF-4937.jpg" title="" alt="" style="width:100%;display:block;" />
        <img src="https://p1.lefile.cn/product/adminweb/2025/05/30/iqoRIQ0SdVKqVug76oVbuAphk-3909.jpg" data-original="https://p1.lefile.cn/product/adminweb/2025/05/30/iqoRIQ0SdVKqVug76oVbuAphk-3909.jpg" title="" alt="" style="width:100%;display:block;" />
        <img src="https://p4.lefile.cn/product/adminweb/2025/05/30/XIZCpxCFmHvwlF2sKAPR9T0Ls-6634.jpg" data-original="https://p4.lefile.cn/product/adminweb/2025/05/30/XIZCpxCFmHvwlF2sKAPR9T0Ls-6634.jpg" title="" alt="" style="width:100%;display:block;" />
        <img src="https://p1.lefile.cn/product/adminweb/2025/05/30/PeVYjXc3SIrqtnhHtEXooiln5-0950.jpg" data-original="https://p1.lefile.cn/product/adminweb/2025/05/30/PeVYjXc3SIrqtnhHtEXooiln5-0950.jpg" title="" alt="" style="width:100%;display:block;" />
      </div>
    `,
    specs: [
      {
        name: '操作系统',
        values: ['Windows 11 家庭中文版'],
      },
      {
        name: '处理器',
        values: ['Ultra 9 275HX'],
      },
      {
        name: '内存容量',
        values: ['32GB(16+16)'],
      },
      {
        name: '存储容量',
        values: ['1T SSD', '2T SSD'],
      },
      {
        name: '显卡',
        values: ['RTX 5060', 'RTX 5070'],
      },
    ],
    skus: [
      {
        id: 100101,
        specs: {
          操作系统: 'Windows 11 家庭中文版',
          处理器: 'Ultra 9 275HX',
          内存容量: '32GB(16+16)',
          存储容量: '1T SSD',
          显卡: 'RTX 5060',
        },
        price: 13999,
        stock: 100,
        // SKU 特有参数：1T + RTX 5060 配置
        diffParams: {
          ssdCapacity: '1TB SSD',
          gpuChip: 'NVIDIA® GeForce RTX™ 5060',
          vramCapacity: '8GB',
        },
      },
      {
        id: 100102,
        specs: {
          操作系统: 'Windows 11 家庭中文版',
          处理器: 'Ultra 9 275HX',
          内存容量: '32GB(16+16)',
          存储容量: '1T SSD',
          显卡: 'RTX 5070',
        },
        price: 14999,
        stock: 50,
        // SKU 特有参数：1T + RTX 5070 配置
        diffParams: {
          ssdCapacity: '1TB SSD',
          gpuChip: 'NVIDIA® GeForce RTX™ 5070',
          vramCapacity: '8GB',
        },
      },
      {
        id: 100103,
        specs: {
          操作系统: 'Windows 11 家庭中文版',
          处理器: 'Ultra 9 275HX',
          内存容量: '32GB(16+16)',
          存储容量: '2T SSD',
          显卡: 'RTX 5060',
        },
        price: 14848,
        stock: 80,
        // SKU 特有参数：2T + RTX 5060 配置
        diffParams: {
          ssdCapacity: '2TB (1TB+1TB) SSD',
          gpuChip: 'NVIDIA® GeForce RTX™ 5060',
          vramCapacity: '8GB',
        },
      },
      {
        id: 100104,
        specs: {
          操作系统: 'Windows 11 家庭中文版',
          处理器: 'Ultra 9 275HX',
          内存容量: '32GB(16+16)',
          存储容量: '2T SSD',
          显卡: 'RTX 5070',
        },
        price: 15848,
        stock: 20,
        // SKU 特有参数：2T + RTX 5070 配置
        diffParams: {
          ssdCapacity: '2TB (1TB+1TB) SSD',
          gpuChip: 'NVIDIA® GeForce RTX™ 5070',
          vramCapacity: '8GB',
        },
      },
    ],
    // 所有 SKU 共用的参数（与具体配置无关的参数）
    params: {
      model: 'LEGION Y9000X IAX10',
      os: 'Windows 11 家庭中文版',
      positioning: '游戏本',
      cpuModel: 'Ultra 9 275HX',
      cpuSeries: 'Ultra 9',
      maxTurboFreq: '5.4GHz',
      cpuChip: '英特尔酷睿Ultra 9',
      screenSize: '16英寸',
      screenRatio: '16:10',
      resolution: '2560×1600',
      colorGamut: '100% DCI-P3',
      refreshRate: '240Hz',
      ramCapacity: '32GB(16+16)',
      ramType: 'DDR5',
      ssdType: 'SSD固态硬盘',
      gpuType: '独立显卡',
      // gpuChip, vramCapacity, ssdCapacity 已移至各 SKU 的 diffParams
      vramType: 'GDDR7',
      camera: '有',
      wifi: '有',
      bluetooth: '有',
      dataInterfaces: 'USB-A*2+USB-C*1+雷电4*1',
      videoInterfaces: 'HDMI',
      audioInterfaces: '3.5mm 耳麦接口',
      keyboard: '背光键盘',
      faceId: '支持',
      weight: '1.5-2.0Kg',
      thickness: '15.9mm',
      software: '正版Office家庭版',
    },
  }

  return Promise.resolve(mockData)
}

/**
 * 获取商品分类树
 * @example
 * 返回: [{ id: 1, name: "笔记本", children: [...] }]
 */
export function getCategoryList() {
  // 参考实现：
  // return get<any[]>('/product/category/list')
  return Promise.resolve([] as unknown[])
}
