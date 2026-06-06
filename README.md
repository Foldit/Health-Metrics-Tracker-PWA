# Health-Metrics-Tracker-PWA

本项目是面向中老年用户的本地优先健康记录工具，支持离线使用与安装为 PWA（渐进式 Web 应用）。

**主要功能**
- Dashboard：今日摘要、快捷录入、最近记录
- 指标录入：血压 / 血糖 / 心率 / 体重（弹窗表单）
- 趋势分析：7/30/90 天视图、异常点高亮、统计信息
- 报告输出：可导出图片、PDF
- 设置：用户信息与正常范围配置
- 离线优先 & 可安装（PWA）

**技术栈**
- Vue 3 + TypeScript + Vite
- Vant + TailwindCSS
- Pinia + Vue Router
- Dexie (IndexedDB)
- Chart.js + Anime.js
- Dayjs + VueUse
- vite-plugin-pwa

**快速开始（本地开发）**

1. 安装依赖

```bash
npm install
```

2. 启动开发服务器

```bash
npm run dev
```

项目中可用的脚本（来自 `package.json`）:

- `dev`: 启动 Vite 开发服务器
- `build`: 运行类型检查并构建生产包（`vue-tsc -b && vite build`）
- `preview`: 本地预览构建产物（`vite preview`）

**PWA 与离线**

- 使用 `vite-plugin-pwa`，Service Worker 由插件自动注册（`registerType: 'autoUpdate'`），运行时缓存策略为 Stale-While-Revalidate。应用清单（manifest）在 `vite.config.ts` 中定义，应用名为 “健康指标追踪器”。
- 在支持的浏览器中打开后可通过浏览器菜单安装应用，安装后可离线访问多数静态资源与缓存的数据。

**构建与预览**

```bash
npm run build
npm run preview
```

**开发提示**
- 配置与静态资产（图标）位于根目录，若需调整 PWA 元数据请编辑 `vite.config.ts`。
- 数据持久层使用 Dexie（IndexedDB），数据库管理位于 `src/db` 下。

**贡献**

欢迎 Issue 与 PR。建议在更改前创建 issue 讨论设计与行为变更。

**许可证**

详见项目根目录 `LICENSE`。
