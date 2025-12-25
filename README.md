# Silk Road Visualization System

Research-grade web experience for exploring Silk Road transport networks across Chinese dynasties. The project blends a Vue 3 + Three.js frontend with curated GIS datasets, timeline-aware analytics, and reproducible preprocessing scripts.

Language-specific documentation:
- English: `README_en.md`
- 中文: `README_zh.md`

Quick start

```bash
git clone <repository-url>
cd silkroad_v1.0.0
npm ci
npm run dev
```

前后端运行说明

- **前端（开发）**: 在根目录执行以下命令以启动 Vite 开发服务器：

```bash
npm ci
npm run dev
```

- **前端（构建）**: 生成生产构建并本地预览：

```bash
npm run build
npm run preview
```

- **后端（开发 / 代理）**: 后端服务位于 `server/` 目录，使用 Express 提供简单的代理与 AI 转发接口。可以按如下步骤启动：

```bash
cd server
npm ci
npm start
```

或者从项目根目录使用 `--prefix`（在 CI 或脚本中常用）：

```bash
npm --prefix server ci
npm --prefix server start
```

- **后端环境变量**: 后端使用 `dotenv`，可在 `server/` 下创建一个 `.env` 文件设置可选与必需的变量：

```env
# server/.env 示例
PORT=3000
SILICONFLOW_API_KEY=your_api_key_here
SILICONFLOW_API_URL=https://api.siliconflow.cn/v1

# 思考模式使用的模型（支持深度推理）
THINKING_MODEL_ID=zai-org/GLM-4.6V
# 快速模式使用的模型（直接回答）
FAST_MODEL_ID=Qwen/Qwen3-VL-235B-A22B-Instruct

# 可选：设置请求体大小上限（例如 '10mb'、'50mb'），用于上传大图像或较大 payload
BODY_PARSER_LIMIT=10mb
```

`SILICONFLOW_API_KEY` 可选但建议配置以启用代理向上游模型服务的请求；不设置时服务会返回兜底文本。

更多细节请参考 `server/index.js` 中的注释与逻辑。

## Documentation Navigation


- [README.md](README.md): Project overview and quick start (this file).
- [README_en.md](README_en.md): English project documentation.
- [README_zh.md](README_zh.md): Chinese project documentation.
- [DATA_LICENSES.md](DATA_LICENSES.md): Data licenses and usage instructions — review before reuse.
- [REFERENCES.md](REFERENCES.md): Academic citation records (BibTeX / APA formats available).
- [CONTRIBUTORS.md](CONTRIBUTORS.md): List of contributors and maintainers.
- [public/data/lianghan/README.md](public/data/lianghan/README.md): Example dataset README with schema and provenance.

Click these links to jump to corresponding documentation or dataset READMEs in the repository for license and provenance details.

Key locations
- Source code and UI modules: `src/`
- Data collections and per-dataset guides: `public/data/`
- Processing and QA scripts: `scripts/`
- Licenses, citations, provenance: `DATA_LICENSES.md`, `REFERENCES.md`

License
- Code: MIT (`LICENSE`).
- Data: dataset-specific terms apply—check `DATA_LICENSES.md` and `public/data/*/README.md` before reuse.

Head to `README_en.md` or `README_zh.md` for full feature breakdowns, pipeline details, and contribution guidelines.
