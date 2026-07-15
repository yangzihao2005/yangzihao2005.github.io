---
title: 语雀 Markdown到VitePress
description: 语雀 Markdown → VitePress 要改 4 件事
---

# 语雀 Markdown → VitePress 要改 4 件事：
## 1. 加 Frontmatter（每个文件必须有）
```yaml
---
title: 文章标题
description: 文章简介
---
```
语雀导出的文件头部没有这玩意，VitePress 会报错。
## 2. 删掉 `<font>` 标签和 `<!--` 注释
语雀导出会带：
```html
<font color="..." style="...">文字</font>
<!-- 这是一张图片，ocr 内容为： -->
```
VSCode 正则批量替换：

| 搜索 | 替换为 |
|------|--------|
| `<font[^>]*>` | （空） |
| `</font>` | （空） |
| `<!--[\s\S]*?-->` | （空） |

## 3. 图片从 CDN 下载到本地
语雀的 https://cdn.nlark.com/... 链接有防盗链，在 VitePress 里不显示。
```bash
mkdir docs/public/images
```
把图片下载到 `docs/public/images/`，引用改为本地路径：

- 改前：`![](https://cdn.nlark.com/...)`
- 改后：`![](/images/img-01.png)`

## 4. 更新 config.mts 侧边栏

每新增一个 `.md` 文件，就要在 `config.mts` 的 `sidebar` 里加一条链接，否则页面不会出现在导航里。

## 一步到位的工作流

```
语雀写完 → 导出 Markdown → 拖到 VSCode
→ 搜索替换删 <font> 和 <!-- -->
→ 把图片拖到 docs/public/images/
→ 文件头补 frontmatter
→ config.mts 加 sidebar 链接
→ git push → GitHub Actions 自动部署
```