# 丝绸之路可视化系统

## 中文版说明

### 1. 项目概述

丝绸之路可视化系统是一个重现丝绸之路多朝代格局的交互式 Web 应用。项目将支持手势的 3D 球体、基于 Mapbox 的 GIS 场景以及 ECharts 数据面板整合到统一界面中，用于展示沿线城市、交通路线、贸易记录与关键历史事件。

### 2. 核心功能

- Three.js 构建的 3D 地球，可自由旋转、缩放并高亮城市节点。
- 基于 MediaPipe 的手势识别，可将捏合、张开、旋转动作映射到镜头交互。
- Mapbox GL 呈现的 2D 朝代地图（唐、明、清、两汉等），支持自定义 GeoJSON 覆盖层。
- 通过 ECharts 与时间轴组件展现贸易与交通分析视图。
- 数据处理工具链，支持 Shapefile、Excel 属性表与模拟贸易记录的生成。
- Vue 3 + Pinia 架构，组件、组合式函数、类型定义均采用 TypeScript 管理。

### 3. 架构要点

- `src/components`：界面组件库，如 `Globe3D.vue`、`MapControls.vue`、信息面板等。
- `src/views`：页面级路由，包括 `MingQing.vue`、`LiangHan.vue`、`Trade.vue`、`Transport.vue`。
- `src/composables/useGestureControl.ts`：封装手势识别逻辑，负责摄像头采集与动作解析。
- `src/services`：数据加载、导出以及 GLTF 模型缓存工具。
- `src/stores`：Pinia 状态仓库（如 `app`、`chartStore`）。
- `public/data`：按朝代划分的历史 GIS 数据（Shapefile、GeoJSON、Excel）。
- `public/models/hand_landmarker.task`：手势识别所需的 MediaPipe 模型。
- `public/wasm/vision_wasm_internal.js`：MediaPipe WASM 运行时，保证浏览器端推理。

### 4. 数据资产与维护脚本

| 数据 / 脚本 | 路径 | 功能说明 |
| --- | --- | --- |
| 两汉 Shapefile | `public/data/lianghan/` | 包含西汉、东汉城市节点与线路 |
| `convertLiangHanXlsx.mjs` | `scripts/convertLiangHanXlsx.mjs` | 将 Excel 属性表转换为前端 JSON 数据 |
| `inspectLiangHan.mjs` | `scripts/inspectLiangHan.mjs` | 输出要素数量与字段名称，辅助数据核验 |
| `checkTangData.mjs` | `scripts/checkTangData.mjs` | 检查唐代压缩包内 Shapefile 结构是否完整 |
| `generate_trades.mjs` | `scripts/generate_trades.mjs` | 生成最多 1000 条示例贸易记录供分析展示 |

脚本通过 `node <脚本路径>` 执行，默认依赖仓库中的数据目录结构。

### 5. 项目结构（节选）

```
silkroad_v1.0.0/
├── public/
│   ├── data/               # 朝代数据、GIS 文件、Excel 资源
│   ├── models/             # MediaPipe 手势模型
│   └── wasm/               # MediaPipe WASM 运行库
├── scripts/                # 数据处理与检查脚本
├── src/
│   ├── assets/             # JSON 数据、贴图等静态资源
│   ├── components/         # Vue 组件（含 3D、面板、控件）
│   ├── composables/        # 组合式函数（如手势控制）
│   ├── router/             # 路由配置
│   ├── services/           # 数据与模型加载服务
│   ├── stores/             # Pinia 状态管理
│   ├── styles/             # 全局 SCSS 样式
│   ├── types/              # TypeScript 类型定义
│   ├── utils/              # 工具函数（坐标转换、Three.js 辅助）
│   └── views/              # 页面视图
├── eslint.config.js
├── package.json
├── tsconfig.json
# 丝绸之路可视化系统（简介）

本项目为研究用的交互式可视化系统，重建并展示不同时期的丝绸之路网络，包含三维地球视图、Mapbox 平面图层与可交互分析面板。项目以科研复现与数据可追溯性为目标，所有数据按朝代分类存放于 `public/data/`。

快速开始

```bash
git clone <repository-url>
cd silkroad_v1.0.0
npm ci
npm run dev
```

前后端运行说明

- **前端（开发）**: 在仓库根目录执行：

```bash
npm ci
npm run dev
```

这会启动基于 Vite 的开发服务器（默认绑定本地端口，浏览器会热重载）。

- **前端（构建与预览）**:

```bash
npm run build
npm run preview
```

- **后端（本地启动）**: 后端在 `server/` 目录，提供一个简单的 Express 服务用于 AI 请求代理与示例接口。启动方法：

```bash
cd server
npm ci
npm start
```

也可在项目根使用 `--prefix`：

```bash
npm --prefix server ci
npm --prefix server start
```

- **后端配置（可选）**: 在 `server/` 下创建 `.env` 文件以配置环境变量：

```env
# server/.env 示例
PORT=3000
SILICONFLOW_API_KEY=your_api_key_here
SILICONFLOW_API_URL=https://api.siliconflow.cn/v1
MODEL_ID=moonshotai/Kimi-K2-Instruct
```

`SILICONFLOW_API_KEY` 用于向上游模型服务授权请求；若不提供，后端会在无法转发时返回兜底文本。更多实现细节在 `server/index.js` 中。

## 文档导航


- [README.md](README.md)：项目总览与快速启动（根目录通用说明）。
- [README_en.md](README_en.md)：英文版项目说明。
- [README_zh.md](README_zh.md)：中文版项目说明（当前文件）。
- [DATA_LICENSES.md](DATA_LICENSES.md)：数据许可与使用说明，使用数据前请务必参阅。
- [REFERENCES.md](REFERENCES.md)：学术引用条目（BibTeX / APA 等格式）。
- [CONTRIBUTORS.md](CONTRIBUTORS.md)：贡献者名单。
- [public/data/lianghan/README.md](public/data/lianghan/README.md)：示例数据子目录（数据详情与字段说明）。

点击上方链接可在仓库中跳转到对应文档或数据子目录的 README，便于查阅许可与数据来源。

主要目录

- `src/` — 前端源码（Vue 3 + TypeScript）
- `public/data/` — 历史地理数据（按数据集含 `README.md`）
- `scripts/` — 数据处理与检查工具
- `REFERENCES.md`, `DATA_LICENSES.md` — 引用与许可说明

重要说明

- 数据许可：各数据集许可不同，使用前请阅读对应 `public/data/<dataset>/README.md` 与 `DATA_LICENSES.md`。
- 引用：请使用 `REFERENCES.md` 中提供的参考条目进行学术引用。

贡献

- 贡献者列表见 `CONTRIBUTORS.md`。

如需更多信息，请查看根目录 `README.md` 或联系仓库维护人。
- **3D 地球纹理**：来源于 NASA 公开纹理库（请遵照 NASA 的使用条款）。

第三方资源主要存放于 `public/data/`、`public/images/` 与 `src/assets/`，可能需要署名或遵守特定许可证。若需再分发或用于商业目的，请务必查明并获得必要许可。

### 致谢

感谢原始数据与研究作者对本项目的数据支持。数据详情与使用许可已记录在各数据子目录的 `README.md`（例如 `public/data/lianghan/README.md`）以及 `DATA_LICENSES.md` 中；学术引用请使用 `REFERENCES.md` 提供的条目。使用或再发布前，请遵守相应许可与署名要求。

### 参考文献

项目参考文献已统一收录于 `REFERENCES.md`（GB/T 7714-2015）。请在仓库根目录查看该文件以获取完整条目与其他格式（如 BibTeX、APA）。
