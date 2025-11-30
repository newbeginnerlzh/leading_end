// src/api/model/productModel.ts

// 商品列表用的精简信息，根据需要修改
export interface ProductSimple {
  id: number
  name: string
  price: number
  imgUrl: string
  tags?: string[] // 例如：["热销", "新品"]
}

// --- 详情页复杂结构 ---
// 仿照此格式对其他model进行定义
export interface ProductDetail {
  id: number
  name: string
  desc: string
  priceRange: string // 展示用的价格区间，例如 "¥9999 - ¥12999"
  mainImages: string[] // 轮播图数组
  detailHtml: string // 详情页长图富文本
  specs: SpecItem[] // 规格项，用于前端渲染选择按钮
  skus: SkuItem[] // SKU 组合，包含具体价格和库存
  params: ComputerParams // 详细参数，用于"规格参数"tab显示
}

export interface SpecItem {
  name: string // 规格名称，例如 "CPU"
  values: string[] // 规格值列表，例如 ["i5", "i7"]
}

export interface SkuItem {
  id: number
  specs: Record<string, string> // 规格组合，例如 { "CPU": "i7", "内存": "16G" }
  price: number // 该配置的具体价格
  stock: number // 库存
}

// 电脑详细参数接口
export interface ComputerParams {
  // --- 基本参数 ---
  model: string // 产品型号，例如 "LEGION Y9000X IAX10"
  os: string // 操作系统，例如 "Windows 11 家庭中文版"
  positioning: string // 产品定位，例如 "游戏本"

  // --- 处理器 ---
  cpuModel: string // CPU型号，例如 "Ultra 9 275HX" (具体型号)
  cpuSeries: string // CPU系列，例如 "Ultra 9" (系列)
  maxTurboFreq: string // 最高睿频，例如 "5.4GHz"
  cpuChip: string // CPU芯片/营销名，例如 "英特尔酷睿Ultra 9"

  // --- 显示屏 ---
  screenSize: string // 屏幕尺寸，例如 "16.0英寸"
  screenRatio: string // 显示比例，例如 "16:10"
  resolution: string // 屏幕分辨率，例如 "2560×1600"
  colorGamut: string // 色域，例如 "100% DCI-P3"
  refreshRate: string // 屏幕刷新率，例如 "240Hz"

  // --- 存储设备 ---
  ramCapacity: string // 内存容量，例如 "32GB（16+16）"
  ramType: string // 内存类型，例如 "DDR5"
  ssdCapacity: string // 硬盘容量，例如 "2T（1T+1T）"
  ssdType: string // 硬盘类型，例如 "SSD固态硬盘"

  // --- 显卡 ---
  gpuType: string // 显卡类型，例如 "独立显卡"
  gpuChip: string // 显卡芯片，例如 "NVIDIA® GeForce RTX™ 5070"
  vramCapacity: string // 显存容量，例如 "8GB"
  vramType: string // 显存类型，例如 "GDDR7"

  // --- 多媒体设备 ---
  camera: string // 摄像头，例如 "有" 或具体像素

  // --- 网络通信 ---
  wifi: string // 无线网卡，例如 "有" 或 "Wi-Fi 6E"
  bluetooth: string // 蓝牙，例如 "有" 或 "Bluetooth 5.2"

  // --- I/O 接口 ---
  dataInterfaces: string // 数据接口，例如 "USB-A*2+USB-C*1+雷电4*1"
  videoInterfaces: string // 视频接口，例如 "HDMI"
  audioInterfaces: string // 音频接口，例如 "3.5mm 耳麦接口"

  // --- 输入设备 ---
  keyboard: string // 键盘描述，例如 "背光键盘"
  faceId: string // 人脸识别，例如 "支持"

  // --- 外观 ---
  weight: string // 重量，例如 "1.5-2.0Kg"
  thickness: string // 厚度，例如 "15.9mm"

  // --- 其他 ---
  software: string // 附带软件，例如 "正版Office家庭版"
}
