---
title: VitePress 搭建与配置指南
description: 从 Node.js 前置知识到 VitePress 安装、配置、导航栏、主页、部署的完整笔记
---
# VitePress 搭建与配置指南
## VitePress 是什么

VitePress 是一个[静态站点生成器](https://en.wikipedia.org/wiki/Static_site_generator) (SSG)，专为构建快速、以内容为中心的站点而设计。简而言之，VitePress 获取用 Markdown 编写的内容，对其应用主题，并生成可以轻松部署到任何地方的静态 HTML 页面。

如果我们利用 VitePress 搭建网页到 GitHub Pages 上，工作流如下：

1. **生产车间（你的电脑）**：打开文件夹，新建 `.md` 文件，用 Markdown 语法写学习笔记
2. **加工机器（VitePress）**：运行 `npm run docs:build`，VitePress 把平淡的文本打包成漂亮的带导航带目录的静态 HTML 网页
3. **仓库与展柜（GitHub）**：因为输出全是"静态 HTML"，GitHub 不需要运行代码，只负责把 HTML 文件挂到网上
4. **最终成果（互联网）**：用户输入网址，任何设备都能完美访问

![](/images/img-17.png)

## 前置环境：Node.js

通俗理解：**Node.js 是"JavaScript 的厨房"**。

- **以前（浏览器时代）**：JavaScript 像一个"只能在小烤箱（浏览器）里做菜"的厨师。没有浏览器，JavaScript 代码就跑不起来。
- **现在（Node.js）**：Node.js 给你买了一个"可以独立运转的厨房"。它让 JavaScript 代码**脱离浏览器**，直接在电脑系统里运行。

**在 VitePress 项目里，Node.js 在干什么？** 它就是你那个黑色命令行（CMD）的**幕后引擎**。当你输入 `npm run docs:dev` 时，Node.js 就在后台工作，用 JavaScript 读取你的 `.md` 文件，加工成网页，然后送到你的浏览器里。**没有 Node.js，VitePress 就跑不起来。**

![](/images/img-18.png)

## 安装 VitePress

### 1. 创建文件夹

建立一个文件夹，在路径处输入 `cmd` 后回车打开命令行：

![](/images/img-19.png)

![](/images/img-20.png)

### 2. 安装 VitePress 依赖

```bash
npm add -D vitepress@next
```

![](/images/img-21.png)

### 3. 运行初始化向导

```bash
npx vitepress init
```

初始化向导会问你几个问题：配置文件放哪、Markdown 文件在哪、站点标题/描述、是否用 TypeScript 等。

![](/images/img-22.png)

### 4. 查看文件结构

```
my-book/
├─ docs/                      # 项目根目录
│  ├─ .vitepress/
│  │  └─ config.mts           # 核心配置文件
│  ├─ index.md                # 首页
│  ├─ tutorial/               # 教程目录
│  │  ├─ 01-traditional.md
│  │  └─ 02-vitepress.md
│  └─ tools/                  # 工具目录
│     ├─ dev-tools.md
│     └─ study-links.md
└─ package.json
```

`docs` 目录是项目**根目录**，`.vitepress` 是配置/缓存/构建输出目录。

![](/images/img-23.png)

### 5. 修改配置文件

第一次先搭建"VitePress 搭建教程"和"工具链接收藏"这两块，因此要修改 `config.mts`。

使用 VSCode 打开 `docs/.vitepress/config.mts`：

```ts
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Yzh知识库",
  description: "个人学习记录",
  themeConfig: {
    sidebar: [
      {
        text: 'VitePress 搭建教程',
        items: [
          { text: '1. 认识 VitePress', link: '/tutorial/01-traditional' }
        ]
      }
    ]
  }
})
```

### 6. 运行开发服务器

```bash
npm run docs:dev
```

打开 [http://localhost:5173/](http://localhost:5173/) 即可在本地预览。

::: tip 如果改了配置没效果
删掉自定义主题文件即可：删除 `docs/.vitepress/theme/` 整个文件夹，VitePress 就会自动使用默认主题。
:::

## 配置导航栏

导航栏就是页面顶部的菜单。在 `config.mts` 中配置：

```ts
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Yzh知识库',
  description: '个人学习记录',
  lang: 'zh-CN',
  base: '/repo-name/',
  cleanUrls: true,

  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '教程', link: '/tutorial/01-traditional' },
      { text: '工具', link: '/tools/dev-tools' },
    ],

    sidebar: {
      '/tutorial/': [
        {
          text: 'VitePress 搭建教程',
          items: [
            { text: '1. 传统网页搭建', link: '/tutorial/01-traditional' },
            { text: '2. VitePress 配置', link: '/tutorial/02-vitepress' },
          ],
        },
      ],
      '/tools/': [
        {
          text: '工具与链接收藏',
          items: [
            { text: '常用开发工具', link: '/tools/dev-tools' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/yangzihao2005/yangzihao2005.github.io' }
    ],

    lastUpdated: {
      text: '最后更新于',
      formatOptions: { dateStyle: 'short', timeStyle: 'short' }
    },

    logo: '/logo.png',
  }
})
```

## 配置主页面

首页使用 `layout: home` 布局，支持 hero（大标题区）+ features（功能卡片）：

```yaml
---
layout: home

hero:
  name: "Yzh知识库"
  text: "被知识灌溉者"
  tagline: 像一棵树一样，慢慢生长，不断积累
  image:
    src: /logo1.png
    alt: logo1
  actions:
    - theme: brand
      text: 搭建教程
      link: /tutorial/01-traditional
    - theme: alt
      text: 工具收藏
      link: /tools/dev-tools

features:
  - icon: 📖
    title: VitePress 搭建教程
    details: 从零开始学习 VitePress，搭建属于自己的知识网站
    link: /tutorial/01-traditional
  - icon: 🔗
    title: 工具与链接收藏
    details: 收集开发工具、学习资源，打造高效工作流
    link: /tools/dev-tools
  - icon: 🌱
    title: 持续更新中
    details: 语雀笔记正在逐步整理迁移，知识树会越来越茂盛
---
```

## 部署到 GitHub Pages

### 第一步：设置 base

如果部署到 `https://用户名.github.io/仓库名/`，需设置 `base: '/仓库名/'`。

如果部署到 `https://用户名.github.io/`（个人主页），则 `base: '/'`。

### 第二步：创建 GitHub Actions 工作流

在项目根目录创建 `.github/workflows/deploy.yml`：

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

### 第三步：仓库设置

1. 推送代码到 GitHub 仓库
2. 进入仓库 Settings → Pages
3. **Build and deployment** 选 **GitHub Actions**
4. 以后每次 `git push` 到 `main` 分支，自动构建并部署
