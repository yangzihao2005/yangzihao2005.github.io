---
title: 传统网页搭建（HTML / CSS / JS）
description: 从零理解浏览器、HTML 标签、CSS 样式到部署到 GitHub Pages
---
# 传统网页搭建（HTML / CSS / JS）
## 浏览器是怎么工作的

HTML 文件是数据，浏览器是函数——它读取 HTML 文件的标签，把它们当成积木块搭建成页面。

![](/images/img-01.png)

颜色、大小等外观代码叫 **CSS（层叠样式表）**。

![](/images/img-02.png)

## display 属性

控制元素的显示方式：

![](/images/img-03.png)

![](/images/img-04.png)

![](/images/img-05.png)

两个具体盒子示例：

![](/images/img-06.png)

![](/images/img-07.png)

写网页就是：

![](/images/img-08.png)

## 开始写框架

`<div>` 是"分开、分隔"的意思，专门用来形成块盒子的标签。以后学网页大部分都在用它。

![](/images/img-09.png)

![](/images/img-10.png)

默认图片在左侧。给标签加样式：

![](/images/img-11.png)

![](/images/img-12.png)

**总结：**

![](/images/img-13.png)

## 部署到 GitHub Pages

现在是本地文件，网站服务器约等于一个公开的网盘：

![](/images/img-14.png)

![](/images/img-15.png)

在 GitHub 创建项目 → 提交页面 → 改设置。

有了基础界面后参考官方文档：[GitHub Pages Quickstart](https://docs.github.com/en/pages/quickstart)

## 传统三件套 vs VitePress

传统三件套写网页太繁琐了，对比一下：

| 维度 | 传统三件套 | VitePress |
|------|-----------|-----------|
| 写什么 | 写 HTML 标签、CSS 样式、JS 逻辑 | 写 Markdown（纯文本），一个 .md 文件 = 一个页面 |
| 怎么组织 | 手动管每个 HTML 文件，导航/侧边栏要手写或用 JS 生成 | 自动路由——目录结构就是页面结构，导航/侧边栏写在配置文件里 |
| 重复劳作 | 每个页面都要写 `<head>`、`<nav>`、`<footer>` | 框架搞定——主题统一渲染，只关心 `<body>` 的内容 |
| 样式 | 从头写 CSS，或引入 Bootstrap / Tailwind | 开箱即用——默认主题美观，CSS 变量改几个颜色就换皮肤 |
| 交互 | 写 JS 自己实现 | Vue 加持——Markdown 里可以直接写 Vue 组件 |
| 构建部署 | 写好 .html 直接丢服务器 | `vitepress build` → 生成静态 .html，部署方式一样 |
| 学习成本 | 低门槛但高重复 | 高起点但一劳永逸（只用学 Markdown + 配置） |

![](/images/img-16.png)
