# 丝绸之路数据可视化项目设计文档

## 概述

本设计文档描述了丝绸之路数据可视化项目的技术架构、组件设计和实现方案。项目采用Vue 3 + Vite + TypeScript技术栈，结合Three.js、ECharts等可视化库，构建一个高性能、交互式的历史文化展示平台。

### 设计目标

- 提供流畅的3D可视化体验
- 实现响应式和高性能的数据展示
- 构建可维护和可扩展的代码架构
- 支持多设备和多分辨率
- 优化加载速度和运行性能

### 技术选型

- **前端框架**: Vue 3.4+ (Composition API)
- **构建工具**: Vite 5.1+
- **类型系统**: TypeScript
- **状态管理**: Pinia 3.0+
- **路由管理**: Vue Router 4.3+
- **3D渲染**: Three.js 0.162+
- **数据可视化**: ECharts 5.6+, D3.js 7.9+
- **动画库**: GSAP 3.12+, AOS 2.3+
- **样式处理**: Sass
- **代码规范**: ESLint + Prettier

## 架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                     Presentation Layer                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │  Pages   │  │Components│  │ Layouts  │  │ Styles  │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│                     Application Layer                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │  Router  │  │  Store   │  │ Services │  │ Utils   │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│                       Data Layer                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │  Static  │  │ GeoJSON  │  │  Images  │  │ Workers │ │
│  │   Data   │  │   Data   │  │  Assets  │  │         │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 目录结构设计


```
src/
├── assets/                    # 静态资源
│   ├── data/                 # 静态数据文件
│   │   ├── cities.json       # 城市数据
│   │   ├── dynasties.json    # 朝代数据
│   │   ├── events.json       # 历史事件数据
│   │   └── trades.json       # 贸易数据
│   ├── geojson/              # 地理数据
│   │   ├── routes.geojson    # 路线数据
│   │   └── regions.geojson   # 区域数据
│   ├── images/               # 图片资源
│   │   ├── textures/         # 3D纹理
│   │   ├── sites/            # 遗址图片
│   │   └── artifacts/        # 文物图片
│   ├── models/               # 3D模型
│   │   └── artifacts/        # 文物GLB/GLTF模型
│   └── styles/               # 全局样式
│       ├── variables.scss    # 样式变量
│       ├── mixins.scss       # 样式混合
│       └── transitions.scss  # 过渡动画
├── components/               # 可复用组件
│   ├── Globe3D.vue          # 3D地球组件
│   ├── TimeAxis.vue         # 时间轴组件
│   ├── TimelineSlider.vue   # 时间滑块组件
│   ├── TradeVolumeChart.vue # 贸易量图表
│   ├── CityInfoPanel.vue    # 城市信息面板
│   ├── ArtifactViewer3D.vue # 3D文物查看器
│   └── NavigationMenu.vue   # 导航菜单
├── pages/                    # 页面组件
│   ├── Home.vue             # 首页
│   ├── MainDashboard.vue    # 主仪表盘
│   ├── Trade.vue            # 贸易分析
│   ├── CulturalExchange.vue # 文化交流
│   ├── HistoricalEvents.vue # 历史事件
│   ├── Location.vue         # 位置页面
│   └── Site.vue             # 遗址展示
├── router/                   # 路由配置
│   └── index.ts             # 路由定义
├── store/                    # Pinia状态管理
│   ├── index.ts             # Store入口
│   ├── dynastyStore.ts      # 朝代状态
│   ├── periodStore.ts       # 时期状态
│   └── chartStore.ts        # 图表状态
├── services/                 # 服务层
│   ├── api.ts               # API服务
│   ├── dataService.ts       # 数据服务
│   └── exportService.ts     # 导出服务
├── utils/                    # 工具函数
│   ├── threeHelpers.ts      # Three.js辅助函数
│   ├── coordinateUtils.ts   # 坐标转换工具
│   ├── dataProcessor.ts     # 数据处理工具
│   └── animationUtils.ts    # 动画工具
├── workers/                  # Web Workers
│   ├── dataWorker.ts        # 数据处理Worker
│   └── tradeWorker.ts       # 贸易数据Worker
├── types/                    # TypeScript类型定义
│   ├── city.ts              # 城市类型
│   ├── event.ts             # 事件类型
│   ├── trade.ts             # 贸易类型
│   └── artifact.ts          # 文物类型
├── App.vue                   # 应用根组件
└── main.ts                   # 应用入口
```

## 核心组件设计

### 1. Globe3D 组件（3D地球）

#### 组件职责
- 渲染交互式3D地球
- 显示城市标注和贸易路线
- 处理用户交互（悬停、点击、双击）
- 管理相机动画和自动旋转

#### 组件接口


```typescript
interface Globe3DProps {
  cities: City[]           // 城市数据
  routes: Route[]          // 路线数据
  selectedPeriod?: string  // 选中的时期
  autoRotate?: boolean     // 是否自动旋转
}

interface Globe3DEmits {
  'city-hover': (city: City | null) => void
  'city-click': (city: City) => void
  'city-dblclick': (city: City) => void
}

interface City {
  id: string
  name: string
  nameEn: string
  lat: number
  lng: number
  description: string
  period: string[]
  importance: number
}

interface Route {
  id: string
  name: string
  points: [number, number][]  // [lat, lng]
  period: string
  type: 'land' | 'sea'
}
```

#### 核心功能实现

**1. 经纬度转换**
```typescript
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  
  const x = -radius * Math.sin(phi) * Math.cos(theta)
  const y = radius * Math.cos(phi)
  const z = radius * Math.sin(phi) * Math.sin(theta)
  
  return new THREE.Vector3(x, y, z)
}
```

**2. 城市标注创建**
- 使用 THREE.Group 组合多个元素
- 点光源（PointLight）提供光效
- Canvas纹理生成文字标签
- PlaneGeometry 显示标签

**3. 路线绘制**
- 使用 CatmullRomCurve3 创建平滑曲线
- TubeGeometry 生成管道几何体
- 支持动画效果（商队移动）

**4. 交互检测**
- THREE.Raycaster 进行射线检测
- 监听 mousemove、click、dblclick 事件
- userData 存储城市数据用于识别

**5. 相机动画**
- 使用 GSAP 实现平滑动画
- 支持动画中断和重新开始
- 自动旋转模式切换

#### 性能优化
- 使用 LOD（Level of Detail）根据距离调整细节
- 标签使用 Billboard 技术始终面向相机
- 限制同时显示的标签数量
- 使用 requestAnimationFrame 优化渲染循环

### 2. TimeAxis 组件（时间轴）

#### 组件职责
- 展示历史朝代时间线
- 标注重要历史事件
- 提供时间范围选择
- 触发时期切换

#### 组件接口

```typescript
interface TimeAxisProps {
  dynasties: Dynasty[]
  events: HistoricalEvent[]
  selectedPeriod?: string
}

interface TimeAxisEmits {
  'period-change': (period: string) => void
  'event-click': (event: HistoricalEvent) => void
  'range-change': (start: number, end: number) => void
}

interface Dynasty {
  id: string
  name: string
  startYear: number
  endYear: number
  color: string
}

interface HistoricalEvent {
  id: string
  title: string
  year: number
  dynasty: string
  description: string
  importance: number
}
```

#### 实现方案
- 使用 D3.js 绘制时间轴
- GSAP 实现平滑滚动和缩放
- 响应式设计适配不同屏幕

### 3. TradeVolumeChart 组件（贸易图表）

#### 组件职责
- 展示贸易数据统计
- 支持多种图表类型
- 响应时期变化更新数据

#### 组件接口


```typescript
interface TradeVolumeChartProps {
  data: TradeData[]
  chartType: 'bar' | 'line' | 'pie'
  period?: string
  city?: string
}

interface TradeData {
  period: string
  city: string
  goods: string
  volume: number
  value: number
}
```

#### 实现方案
- 使用 vue-echarts 封装 ECharts
- 支持图表配置的响应式更新
- 提供数据导出功能

### 4. ArtifactViewer3D 组件（3D文物查看器）

#### 组件职责
- 加载和渲染 GLB/GLTF 3D模型
- 提供交互式查看（旋转、缩放）
- 优化模型加载和渲染性能
- 根据文物类型应用预设的展示位置

#### 组件接口

```typescript
interface ArtifactViewer3DProps {
  modelUrl: string
  artifactInfo: ArtifactInfo
  autoRotate?: boolean
  displayPreset?: string  // 展示预设名称
}

interface ArtifactInfo {
  id: string
  name: string
  type: ArtifactType  // 文物类型
  period: string
  site: string
  description: string
  images: string[]
  displayConfig?: DisplayConfig  // 自定义展示配置
}

type ArtifactType = 'pottery' | 'sculpture' | 'textile' | 'metalware' | 'jade' | 'painting' | 'other'

interface DisplayConfig {
  cameraDistance?: number  // 相机距离
  cameraAngle?: {
    azimuth: number   // 方位角（水平旋转）
    elevation: number // 仰角（垂直旋转）
  }
  targetOffset?: {    // 相机目标点偏移
    x: number
    y: number
    z: number
  }
  lightIntensity?: number
  autoRotateSpeed?: number
}
```

#### 展示预设配置

```typescript
// 预设配置定义
interface DisplayPreset {
  name: string
  description: string
  config: DisplayConfig
}

// 默认预设
const DEFAULT_PRESETS: Record<ArtifactType, DisplayPreset> = {
  pottery: {
    name: '陶器展示',
    description: '适合陶罐、陶瓶等器皿类文物',
    config: {
      cameraDistance: 2.5,
      cameraAngle: { azimuth: 45, elevation: 20 },
      targetOffset: { x: 0, y: 0.3, z: 0 },
      lightIntensity: 1.2,
      autoRotateSpeed: 0.5
    }
  },
  sculpture: {
    name: '雕塑展示',
    description: '适合佛像、人物雕塑等立体文物',
    config: {
      cameraDistance: 3.0,
      cameraAngle: { azimuth: 30, elevation: 15 },
      targetOffset: { x: 0, y: 0.5, z: 0 },
      lightIntensity: 1.5,
      autoRotateSpeed: 0.3
    }
  },
  textile: {
    name: '织物展示',
    description: '适合丝绸、刺绣等平面织物',
    config: {
      cameraDistance: 2.0,
      cameraAngle: { azimuth: 0, elevation: 0 },
      targetOffset: { x: 0, y: 0, z: 0 },
      lightIntensity: 1.0,
      autoRotateSpeed: 0
    }
  },
  metalware: {
    name: '金属器展示',
    description: '适合铜器、金银器等金属文物',
    config: {
      cameraDistance: 2.2,
      cameraAngle: { azimuth: 60, elevation: 25 },
      targetOffset: { x: 0, y: 0.2, z: 0 },
      lightIntensity: 1.8,
      autoRotateSpeed: 0.4
    }
  },
  jade: {
    name: '玉器展示',
    description: '适合玉佩、玉璧等玉石文物',
    config: {
      cameraDistance: 1.8,
      cameraAngle: { azimuth: 45, elevation: 30 },
      targetOffset: { x: 0, y: 0, z: 0 },
      lightIntensity: 1.3,
      autoRotateSpeed: 0.6
    }
  },
  painting: {
    name: '绘画展示',
    description: '适合壁画、卷轴画等平面艺术品',
    config: {
      cameraDistance: 2.5,
      cameraAngle: { azimuth: 0, elevation: 0 },
      targetOffset: { x: 0, y: 0, z: 0 },
      lightIntensity: 1.1,
      autoRotateSpeed: 0
    }
  },
  other: {
    name: '通用展示',
    description: '默认展示配置',
    config: {
      cameraDistance: 2.5,
      cameraAngle: { azimuth: 45, elevation: 20 },
      targetOffset: { x: 0, y: 0, z: 0 },
      lightIntensity: 1.2,
      autoRotateSpeed: 0.5
    }
  }
}
```

#### 实现方案
- 使用 GLTFLoader 加载模型
- OrbitControls 提供交互控制
- 环境光 + 方向光提供照明
- 加载进度显示
- 根据文物类型自动选择展示预设
- 支持自定义展示配置覆盖预设
- 平滑过渡到预设的相机位置

## 状态管理设计

### Dynasty Store（朝代状态）

```typescript
interface DynastyState {
  dynasties: Dynasty[]
  currentDynasty: Dynasty | null
  loading: boolean
}

interface DynastyActions {
  loadDynasties(): Promise<void>
  setCurrentDynasty(id: string): void
  getDynastyByYear(year: number): Dynasty | null
}
```

### Period Store（时期状态）

```typescript
interface PeriodState {
  selectedPeriod: string | null
  timeRange: [number, number]
  filteredEvents: HistoricalEvent[]
}

interface PeriodActions {
  setPeriod(period: string): void
  setTimeRange(start: number, end: number): void
  filterEventsByRange(): void
}
```

### Chart Store（图表状态）

```typescript
interface ChartState {
  chartType: 'bar' | 'line' | 'pie'
  chartData: any
  exportFormat: 'json' | 'csv'
}

interface ChartActions {
  setChartType(type: string): void
  updateChartData(data: any): void
  exportData(format: string): void
}
```

## 路由设计

### 路由配置

```typescript
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/pages/Home.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/pages/MainDashboard.vue'),
    meta: { title: '主仪表盘' }
  },
  {
    path: '/trade',
    name: 'Trade',
    component: () => import('@/pages/Trade.vue'),
    meta: { title: '贸易分析' }
  },
  {
    path: '/culture',
    name: 'CulturalExchange',
    component: () => import('@/pages/CulturalExchange.vue'),
    meta: { title: '文化交流' }
  },
  {
    path: '/events',
    name: 'HistoricalEvents',
    component: () => import('@/pages/HistoricalEvents.vue'),
    meta: { title: '历史事件' }
  },
  {
    path: '/location',
    name: 'Location',
    component: () => import('@/pages/Location.vue'),
    meta: { title: '位置' }
  },
  {
    path: '/sites',
    name: 'Sites',
    component: () => import('@/pages/Site.vue'),
    meta: { title: '遗址展示' }
  },
  {
    path: '/sites/:id',
    name: 'SiteDetail',
    component: () => import('@/pages/SiteDetail.vue'),
    meta: { title: '遗址详情' }
  }
]
```

### 路由守卫
- 页面标题更新
- 页面切换动画
- 加载状态管理

## 数据策略

### 数据来源说明

1. **已提供的数据文件**
   - 部分城市数据JSON文件
   - 地球纹理贴图（textures）
   - 需要直接使用这些真实数据

2. **需要创建的伪数据**
   - 缺失的城市数据
   - 历史事件数据
   - 贸易记录数据
   - 文化遗址数据
   - 基于历史事实创建合理的模拟数据

3. **图片资源处理**
   - 使用单张占位图片代替所有图片资源
   - 图片路径统一指向同一个占位图
   - 保持数据结构完整性

4. **3D模型处理**
   - 创建简单的占位3D模型或使用基础几何体
   - 确保GLB/GLTF加载逻辑正确
   - 后续可替换为真实Blender模型

## 数据模型设计

### 城市数据模型


```typescript
interface City {
  id: string
  name: string
  nameEn: string
  lat: number
  lng: number
  description: string
  period: string[]
  importance: number  // 1-5
  population?: number
  trades: string[]    // 主要贸易商品
  culture: string[]   // 文化特征
  images: string[]
}
```

### 历史事件数据模型

```typescript
interface HistoricalEvent {
  id: string
  title: string
  year: number
  dynasty: string
  type: 'political' | 'economic' | 'cultural' | 'military'
  description: string
  importance: number  // 1-5
  relatedCities: string[]
  relatedRoutes: string[]
  images?: string[]
  references?: string[]
}
```

### 贸易数据模型

```typescript
interface TradeRecord {
  id: string
  period: string
  fromCity: string
  toCity: string
  goods: string
  volume: number
  value: number
  route: string
}

interface TradeGoods {
  id: string
  name: string
  category: 'textile' | 'spice' | 'metal' | 'ceramic' | 'other'
  origin: string[]
  destination: string[]
  peakPeriod: string
}
```

### 文化遗址数据模型

```typescript
interface CulturalSite {
  id: string
  name: string
  nameEn: string
  type: 'city' | 'temple' | 'tomb' | 'fortress' | 'other'
  lat: number
  lng: number
  period: string[]
  dynasty: string[]
  description: string
  history: string
  discovery: string
  images: string[]
  artifacts: Artifact[]
  videos?: string[]
}

interface Artifact {
  id: string
  name: string
  type: ArtifactType  // 文物类型
  period: string
  material: string
  description: string
  images: string[]
  model3D?: string  // GLB/GLTF文件路径
  dimensions?: {
    height: number
    width: number
    depth: number
  }
  displayConfig?: DisplayConfig  // 自定义展示配置
}
```

### 展示预设配置文件

展示预设配置存储在 `assets/data/displayPresets.json` 文件中，允许开发者和内容管理者自定义文物展示效果。

```json
{
  "version": "1.0",
  "presets": {
    "pottery": {
      "name": "陶器展示",
      "description": "适合陶罐、陶瓶等器皿类文物",
      "config": {
        "cameraDistance": 2.5,
        "cameraAngle": {
          "azimuth": 45,
          "elevation": 20
        },
        "targetOffset": {
          "x": 0,
          "y": 0.3,
          "z": 0
        },
        "lightIntensity": 1.2,
        "autoRotateSpeed": 0.5
      }
    },
    "sculpture": {
      "name": "雕塑展示",
      "description": "适合佛像、人物雕塑等立体文物",
      "config": {
        "cameraDistance": 3.0,
        "cameraAngle": {
          "azimuth": 30,
          "elevation": 15
        },
        "targetOffset": {
          "x": 0,
          "y": 0.5,
          "z": 0
        },
        "lightIntensity": 1.5,
        "autoRotateSpeed": 0.3
      }
    }
  },
  "customPresets": {
    "terracotta_warrior": {
      "name": "兵马俑专用",
      "description": "专门为兵马俑优化的展示配置",
      "config": {
        "cameraDistance": 3.5,
        "cameraAngle": {
          "azimuth": 25,
          "elevation": 10
        },
        "targetOffset": {
          "x": 0,
          "y": 0.8,
          "z": 0
        },
        "lightIntensity": 1.6,
        "autoRotateSpeed": 0.2
      }
    }
  }
}
```

## 服务层设计

### Data Service（数据服务）

```typescript
class DataService {
  // 加载城市数据
  async loadCities(): Promise<City[]>
  
  // 加载历史事件
  async loadEvents(): Promise<HistoricalEvent[]>
  
  // 加载贸易数据
  async loadTradeData(): Promise<TradeRecord[]>
  
  // 加载遗址数据
  async loadSites(): Promise<CulturalSite[]>
  
  // 加载GeoJSON数据
  async loadGeoJSON(type: string): Promise<any>
  
  // 根据时期筛选数据
  filterByPeriod<T>(data: T[], period: string): T[]
  
  // 根据城市筛选数据
  filterByCity<T>(data: T[], cityId: string): T[]
}
```

### Export Service（导出服务）

```typescript
class ExportService {
  // 导出为JSON
  exportToJSON(data: any, filename: string): void
  
  // 导出为CSV
  exportToCSV(data: any[], filename: string): void
  
  // 导出图表为图片
  exportChartAsImage(chartInstance: any, filename: string): void
}
```

### Model Loader Service（模型加载服务）

```typescript
class ModelLoaderService {
  private loader: GLTFLoader
  private cache: Map<string, GLTF>
  
  // 加载3D模型
  async loadModel(url: string): Promise<GLTF>
  
  // 预加载模型
  async preloadModels(urls: string[]): Promise<void>
  
  // 清除缓存
  clearCache(): void
}
```

## 工具函数设计

### Three.js 辅助函数

```typescript
// 经纬度转换
export function latLngToVector3(
  lat: number, 
  lng: number, 
  radius: number
): THREE.Vector3

// 创建城市标注
export function createCityMarker(
  city: City, 
  radius: number
): THREE.Group

// 创建路线
export function createRoute(
  points: [number, number][], 
  radius: number
): THREE.Mesh

// 创建星空背景
export function createStarField(count: number): THREE.Points

// 创建文字纹理
export function createTextTexture(
  text: string, 
  options: TextOptions
): THREE.CanvasTexture
```

### 坐标转换工具

```typescript
// 地理坐标转屏幕坐标
export function geoToScreen(
  lat: number, 
  lng: number, 
  camera: THREE.Camera, 
  renderer: THREE.WebGLRenderer
): { x: number, y: number }

// 计算两点间的大圆距离
export function greatCircleDistance(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number

// 生成弧线路径点
export function generateArcPoints(
  start: [number, number], 
  end: [number, number], 
  segments: number
): [number, number][]
```

### 数据处理工具

```typescript
// 按时期分组
export function groupByPeriod<T>(
  data: T[], 
  periodKey: string
): Record<string, T[]>

// 聚合贸易数据
export function aggregateTradeData(
  records: TradeRecord[], 
  groupBy: 'city' | 'goods' | 'period'
): any[]

// 计算统计数据
export function calculateStatistics(
  data: number[]
): {
  mean: number
  median: number
  max: number
  min: number
}
```

## Web Workers 设计

### Data Worker（数据处理Worker）


```typescript
// dataWorker.ts
self.onmessage = (e: MessageEvent) => {
  const { type, data } = e.data
  
  switch (type) {
    case 'FILTER_BY_PERIOD':
      const filtered = filterByPeriod(data.items, data.period)
      self.postMessage({ type: 'FILTER_RESULT', data: filtered })
      break
      
    case 'AGGREGATE_DATA':
      const aggregated = aggregateData(data.items, data.groupBy)
      self.postMessage({ type: 'AGGREGATE_RESULT', data: aggregated })
      break
      
    case 'CALCULATE_STATS':
      const stats = calculateStatistics(data.values)
      self.postMessage({ type: 'STATS_RESULT', data: stats })
      break
  }
}
```

### Trade Worker（贸易数据Worker）

```typescript
// tradeWorker.ts
self.onmessage = (e: MessageEvent) => {
  const { type, data } = e.data
  
  switch (type) {
    case 'PROCESS_TRADE_DATA':
      const processed = processTradeData(data.records)
      self.postMessage({ type: 'TRADE_DATA_READY', data: processed })
      break
      
    case 'CALCULATE_TRADE_VOLUME':
      const volume = calculateTradeVolume(data.records, data.filters)
      self.postMessage({ type: 'VOLUME_RESULT', data: volume })
      break
  }
}
```

## 样式设计

### 设计系统

#### 颜色方案

```scss
// variables.scss
$primary-color: #c9a063;      // 金色（丝绸之路主题色）
$secondary-color: #8b4513;    // 棕色（沙漠色）
$accent-color: #4a90e2;       // 蓝色（天空/海洋）
$success-color: #52c41a;
$warning-color: #faad14;
$error-color: #f5222d;

$text-primary: #262626;
$text-secondary: #595959;
$text-disabled: #bfbfbf;

$bg-primary: #ffffff;
$bg-secondary: #f5f5f5;
$bg-dark: #1a1a1a;

$border-color: #d9d9d9;
$shadow-color: rgba(0, 0, 0, 0.15);
```

#### 断点设计

```scss
$breakpoint-mobile: 320px;
$breakpoint-tablet: 768px;
$breakpoint-desktop: 1024px;
$breakpoint-wide: 1440px;
$breakpoint-ultra: 2560px;

@mixin mobile {
  @media (max-width: #{$breakpoint-tablet - 1px}) {
    @content;
  }
}

@mixin tablet {
  @media (min-width: $breakpoint-tablet) and (max-width: #{$breakpoint-desktop - 1px}) {
    @content;
  }
}

@mixin desktop {
  @media (min-width: $breakpoint-desktop) {
    @content;
  }
}
```

#### 动画过渡

```scss
// transitions.scss
$transition-fast: 0.15s ease;
$transition-base: 0.3s ease;
$transition-slow: 0.5s ease;

@mixin fade-in {
  animation: fadeIn $transition-base;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@mixin slide-up {
  animation: slideUp $transition-base;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

## 性能优化策略

### 1. 代码分割
- 路由级别的懒加载
- 组件按需加载
- 第三方库动态导入

### 2. 资源优化
- 图片懒加载
- 图片格式优化（WebP）
- 3D模型压缩
- 纹理贴图优化

### 3. 渲染优化
- Three.js场景优化
  - 使用LOD（Level of Detail）
  - 视锥体剔除
  - 对象池复用
  - 减少draw calls
- ECharts图表优化
  - 数据采样
  - 渐进式渲染
  - 按需更新

### 4. 数据处理优化
- Web Workers处理大数据集
- 数据分页加载
- 虚拟滚动
- 缓存策略

### 5. 网络优化
- HTTP/2
- Gzip压缩
- CDN加速
- 资源预加载

## 错误处理

### 错误类型定义

```typescript
enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  DATA_LOAD_ERROR = 'DATA_LOAD_ERROR',
  MODEL_LOAD_ERROR = 'MODEL_LOAD_ERROR',
  RENDER_ERROR = 'RENDER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

interface AppError {
  type: ErrorType
  message: string
  details?: any
  timestamp: number
}
```

### 错误处理策略

1. **网络错误**
   - 自动重试机制（最多3次）
   - 降级方案（使用缓存数据）
   - 用户友好的错误提示

2. **数据加载错误**
   - 显示加载失败状态
   - 提供重新加载按钮
   - 记录错误日志

3. **3D渲染错误**
   - WebGL兼容性检测
   - 降级到2D展示
   - 性能监控和自动调整

4. **模型加载错误**
   - 显示占位图
   - 提供备用展示方式
   - 错误上报

## 测试策略

### 单元测试
- 工具函数测试
- 数据处理逻辑测试
- Store actions测试
- 使用 Vitest 作为测试框架

### 组件测试
- 组件渲染测试
- 用户交互测试
- Props和Events测试
- 使用 Vue Test Utils

### E2E测试
- 关键用户流程测试
- 页面导航测试
- 数据加载和展示测试
- 使用 Playwright 或 Cypress

### 性能测试
- 首屏加载时间
- 3D渲染帧率
- 内存使用监控
- 使用 Lighthouse

## 部署方案

### 构建配置

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'es2015',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
          'echarts': ['echarts'],
          'vue-vendor': ['vue', 'vue-router', 'pinia']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['three', 'echarts', 'gsap']
  }
})
```

### 环境配置
- 开发环境（development）
- 测试环境（staging）
- 生产环境（production）

### CI/CD流程
1. 代码提交触发构建
2. 运行测试套件
3. 代码质量检查
4. 构建生产版本
5. 部署到服务器
6. 健康检查

## 浏览器兼容性

### 目标浏览器
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### 兼容性处理
- Polyfills（core-js）
- CSS前缀（autoprefixer）
- WebGL降级方案
- 移动端适配

## 可访问性

### WCAG 2.1 AA标准
- 键盘导航支持
- 屏幕阅读器支持
- 颜色对比度符合标准
- 焦点指示清晰
- 替代文本提供

### 实现方案
- 语义化HTML
- ARIA属性
- 键盘事件处理
- 焦点管理

## 国际化

### 多语言支持
- 中文（简体）
- 英文

### 实现方案
- 使用 vue-i18n
- 语言文件分离
- 动态切换语言
- 日期和数字格式化

## 安全考虑

### 前端安全
- XSS防护
- CSRF防护
- 内容安全策略（CSP）
- 安全的第三方依赖

### 数据安全
- 敏感数据不在前端存储
- HTTPS传输
- 输入验证和清理

## 监控和分析

### 性能监控
- 页面加载时间
- 资源加载时间
- 3D渲染性能
- 用户交互响应时间

### 用户行为分析
- 页面访问统计
- 功能使用频率
- 用户路径分析
- 错误追踪

### 工具选择
- Google Analytics
- Sentry（错误追踪）
- 自定义性能监控

