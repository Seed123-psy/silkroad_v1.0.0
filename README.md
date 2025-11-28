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

### 🗺 LiangHan Dataset (两汉交通)

- All shapefiles (Western/Eastern Han points and route lines) live in `public/data/lianghan/`.
- The accompanying point attribute tables are stored in Excel form (`*_han_points.xlsx`). Convert them into JSON with:
  ```bash
  node scripts/convertLiangHanXlsx.mjs
  ```
  This regenerates `src/assets/data/liangHan/{westernHanPoints,easternHanPoints}.json`, which the `LiangHan.vue` view merges with the shapefiles at runtime.
- If you add new fields to the spreadsheets, re-run the conversion script and reload the app to see the updated sidebar/hover details.
- A helper script `scripts/inspectLiangHan.mjs` prints the available shapefile attributes for quick sanity checks during future dataset updates.

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

### 🗺 两汉交通数据

- 所有西汉/东汉交通点与两汉交通线的 Shapefile 文件位于 `public/data/lianghan/`。
- `*_han_points.xlsx` 为交通点属性表，可通过以下命令转为前端直接加载的 JSON：
  ```bash
  node scripts/convertLiangHanXlsx.mjs
  ```
  该脚本会更新 `src/assets/data/liangHan/westernHanPoints.json` 与 `easternHanPoints.json`，`LiangHan.vue` 会在运行时自动合并这些属性并渲染侧栏/悬浮面板。
- 如需核对 Shapefile 字段，可执行 `node scripts/inspectLiangHan.mjs` 快速打印属性列表，便于后续扩展。

#### 丝绸之路路线说明

**西汉丝绸之路（公元前138年－公元8年）** 以张骞第一次出使为起点，依托《史记》《汉书》及居延、悬泉汉简等史料，结合考古遗址复原长安经关中、河西走廊至西域南北道并延伸到中亚、南亚的交通网络。汉武帝经营河西、汉宣帝设西域都护后，丝路日益繁荣，140 余年的西汉线路奠定了此后历代丝路格局。

**东汉丝绸之路（公元25年－220年）** 大体沿袭西汉走向，但因西汉末动荡与“三通三绝”的对匈关系，出现长安高平道、陈仓狭道、新北道等调整，特别是在光武、安帝时期北道得到充分利用。尽管历经约 80 年中断，整体上仍保持近 200 年的通行。

**丝路东段诸道（长安－阳关/玉门）** 由陇右道、河西走廊道、羌中道及若干支路构成，东段诸线路在黄河沿岸汇聚后进入走廊。

**萧关道** 东起萧关，越六盘山至祖厉，沿祖厉河入黄河，经鹯阴渡抵姑臧，与走廊主线衔接。

**回中道** 自长安西北，渡渭水至咸阳，沿千河与陇山东麓北上至萧关，是关中与陇东间的要道。

**陇关道** 西汉后期开辟，东起汧县，经陇关、西南下清水至狄道；再分北路（金城渡河入河西）与西路（枹罕、允吾、临羌后北上出大斗拔谷接走廊），多处黄河渡口连接河湟道。

**略阳道** 始于东汉建武二年，路线为陇关－略阳－平襄－金城，再由金城诸渡进入河西走廊。

**河西走廊道** 自姑臧出发，经番和、删丹、觻得、禄福、酒泉至敦煌，穿阳关、玉门关赴西域，是汉通西域的关键通道。

**羌中道** 包含河湟道与婼羌道：河湟道由狄道至枹罕后分北、西两路，北上金城，西上河关渡、允吾、破羌、安夷、西都，出焉支山接删丹；婼羌道则自西都西行，经柴达木、阿尔金山至鄯善，与西域南道贯通。

**丝路东段其他道路** 包括长安萧关道（长安－平陵－茂陵－梁山宫－安定）、凤翔灵台道（雍县北上安定）以及长安汧县道（长安－梁山宫－岐山李家道行宫－凤翔－隃麋－汧县）等，为关中对外联系提供补充。

**丝路中段（玉门/阳关－葱岭）** 以楼兰为分叉点，形成北道、南道与东汉新北道，并由纵向道路连结成网络。

**西域北道** 贯穿天山南麓与塔里木河流域，出玉门关至高昌壁、交河、危须、焉耆、尉犁、乌垒、延城、姑墨，越葱岭后或经温宿、拔达岭至郅支城，或由疏勒进入捐毒、休循、大宛、康居等地。

**西域南道** 阳关后分罗布泊北、南两支至楼兰、扜泥，合流经且末、精绝、扜弥到于阗，再分皮山—莎车—瓦罕方向，或皮山—西夜—难兜—悬度至循鲜。

**新北道** 东汉时期开通，自敦煌西北经伊吾、蒲类、车师、卑陆、东西且弥，终至赤谷城、姑墨，与北道衔接，成为解决“三绝”时期交通的备用通道。

**丝路西段（越葱岭）** 依《帕提亚驿程志》等资料复原，线路分北（通往奄蔡）、南（抵身毒）与西行主干。西行经安息东境的安提俄喀亚向西穿越阿帕米亚、塞琉西亚，再沿幼发拉底河分支至卡剌克斯或北上宙格玛、君士坦丁堡，亦可沿海岸抵埃及亚历山大里亚，展现丝路与中亚、西亚、欧洲、非洲的深度联通。
