# 丝绸之路可视化系统 - 项目结构

## 目录结构

```
silkroad_v1.0.0/
├── src/
│   ├── assets/          # 静态资源
│   │   ├── images/      # 图片资源
│   │   └── models/      # 3D模型资源
│   ├── components/      # 组件
│   │   ├── common/      # 通用组件
│   │   ├── layout/      # 布局组件
│   │   └── visualization/ # 可视化组件
│   ├── router/          # 路由配置
│   ├── stores/          # Pinia状态管理
│   ├── views/           # 页面视图
│   ├── utils/           # 工具函数
│   ├── services/        # API服务
│   ├── types/           # TypeScript类型定义
│   ├── styles/          # 全局样式
│   │   ├── variables.scss  # SCSS变量
│   │   └── global.scss     # 全局样式
│   ├── App.vue          # 根组件
│   ├── main.ts          # 入口文件
│   ├── vite-env.d.ts    # Vite环境变量类型
│   └── shims-vue.d.ts   # Vue组件类型声明
├── public/              # 公共静态资源
├── .eslintrc.cjs        # ESLint配置
├── .prettierrc.json     # Prettier配置
├── .prettierignore      # Prettier忽略文件
├── vite.config.ts       # Vite配置
├── tsconfig.json        # TypeScript配置
├── tsconfig.app.json    # 应用TypeScript配置
├── package.json         # 项目依赖
├── .env                 # 环境变量
├── .env.development     # 开发环境变量
└── .env.production      # 生产环境变量
```

## 已安装的核心依赖

### 生产依赖
- **vue**: ^3.5.24 - Vue 3框架
- **vue-router**: 路由管理
- **pinia**: 状态管理
- **three**: Three.js 3D库
- **@types/three**: Three.js类型定义
- **echarts**: ECharts图表库
- **gsap**: GSAP动画库

### 开发依赖
- **vite**: 构建工具
- **typescript**: TypeScript支持
- **sass**: Sass预处理器
- **eslint**: 代码检查
- **prettier**: 代码格式化
- **@typescript-eslint/parser**: TypeScript ESLint解析器
- **@typescript-eslint/eslint-plugin**: TypeScript ESLint插件
- **eslint-plugin-vue**: Vue ESLint插件
- **eslint-config-prettier**: Prettier ESLint配置
- **eslint-plugin-prettier**: Prettier ESLint插件

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
