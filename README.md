# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).

## 开发（本项目特定说明）

如果你修改了前端依赖（例如新增 `@headlessui/vue`），请在项目根目录运行安装命令：

Windows (cmd.exe):

```
npm install @headlessui/vue
```

或者同时安装建议的图标库（可选）：

```
npm install @heroicons/vue
```

确保你已在 Vite 环境中提供 Mapbox Token，否则地图无法加载。示例（Windows cmd.exe）:

```
:: 临时在当前命令行会话中设置
set VITE_MAPBOX_TOKEN=your_mapbox_token_here

:: 然后启动开发服务器
npm run dev
```

如果你希望永久设置环境变量，请在项目根新建或编辑 `.env` 文件，添加：

```
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

运行开发服务器后，打开以下路由以验证页面：

- 唐代交通: `http://localhost:3000/#/transport`
- 明清城区: `http://localhost:3000/#/mingqing`

安装依赖后，如果你在控制台或 IDE 中看到 TypeScript 报错（例如找不到 `@headlessui/vue` 的类型或模块），告诉我报错内容，我会帮你定位并修复（例如加类型声明或调整导入）。
