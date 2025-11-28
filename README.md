# Silk Road Visualization System / 丝绸之路可视化系统

[English](#english) | [中文](#chinese)

<a name="english"></a>

## 🌍 Project Overview

**Silk Road Visualization System** is a web-based interactive platform designed to visualize historical data related to the Silk Road. It combines 3D globe visualization, 2D GIS maps, and data charts to present the trade routes, cities, and historical events of the Silk Road across different dynasties (Tang, Ming, Qing).

One of the unique features of this project is the integration of **Gesture Control**, allowing users to interact with the 3D globe using hand gestures via a webcam.

## ✨ Key Features

- **3D Globe Visualization**: Interactive 3D globe displaying Silk Road cities and routes using Three.js.
- **Gesture Control**: AI-powered hand gesture recognition (using MediaPipe) to rotate and zoom the globe without touching the screen.
  - **One-hand pinch**: Rotate the globe.
  - **Two-hands pinch/spread**: Zoom in/out.
- **Historical Maps (Ming & Qing)**: Detailed 2D GIS maps powered by Mapbox GL, visualizing city distributions and administrative changes during the Ming and Qing dynasties.
- **Timeline Interaction**: Filter historical data dynamically by year using a timeline slider.
- **Data Visualization**: Charts and graphs representing trade volumes and other statistical data (using ECharts).
- **Responsive Design**: Modern UI built with Vue 3 and SCSS.

## 🛠 Tech Stack

- **Framework**: [Vue 3](https://vuejs.org/) (Composition API) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **State Management**: [Pinia](https://pinia.vuejs.org/)
- **Visualization**:
  - [Three.js](https://threejs.org/) (3D Globe)
  - [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) (2D Maps)
  - [ECharts](https://echarts.apache.org/) (Charts)
- **AI / Computer Vision**: [MediaPipe Tasks Vision](https://developers.google.com/mediapipe) (Gesture Control)
- **Styling**: SCSS, [GSAP](https://greensock.com/gsap/) (Animations)
- **Data Handling**: `shapefile`, `shpjs` (GIS data parsing)

## 📂 Project Structure

```
silkroad_v1.0.0/
├── public/              # Static assets (GIS data, models, textures)
├── src/
│   ├── assets/          # Component assets
│   ├── components/      # Vue components (Globe3D, MapControls, etc.)
│   ├── composables/     # Composition API logic (e.g., useGestureControl)
│   ├── router/          # Vue Router configuration
│   ├── services/        # Data services and API handling
│   ├── stores/          # Pinia stores
│   ├── styles/          # Global SCSS styles
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions (Three.js helpers, coordinate utils)
│   ├── views/           # Page views (Home, MingQing, Trade, etc.)
│   ├── App.vue          # Root component
│   └── main.ts          # Entry point
├── .env                 # Environment variables
├── package.json         # Dependencies and scripts
└── vite.config.ts       # Vite configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd silkroad_v1.0.0
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Project

Start the development server:
```bash
npm run dev
```
Open your browser and visit `http://localhost:5173` (or the port shown in the terminal).

### Building for Production

Build the project for deployment:
```bash
npm run build
```
The output files will be in the `dist` directory.

## 📖 Usage

1. **Home Page**: Explore the 3D globe. Click the "Camera" icon to enable gesture control.
2. **Ming & Qing Map**: Navigate to the Ming/Qing section to view historical administrative maps. Use the timeline at the bottom to change the year.
3. **Trade & Transport**: View specific visualizations for trade routes and transportation networks.

---

<a name="chinese"></a>

## 🌍 项目简介

**丝绸之路可视化系统 (Silk Road Visualization System)** 是一个基于 Web 的交互式平台，旨在可视化丝绸之路相关的历史数据。它结合了 3D 地球可视化、2D GIS 地图和数据图表，展示了不同朝代（唐、明、清）的贸易路线、城市和历史事件。

本项目的独特功能之一是集成了**手势控制**，允许用户通过网络摄像头使用手势与 3D 地球进行交互。

## ✨ 主要功能

- **3D 地球可视化**: 使用 Three.js 构建的交互式 3D 地球，展示丝绸之路的城市和路线。
- **手势控制**: 基于 AI 的手势识别（使用 MediaPipe），无需触摸屏幕即可旋转和缩放地球。
  - **单手捏合**: 旋转地球。
  - **双手开合**: 缩放地球。
- **历史地图（明清）**: 基于 Mapbox GL 的详细 2D GIS 地图，可视化明清时期的城市分布和行政变迁。
- **时间轴交互**: 使用时间轴滑块按年份动态过滤历史数据。
- **数据可视化**: 使用 ECharts 展示贸易量和其他统计数据的图表。
- **响应式设计**: 基于 Vue 3 和 SCSS 构建的现代 UI。

## 🛠 技术栈

- **框架**: [Vue 3](https://vuejs.org/) (Composition API) + [TypeScript](https://www.typescriptlang.org/)
- **构建工具**: [Vite](https://vitejs.dev/)
- **状态管理**: [Pinia](https://pinia.vuejs.org/)
- **可视化**:
  - [Three.js](https://threejs.org/) (3D 地球)
  - [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) (2D 地图)
  - [ECharts](https://echarts.apache.org/) (图表)
- **AI / 计算机视觉**: [MediaPipe Tasks Vision](https://developers.google.com/mediapipe) (手势控制)
- **样式**: SCSS, [GSAP](https://greensock.com/gsap/) (动画)
- **数据处理**: `shapefile`, `shpjs` (GIS 数据解析)

## 📂 项目结构

```
silkroad_v1.0.0/
├── public/              # 静态资源 (GIS 数据, 模型, 纹理)
├── src/
│   ├── assets/          # 组件资源
│   ├── components/      # Vue 组件 (Globe3D, MapControls 等)
│   ├── composables/     # 组合式 API 逻辑 (如 useGestureControl)
│   ├── router/          # Vue Router 配置
│   ├── services/        # 数据服务和 API 处理
│   ├── stores/          # Pinia 状态仓库
│   ├── styles/          # 全局 SCSS 样式
│   ├── types/           # TypeScript 类型定义
│   ├── utils/           # 工具函数 (Three.js 辅助, 坐标工具)
│   ├── views/           # 页面视图 (Home, MingQing, Trade 等)
│   ├── App.vue          # 根组件
│   └── main.ts          # 入口文件
├── .env                 # 环境变量
├── package.json         # 依赖和脚本
└── vite.config.ts       # Vite 配置
```

## 🚀 快速开始

### 前置要求

- Node.js (推荐 v16+)
- npm 或 yarn

### 安装

1. 克隆仓库:
   ```bash
   git clone <repository-url>
   cd silkroad_v1.0.0
   ```

2. 安装依赖:
   ```bash
   npm install
   ```

### 运行项目

启动开发服务器:
```bash
npm run dev
```
打开浏览器并访问 `http://localhost:5173` (或终端中显示的端口)。

### 构建生产版本

构建用于部署的项目:
```bash
npm run build
```
输出文件将位于 `dist` 目录中。

## 📖 使用说明

1. **首页**: 探索 3D 地球。点击“相机”图标开启手势控制。
2. **明清地图**: 导航至明清部分查看历史行政地图。使用底部的时间轴更改年份。
3. **贸易与交通**: 查看贸易路线和交通网络的具体可视化内容。
