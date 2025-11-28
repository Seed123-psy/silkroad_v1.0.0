# 丝绸之路可视化系统 - 项目结构

## 目录结构

```
silkroad_v1.0.0/
├── public/              # 公共静态资源
│   ├── data/            # GIS数据 (Shapefiles, GeoJSON)
│   ├── images/          # 图片资源
│   └── textures/        # 3D纹理资源
├── scripts/             # 脚本工具
│   └── checkTangData.mjs # 数据检查脚本
├── src/
│   ├── assets/          # 静态资源
│   │   ├── data/        # 本地JSON数据
│   │   └── styles/      # 组件样式
│   ├── components/      # Vue组件
│   │   ├── layout/      # 布局组件 (ToolSidebar)
│   │   ├── CityInfoPanel.vue
│   │   ├── Globe3D.vue
│   │   ├── MapControls.vue
│   │   └── TradeVolumeChart.vue
│   ├── composables/     # 组合式API (Hooks)
│   │   └── useGestureControl.ts
│   ├── router/          # 路由配置
│   ├── services/        # 业务服务
│   │   ├── dataService.ts
│   │   ├── exportService.ts
│   │   └── modelLoaderService.ts
│   ├── stores/          # Pinia状态管理
│   │   ├── app.ts
│   │   └── chartStore.ts
│   ├── styles/          # 全局样式
│   │   ├── global.scss
│   │   └── variables.scss
│   ├── types/           # TypeScript类型定义
│   │   ├── artifact.ts
│   │   ├── city.ts
│   │   ├── display.ts
│   │   ├── event.ts
│   │   ├── mapbox-gl.d.ts
│   │   ├── shapefile.d.ts
│   │   └── trade.ts
│   ├── utils/           # 工具函数
│   │   ├── coordinateUtils.ts
│   │   ├── dataProcessor.ts
│   │   └── threeHelpers.ts
│   ├── views/           # 页面视图
│   │   ├── DamingPalace.vue
│   │   ├── Home.vue
│   │   ├── MingQing.vue
│   │   ├── SilkRoad.vue
│   │   ├── Trade.vue
│   │   └── Transport.vue
│   ├── App.vue          # 根组件
│   ├── main.ts          # 入口文件
│   ├── vite-env.d.ts    # Vite环境变量类型
│   └── shims-vue.d.ts   # Vue组件类型声明
├── eslint.config.js     # ESLint配置
├── index.html           # HTML入口
├── package.json         # 项目依赖
├── tsconfig.json        # TypeScript配置
├── vite.config.ts       # Vite配置
└── README.md            # 项目说明
```

## 已安装的核心依赖

### 生产依赖 (dependencies)
- **vue**: ^3.5.24 - Vue 3框架
- **vue-router**: 路由管理
- **pinia**: 状态管理
- **three**: Three.js 3D库
- **mapbox-gl**: Mapbox GL JS 地图库
- **echarts**: ECharts图表库
- **vue-echarts**: ECharts Vue封装
- **gsap**: GSAP动画库
- **@mediapipe/tasks-vision**: 计算机视觉(手势识别)
- **shapefile / shpjs**: GIS数据解析
- **@headlessui/vue**: 无样式UI组件
- **@heroicons/vue**: 图标库

### 开发依赖 (devDependencies)
- **vite**: 构建工具
- **typescript**: TypeScript支持
- **sass**: Sass预处理器
- **eslint**: 代码检查
- **prettier**: 代码格式化
- **vue-tsc**: Vue类型检查

## 可用脚本

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 代码检查和修复
npm run lint

# 代码格式化
npm run format
```

## 配置说明

### 路径别名
项目配置了 `@` 别名指向 `src` 目录，可以使用：
```typescript
import Component from '@/components/Component.vue'
```

### SCSS全局变量
在 `src/styles/variables.scss` 中定义了全局SCSS变量，所有组件中可直接使用。

### 环境变量
- `.env`: 通用环境变量
- `.env.development`: 开发环境变量
- `.env.production`: 生产环境变量

使用方式：
```typescript
const apiUrl = import.meta.env.VITE_APP_BASE_API
```
