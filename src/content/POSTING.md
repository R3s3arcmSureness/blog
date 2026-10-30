# 文章目录

在���目录下新建 `.md` 文件即可发布文章。

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
