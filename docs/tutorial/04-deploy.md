---
title: 部署到 GitHub Pages
description: Git 配置、SSH 密钥、GitHub Actions 自动部署、日常推送流程
---

# 部署到 GitHub Pages

## 前提

- 注册 GitHub 账号
- 创建仓库（用户主页必须叫 `用户名.github.io`）
- 安装了 Git

## 设置 SSH 密钥（国内访问 GitHub 需要）

```bash
# 1. 生成密钥
ssh-keygen -t ed25519 -C "你的邮箱@qq.com"

# 2. 查看公钥并复制
cat ~/.ssh/id_ed25519.pub

# 3. 打开 https://github.com/settings/keys → New SSH key → 粘贴保存

# 4. 如果 SSH 配置文件有问题，检查 ~/.ssh/config 是否有多余行
```

## 推送代码

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

## 开启 GitHub Actions 自动部署

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

## 如果第一次构建失败

构建日志里报 `dead link`：

```yaml
# 在 config.mts 里加上这一行跳过检查
ignoreDeadLinks: true
```

加完后重新 `git add -A && git commit -m "fix" && git push`。

## 每日工作流

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

## `.gitignore` 要忽略的文件

```
node_modules
docs/.vitepress/cache
docs/.vitepress/dist
```

## 踩坑速查表

| 问题 | 原因 | 解决 |
|------|------|------|
| 改了 sidebar 没反应 | 自定义 Layout 覆盖了默认主题 | 删掉 `theme/` 文件夹 |
| 图片不显示 | 语雀 CDN 防盗链 | 下载到 `public/images/` 用本地路径 |
| YAML 报错 | Frontmatter 的 `---` 不配对，或文件编码不是 UTF-8 | 用 VSCode 保存为 UTF-8 |
| "Element is missing end tag" | 正文里的 `<!--` 被当成了 HTML 注释 | 用反引号包起来 |
| `git push` 报连接被重置 | 国内 GitHub 被墙 | 用 SSH 方式推送 |
| 构建报 dead link | 存在 `localhost` 或无效链接 | 加 `ignoreDeadLinks: true` |
| 构建报 Node.js 版本警告 | Actions 运行环境更新 | 升级 `actions/setup-node` 版本（不影响运行）|
