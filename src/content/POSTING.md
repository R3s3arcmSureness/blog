# 文章目录

在 `blog/src/content/blog/` 目录下新建 `.md` 文件即可发布文章。

> 完整路径：`C:\Users\42283\Documents\blog\src\content\blog\`

## frontmatter 字段

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `title` | string | 是 | 文章标题 |
| `description` | string | 是 | 摘要，显示在列表页和 SEO meta |
| `pubDate` | date | 是 | 发布日期 |
| `updatedDate` | date | 否 | 最后更新日期 |
| `tags` | string[] | 否 | 标签，默认 `[]` |
| `featured` | boolean | 否 | 是否精选，默认 `false` |
| `draft` | boolean | 否 | 草稿不发布，默认 `false` |
| `readingTime` | string | 否 | 阅读时长，如 "8 分钟" |

## 示例

```markdown
---
title: '文章标题'
description: '一句话摘要'
pubDate: 2026-11-01
tags: ['Security']
---

正文内容，支持 Markdown 与代码高亮。
```

文件名会成为访问路径，例如 `my-post.md` → `/posts/my-post/`。
放进子目录也可以，例如 `reverse/ast-analyzer.md` → `/posts/reverse/ast-analyzer/`。

## 发布流程

写好 `.md` 后，在**项目根目录**（`C:\Users\42283\Documents\blog`）双击 `publish.bat`：

1. 本地构建校验（frontmatter 缺字段会在这里报错，不会推到线上）
2. `git add` + `git commit`
3. `git push origin main`
4. GitHub Actions 自动重新部署，约 1~2 分钟后上线

线上地址：<https://r3s3arcmsureness.github.io/blog/>

### 手动等价命令

```bash
cd /c/Users/42283/Documents/blog
npm run build          # 可选：先本地校验
git add -A
git commit -m "post: 新文章标题"
git push origin main
```

## 注意事项

- `title` / `description` / `pubDate` 三个字段**必填**，缺任意一个构建会失败。
- `draft: true` 的文章不会出现在列表页和首页，适合先存草稿。
- 发布后如果想撤回，把 `draft` 改成 `true` 再跑一次 `publish.bat` 即可。
- 代码块用标准 Markdown 三反引号即可，shiki 会自动高亮：

````markdown
```python
def hello():
    print("hi")
```
````
