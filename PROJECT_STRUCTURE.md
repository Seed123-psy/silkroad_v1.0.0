# 丝绸之路可视化系统 - 项目结构

## 目录结构速览

```
silkroad_v1.0.0/
├── docs/                     # 文档与资料页
├── public/                   # 静态资源（随Vite直接发布）
│   ├── data/                 # GIS、历史路线等数据集（含子目录README）
│   ├── images/               # UI与宣传图片资源
│   ├── models/               # Three.js使用的模型与权重
│   ├── textures/             # 3D纹理
│   └── wasm/                 # Mediapipe等WebAssembly构件
├── scripts/                  # 辅助脚本
│   ├── checkTangData.mjs     # 唐代数据质量检查
│   ├── convertLiangHanXlsx.mjs
│   ├── extract_pdf_metadata.cjs
│   ├── generate_trades.mjs
│   └── inspectLiangHan.mjs
├── src/                      # 前端源码
│   ├── assets/               # 打包静态资源
│   │   ├── data/             # 内嵌JSON/GeoJSON等小型数据
│   │   └── styles/           # 组件局部样式
│   ├── components/           # Vue组件
│   │   ├── icons/            # 图标组件（按朝代划分）
│   │   ├── layout/           # 布局组件（ToolSidebar等）
│   │   ├── CityInfoPanel.vue
│   │   ├── Globe3D.vue
│   │   ├── HanFeaturePanel.vue
│   │   ├── MapControls.vue
│   │   └── TradeVolumeChart.vue
│   ├── composables/          # 组合式API hooks（例如useGestureControl）
│   ├── constants/            # 可视化颜色等常量
│   ├── services/             # 数据加载、模型、导出服务
│   ├── stores/               # Pinia状态（app、chartStore等）
│   ├── styles/               # 全局样式（global/variables）
│   ├── types/                # TypeScript定义（artifact、city、event等）
│   ├── utils/                # 工具函数（坐标、Three.js辅助、数据处理）
│   ├── views/                # 页面视图（Home、LiangHan、MengYuanRoutes、MengYuanTravel、MingQing、Trade、Transport）
│   ├── App.vue               # 根组件
│   ├── main.ts               # 入口文件
│   ├── shims-vue.d.ts        # Vue SFC声明
│   └── vite-env.d.ts         # Vite环境类型
├── eslint.config.js          # ESLint 扩展配置（兼容 .eslintrc.cjs）
├── historicalData.js         # 历史数据索引或汇总
├── index.html                # Vite入口模板
├── package.json              # 依赖与脚本
├── tsconfig*.json            # TypeScript配置
├── vite.config.ts            # Vite配置
├── README*.md                # 多语言项目说明
└── DATA_LICENSES.md 等       # 许可证、参考文献、贡献者列表
```

## 关键依赖

- **核心框架**：Vue 3、Vue Router、Pinia
- **三维与地理**：Three.js、Mapbox GL JS、fflate（压缩）、shapefile/shpjs（矢量数据解析）
- **可视化**：ECharts、ECharts-GL、Vue-ECharts
- **交互与动画**：GSAP、@headlessui/vue、@heroicons/vue
- **手势识别**：@mediapipe/tasks-vision（需配套`public/wasm`资源）
- **类型支持**：TypeScript、@types/three、@types/mapbox-gl 等

## NPM脚本

```bash
npm run dev       # 启动开发服务器
npm run build     # 类型检查并构建生产包
npm run preview   # 预览构建产物
npm run lint      # ESLint检查（自动修复常见问题）
npm run format    # Prettier格式化src目录
```

## 配置与约定

- **路径别名**：`@` → `src`，用于简化导入路径。
- **全局样式**：`src/styles/variables.scss` 中声明的变量在整个项目中可直接使用。
- **环境变量**：`.env*` 文件提供多环境配置，通过 `import.meta.env` 访问（例如 `import.meta.env.VITE_MAPBOX_TOKEN`）。
- **数据约定**：所有公开数据需在对应 `public/data/<dataset>/README.md` 中说明来源、格式与许可，并在 `DATA_LICENSES.md` 做全局登记。

如需进一步了解业务模块，请结合 `docs/` 下的说明以及 `README_en.md` 展开阅读。

## 文档导航

- [README.md](README.md) — 项目总览与快速启动。
- [README_zh.md](README_zh.md) — 中文项目说明。
- [README_en.md](README_en.md) — English project documentation.
- [DATA_LICENSES.md](DATA_LICENSES.md) — 数据许可与来源说明。
- [REFERENCES.md](REFERENCES.md) — 项目参考文献汇总。
- [CONTRIBUTORS.md](CONTRIBUTORS.md) — 贡献者名单与联系信息。
- [public/data/](public/data/) — 数据目录（各子目录含 `README.md`）。
