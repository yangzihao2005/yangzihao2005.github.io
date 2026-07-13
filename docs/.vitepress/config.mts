import { defineConfig } from 'vitepress'

export default defineConfig({
    // === 站点级配置 ===
  title: 'Yzh知识库',
  description: '个人学习记录',
  lang: 'zh-CN',
  base: '/',     // 用户主页部署，根路径
  srcDir: '.',             // Markdown 源目录（默认项目根目录）
  outDir: '.vitepress/dist', // 构建输出目录
  cleanUrls: true,         // 生成无 .html 后缀的 URL
  ignoreDeadLinks: true,   // 忽略死链接检查

  // === 主题配置 ===
  themeConfig: {
    // 导航栏（顶部）
    nav: [
      { text: '首页', link: '/' },
      { text: '教程', link: '/tutorial/01-traditional' },
      { text: '工具', link: '/tools/dev-tools' },
    ],
    // 侧边栏（左侧目录）注意这个在主页中不会显示，只有在有侧边栏的页面中才会显示
    sidebar: {
      '/tutorial/': [
        {
          text: 'VitePress 搭建教程',
          items: [
            { text: '1. 传统网页搭建', link: '/tutorial/01-traditional' },
            { text: '2. VitePress 配置指南', link: '/tutorial/02-vitepress' },
            { text: '3. 语雀笔记部署指南', link: '/tutorial/03-yuque' },
            { text: '4. 部署到 GitHub Pages', link: '/tutorial/04-deploy' },
          ],
        },
        {
          text: 'Leetcode好题链接',
          items: [
            { text: '数据结构', link: '/tutorial/05-leetcode1' },
          ]
        }
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
    // 社交链接（右上角图标）
    socialLinks: [
      { icon: 'github', link: 'https://github.com/yangzihao2005/yangzihao2005.github.io' }
    ],
    // 最近更新时间
    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'short',
      }
    },
    // Logo（显示在导航栏标题前）
    logo: '/logo.png',

  }
})