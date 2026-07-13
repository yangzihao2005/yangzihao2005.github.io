---
title: 从零搭建 VitePress 到 GitHub Pages 完整总结
description: 涵盖安装、配置、语雀笔记迁移、Git 部署、踩坑记录的全流程指南
---

# 从零搭建 VitePress 到 GitHub Pages

## 一、技术栈

```
VitePress（静态站点生成器）
+ GitHub Pages（免费托管）
+ GitHub Actions（自动部署）
```

最终成果：写 Markdown → git push → 网站自动更新。

## 二、前置环境

### 安装 Node.js

下载地址：https://nodejs.org/ （安装 LTS 版本）

Node.js 是 JavaScript 的运行环境，VitePress 依赖它把 .md 文件编译成 .html。

### 安装 VitePress

```bash
# 创建项目文件夹
mkdir mybook
cd mybook

# 初始化 package.json
npm init -y

# 安装 VitePress
npm install -D vitepress@next

# 运行初始化向导（生成目录结构）
npx vitepress init
```

## 三、大坑：初始化向导选了 Custom Theme

### 问题

`npx vitepress init` 时如果选了 **Custom Theme（自定义主题）**，VitePress 会在 `.vitepress/theme/` 下生成 `Layout.vue` 和 `index.ts`。

这个自定义 Layout **完全替换了默认主题**，导致你后续在 `config.mts` 里配的 `nav`、`sidebar` 全都不生效——页面永远显示初始化模板。

### 症状

改 `config.mts` 的导航和侧边栏，浏览器刷新没变化，还是那几行默认链接。

### 解决

```bash
# 删除整个 theme 文件夹，VitePress 就会自动使用内置默认主题
rm -rf docs/.vitepress/theme
```

**选 Default Theme 就没有这个问题。** 如果已经踩坑了，删掉 `theme/` 就行。

## 四、核心：配置文件 `config.mts`

位置：`docs/.vitepress/config.mts`

```ts
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Yzh知识库',
  description: '个人学习记录',
  lang: 'zh-CN',
  base: '/',                   // 用户主页填 '/'，项目主页填 '/仓库名/'
  cleanUrls: true,             // URL 不带 .html
  ignoreDeadLinks: true,       // 忽略死链接检查（构建时用）

  themeConfig: {
    nav: [                     // 顶部导航栏
      { text: '首页', link: '/' },
      { text: '教程', link: '/tutorial/01-traditional' },
    ],
    sidebar: {                 // 左侧侧边栏
      '/tutorial/': [
        {
          text: '教程系列',
          items: [
            { text: '第一章', link: '/tutorial/chapter-1' },
          ],
        },
      ],
    },
    socialLinks: [             // 右上角社交图标
      { icon: 'github', link: 'https://github.com/用户名/仓库名' },
    ],
    lastUpdated: {             // 显示最后更新时间
      text: '最后更新于',
      formatOptions: { dateStyle: 'short', timeStyle: 'short' },
    },
  },
})
```

关键点：
- `base` 要填对：用户主页（用户名.github.io）填 `/`；项目主页填 `/仓库名/`
- `sidebar` 的 key（如 `/tutorial/`）要跟目录名一致
- 新增 `.md` 文件后，一定要在 `sidebar` 里加一条链接，否则不会出现在侧边栏

## 五、写内容

在 `docs/` 下创建 `.md` 文件即可，目录结构决定 URL：

```
docs/
├─ index.md                  →  https://xxx.github.io/
├─ tutorial/
│  ├─ 01-start.md            →  https://xxx.github.io/tutorial/01-start
│  └─ 02-guide.md            →  https://xxx.github.io/tutorial/02-guide
└─ tools/
   └─ dev-tools.md           →  https://xxx.github.io/tools/dev-tools
```

每篇文章顶部加 Frontmatter：

```yaml
---
title: 文章标题
description: 文章简介
---
```

## 六、语雀笔记导入

### 语雀导出 Markdown 的问题

语雀导出的文件有 3 个毛病：

1. **没有 Frontmatter** → 自己补上 `--- title / description ---`
2. **`<font>` 标签** → VSCode 搜索 `<font[^>]*>` 替换为空
3. **`<!-- OCR 注释 -->`** → VSCode 搜索 `<!--[\s\S]*?-->` 替换为空

### 图片问题

语雀的图片链接 `cdn.nlark.com` 有防盗链，在 VitePress 里不显示。要下载到本地：

```bash
mkdir docs/public/images
```

然后把图片文件放进去，引用路径改为 `/images/xxx.png`。

## 七、部署到 GitHub Pages

### 前提

- 注册 GitHub 账号
- 创建仓库（用户主页必须叫 `用户名.github.io`）
- 安装了 Git

### 设置 SSH 密钥（国内访问 GitHub 需要）

```bash
# 1. 生成密钥
ssh-keygen -t ed25519 -C "你的邮箱@qq.com"

# 2. 查看公钥并复制
cat ~/.ssh/id_ed25519.pub

# 3. 打开 https://github.com/settings/keys → New SSH key → 粘贴保存

# 4. 如果 SSH 配置文件有问题，检查 ~/.ssh/config 是否有多余行
```

### 推送代码

```bash
# 初始化 Git
git init

# 添加远程仓库
git remote add origin git@github.com:用户名/用户名.github.io.git

# 分支改名
git branch -M main

# 第一次推送（加 -u 建立追踪）
git add -A
git commit -m "初始化 VitePress 知识库"
git push -u origin main

# 如果远程已有内容需要覆盖，加 --force
git push -u origin main --force
```

### 开启 GitHub Actions 自动部署

1. 在项目根目录创建 `.github/workflows/deploy.yml`
2. 填入以下内容：

```yaml
name: Deploy VitePress site to Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run docs:build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: docs/.vitepress/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
```

3. 去 GitHub 仓库 Settings → Pages → **Source 选 GitHub Actions**
4. 以后每次 `git push` 到 main 分支，自动构建并部署

### 第一次构建失败怎么办

常见原因：构建日志里报 `dead link`。

```yaml
# 在 config.mts 里加上这一行跳过检查
ignoreDeadLinks: true
```

加完后重新 `git add -A && git commit -m "fix" && git push`。

## 八、每日工作流

```bash
# 写笔记 → 在 docs/ 下新建 .md 文件
# 补上 frontmatter
# 在 config.mts 的 sidebar 里加链接
# 然后

git add -A
git commit -m "新增 XX 笔记"
git push

# 等 1-2 分钟，网站自动更新
```

## 九、`.gitignore` 要忽略的文件

```
node_modules
docs/.vitepress/cache
docs/.vitepress/dist
```

## 十、踩坑速查表

| 问题 | 原因 | 解决 |
|------|------|------|
| 改了 sidebar 没反应 | 自定义 Layout 覆盖了默认主题 | 删掉 `theme/` 文件夹 |
| 图片不显示 | 语雀 CDN 防盗链 | 下载到 `public/images/` 用本地路径 |
| YAML 报错 | Frontmatter 的 `---` 不配对，或文件编码不是 UTF-8 | 用 VSCode 保存为 UTF-8 |
| "Element is missing end tag" | 正文里的 `<!--` 被当成了 HTML 注释 | 用反引号包起来 |
| `git push` 报连接被重置 | 国内 GitHub 被墙 | 用 SSH 方式推送 |
| 构建报 dead link | 存在 `localhost` 或无效链接 | 加 `ignoreDeadLinks: true` |
| 构建报 Node.js 版本警告 | Actions 运行环境更新 | 升级 `actions/setup-node` 版本（不影响运行）|
