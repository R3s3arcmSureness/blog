# R3s3arcm Blog

> 逆向工程 · 安全研究 · Agent 安全

个人技术博客，托管在 GitHub Pages。技术栈：[Astro](https://astro.build)。

## 本地开发

```bash
npm install
npm run dev      # 开发服务器
npm run build    # 构建到 dist/
npm run preview  # 预览构建产物
```

## 目录结构

```
src/
├── components/     组件
├── content/blog/   文章（Markdown）
├── layouts/        布局
├── pages/          路由
├── styles/         全局样式
└── config.ts       站点配置
```

## 部署

推送到 `main` 分支后，由 GitHub Actions 自动构建并发布到 GitHub Pages。

## 许可证

文章内容采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)，
代码采用 [MIT](LICENSE)。
